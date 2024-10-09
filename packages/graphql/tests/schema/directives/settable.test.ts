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
import { Neo4jGraphQL } from "../../../src";
import { TestSubscriptionsEngine } from "../../utils/TestSubscriptionsEngine";

describe("@settable", () => {
    let subscriptionMechanism: TestSubscriptionsEngine;

    beforeAll(() => {
        subscriptionMechanism = new TestSubscriptionsEngine();
    });

    test("Disable create fields", async () => {
        const typeDefs = gql`
            type Movie @query(aggregate: true) @node {
                title: String!
                description: String @settable(onCreate: false, onUpdate: true)
            }
        `;
        const neoSchema = new Neo4jGraphQL({ typeDefs });
        const printedSchema = printSchemaWithDirectives(lexicographicSortSchema(await neoSchema.getSchema()));
        expect(printedSchema).toMatchInlineSnapshot(`
            "schema {
              query: Query
              mutation: Mutation
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

            type Movie {
              description: String
              title: String!
            }

            type MovieAggregateSelection {
              count: Int!
              description: StringAggregateSelection!
              title: StringAggregateSelection!
            }

            input MovieCreateInput {
              title: String!
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
              description: SortDirection
              title: SortDirection
            }

            input MovieUpdateInput {
              description: String
              title: String
            }

            input MovieWhere {
              AND: [MovieWhere!]
              NOT: MovieWhere
              OR: [MovieWhere!]
              description: String @deprecated(reason: \\"Please use the explicit _EQ version\\")
              description_CONTAINS: String
              description_ENDS_WITH: String
              description_EQ: String
              description_IN: [String]
              description_STARTS_WITH: String
              title: String @deprecated(reason: \\"Please use the explicit _EQ version\\")
              title_CONTAINS: String
              title_ENDS_WITH: String
              title_EQ: String
              title_IN: [String!]
              title_STARTS_WITH: String
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
              movies(limit: Int, offset: Int, options: MovieOptions @deprecated(reason: \\"Query options argument is deprecated, please use pagination arguments like limit, offset and sort instead.\\"), sort: [MovieSort!], where: MovieWhere): [Movie!]!
              moviesAggregate(where: MovieWhere): MovieAggregateSelection!
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

    test("Disable update fields", async () => {
        const typeDefs = gql`
            type Movie @query(aggregate: true) @node {
                title: String!
                description: String @settable(onCreate: true, onUpdate: false)
            }
        `;
        const neoSchema = new Neo4jGraphQL({ typeDefs });
        const printedSchema = printSchemaWithDirectives(lexicographicSortSchema(await neoSchema.getSchema()));
        expect(printedSchema).toMatchInlineSnapshot(`
            "schema {
              query: Query
              mutation: Mutation
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

            type Movie {
              description: String
              title: String!
            }

            type MovieAggregateSelection {
              count: Int!
              description: StringAggregateSelection!
              title: StringAggregateSelection!
            }

            input MovieCreateInput {
              description: String
              title: String!
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
              description: SortDirection
              title: SortDirection
            }

            input MovieUpdateInput {
              title: String
            }

            input MovieWhere {
              AND: [MovieWhere!]
              NOT: MovieWhere
              OR: [MovieWhere!]
              description: String @deprecated(reason: \\"Please use the explicit _EQ version\\")
              description_CONTAINS: String
              description_ENDS_WITH: String
              description_EQ: String
              description_IN: [String]
              description_STARTS_WITH: String
              title: String @deprecated(reason: \\"Please use the explicit _EQ version\\")
              title_CONTAINS: String
              title_ENDS_WITH: String
              title_EQ: String
              title_IN: [String!]
              title_STARTS_WITH: String
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
              movies(limit: Int, offset: Int, options: MovieOptions @deprecated(reason: \\"Query options argument is deprecated, please use pagination arguments like limit, offset and sort instead.\\"), sort: [MovieSort!], where: MovieWhere): [Movie!]!
              moviesAggregate(where: MovieWhere): MovieAggregateSelection!
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

    test("Disable create and update fields", async () => {
        const typeDefs = gql`
            type Movie @query(aggregate: true) @node {
                title: String!
                description: String @settable(onCreate: false, onUpdate: false)
            }
        `;
        const neoSchema = new Neo4jGraphQL({ typeDefs, features: { subscriptions: subscriptionMechanism } });
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
              description: String
              title: String!
            }

            type MovieAggregateSelection {
              count: Int!
              description: StringAggregateSelection!
              title: StringAggregateSelection!
            }

            input MovieCreateInput {
              title: String!
            }

            type MovieCreatedEvent {
              createdMovie: MovieEventPayload!
              event: EventType!
              timestamp: Float!
            }

            type MovieDeletedEvent {
              deletedMovie: MovieEventPayload!
              event: EventType!
              timestamp: Float!
            }

            type MovieEdge {
              cursor: String!
              node: Movie!
            }

            type MovieEventPayload {
              description: String
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
              description: SortDirection
              title: SortDirection
            }

            input MovieSubscriptionWhere {
              AND: [MovieSubscriptionWhere!]
              NOT: MovieSubscriptionWhere
              OR: [MovieSubscriptionWhere!]
              description: String @deprecated(reason: \\"Please use the explicit _EQ version\\")
              description_CONTAINS: String
              description_ENDS_WITH: String
              description_EQ: String
              description_IN: [String]
              description_STARTS_WITH: String
              title: String @deprecated(reason: \\"Please use the explicit _EQ version\\")
              title_CONTAINS: String
              title_ENDS_WITH: String
              title_EQ: String
              title_IN: [String!]
              title_STARTS_WITH: String
            }

            input MovieUpdateInput {
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
              description: String @deprecated(reason: \\"Please use the explicit _EQ version\\")
              description_CONTAINS: String
              description_ENDS_WITH: String
              description_EQ: String
              description_IN: [String]
              description_STARTS_WITH: String
              title: String @deprecated(reason: \\"Please use the explicit _EQ version\\")
              title_CONTAINS: String
              title_ENDS_WITH: String
              title_EQ: String
              title_IN: [String!]
              title_STARTS_WITH: String
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
              movies(limit: Int, offset: Int, options: MovieOptions @deprecated(reason: \\"Query options argument is deprecated, please use pagination arguments like limit, offset and sort instead.\\"), sort: [MovieSort!], where: MovieWhere): [Movie!]!
              moviesAggregate(where: MovieWhere): MovieAggregateSelection!
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
              movieCreated(where: MovieSubscriptionWhere): MovieCreatedEvent!
              movieDeleted(where: MovieSubscriptionWhere): MovieDeletedEvent!
              movieUpdated(where: MovieSubscriptionWhere): MovieUpdatedEvent!
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

    describe("Relationships to a concrete type", () => {
        test("Prevent relationship field creation", async () => {
            const typeDefs = gql`
                type Movie @query(aggregate: true) @node {
                    title: String!
                    description: String
                }

                type Actor @query(aggregate: true) @node {
                    name: String!
                    actedIn: [Movie!]!
                        @relationship(type: "ACTED_IN", direction: OUT)
                        @settable(onCreate: false, onUpdate: true)
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
                  actedIn(directed: Boolean = true, limit: Int, offset: Int, options: MovieOptions @deprecated(reason: \\"Query options argument is deprecated, please use pagination arguments like limit, offset and sort instead.\\"), sort: [MovieSort!], where: MovieWhere): [Movie!]!
                  actedInAggregate(directed: Boolean = true, where: MovieWhere): ActorMovieActedInAggregationSelection
                  actedInConnection(after: String, directed: Boolean = true, first: Int, sort: [ActorActedInConnectionSort!], where: ActorActedInConnectionWhere): ActorActedInConnection!
                  name: String!
                }

                input ActorActedInAggregateInput {
                  AND: [ActorActedInAggregateInput!]
                  NOT: ActorActedInAggregateInput
                  OR: [ActorActedInAggregateInput!]
                  count: Int @deprecated(reason: \\"Please use the explicit _EQ version\\")
                  count_EQ: Int
                  count_GT: Int
                  count_GTE: Int
                  count_LT: Int
                  count_LTE: Int
                  node: ActorActedInNodeAggregationWhereInput
                }

                input ActorActedInConnectFieldInput {
                  \\"\\"\\"
                  Whether or not to overwrite any matching relationship with the new properties.
                  \\"\\"\\"
                  overwrite: Boolean! = true
                  where: MovieConnectWhere
                }

                type ActorActedInConnection {
                  edges: [ActorActedInRelationship!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
                }

                input ActorActedInConnectionSort {
                  node: MovieSort
                }

                input ActorActedInConnectionWhere {
                  AND: [ActorActedInConnectionWhere!]
                  NOT: ActorActedInConnectionWhere
                  OR: [ActorActedInConnectionWhere!]
                  node: MovieWhere
                }

                input ActorActedInCreateFieldInput {
                  node: MovieCreateInput!
                }

                input ActorActedInDeleteFieldInput {
                  where: ActorActedInConnectionWhere
                }

                input ActorActedInDisconnectFieldInput {
                  where: ActorActedInConnectionWhere
                }

                input ActorActedInNodeAggregationWhereInput {
                  AND: [ActorActedInNodeAggregationWhereInput!]
                  NOT: ActorActedInNodeAggregationWhereInput
                  OR: [ActorActedInNodeAggregationWhereInput!]
                  description_AVERAGE_EQUAL: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                  description_AVERAGE_GT: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                  description_AVERAGE_GTE: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                  description_AVERAGE_LENGTH_EQUAL: Float
                  description_AVERAGE_LENGTH_GT: Float
                  description_AVERAGE_LENGTH_GTE: Float
                  description_AVERAGE_LENGTH_LT: Float
                  description_AVERAGE_LENGTH_LTE: Float
                  description_AVERAGE_LT: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                  description_AVERAGE_LTE: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                  description_EQUAL: String @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
                  description_GT: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
                  description_GTE: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
                  description_LONGEST_EQUAL: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                  description_LONGEST_GT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                  description_LONGEST_GTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                  description_LONGEST_LENGTH_EQUAL: Int
                  description_LONGEST_LENGTH_GT: Int
                  description_LONGEST_LENGTH_GTE: Int
                  description_LONGEST_LENGTH_LT: Int
                  description_LONGEST_LENGTH_LTE: Int
                  description_LONGEST_LT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                  description_LONGEST_LTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                  description_LT: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
                  description_LTE: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
                  description_SHORTEST_EQUAL: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                  description_SHORTEST_GT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                  description_SHORTEST_GTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                  description_SHORTEST_LENGTH_EQUAL: Int
                  description_SHORTEST_LENGTH_GT: Int
                  description_SHORTEST_LENGTH_GTE: Int
                  description_SHORTEST_LENGTH_LT: Int
                  description_SHORTEST_LENGTH_LTE: Int
                  description_SHORTEST_LT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                  description_SHORTEST_LTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
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

                type ActorActedInRelationship {
                  cursor: String!
                  node: Movie!
                }

                input ActorActedInUpdateConnectionInput {
                  node: MovieUpdateInput
                }

                input ActorActedInUpdateFieldInput {
                  connect: [ActorActedInConnectFieldInput!]
                  create: [ActorActedInCreateFieldInput!]
                  delete: [ActorActedInDeleteFieldInput!]
                  disconnect: [ActorActedInDisconnectFieldInput!]
                  update: ActorActedInUpdateConnectionInput
                  where: ActorActedInConnectionWhere
                }

                type ActorAggregateSelection {
                  count: Int!
                  name: StringAggregateSelection!
                }

                input ActorConnectInput {
                  actedIn: [ActorActedInConnectFieldInput!]
                }

                input ActorCreateInput {
                  name: String!
                }

                input ActorDeleteInput {
                  actedIn: [ActorActedInDeleteFieldInput!]
                }

                input ActorDisconnectInput {
                  actedIn: [ActorActedInDisconnectFieldInput!]
                }

                type ActorEdge {
                  cursor: String!
                  node: Actor!
                }

                type ActorMovieActedInAggregationSelection {
                  count: Int!
                  node: ActorMovieActedInNodeAggregateSelection
                }

                type ActorMovieActedInNodeAggregateSelection {
                  description: StringAggregateSelection!
                  title: StringAggregateSelection!
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
                  actedIn: [ActorActedInCreateFieldInput!]
                }

                \\"\\"\\"
                Fields to sort Actors by. The order in which sorts are applied is not guaranteed when specifying many fields in one ActorSort object.
                \\"\\"\\"
                input ActorSort {
                  name: SortDirection
                }

                input ActorUpdateInput {
                  actedIn: [ActorActedInUpdateFieldInput!]
                  name: String
                }

                input ActorWhere {
                  AND: [ActorWhere!]
                  NOT: ActorWhere
                  OR: [ActorWhere!]
                  actedIn: MovieWhere @deprecated(reason: \\"Use \`actedIn_SOME\` instead.\\")
                  actedInAggregate: ActorActedInAggregateInput
                  actedInConnection: ActorActedInConnectionWhere @deprecated(reason: \\"Use \`actedInConnection_SOME\` instead.\\")
                  \\"\\"\\"
                  Return Actors where all of the related ActorActedInConnections match this filter
                  \\"\\"\\"
                  actedInConnection_ALL: ActorActedInConnectionWhere
                  \\"\\"\\"
                  Return Actors where none of the related ActorActedInConnections match this filter
                  \\"\\"\\"
                  actedInConnection_NONE: ActorActedInConnectionWhere
                  \\"\\"\\"
                  Return Actors where one of the related ActorActedInConnections match this filter
                  \\"\\"\\"
                  actedInConnection_SINGLE: ActorActedInConnectionWhere
                  \\"\\"\\"
                  Return Actors where some of the related ActorActedInConnections match this filter
                  \\"\\"\\"
                  actedInConnection_SOME: ActorActedInConnectionWhere
                  \\"\\"\\"Return Actors where all of the related Movies match this filter\\"\\"\\"
                  actedIn_ALL: MovieWhere
                  \\"\\"\\"Return Actors where none of the related Movies match this filter\\"\\"\\"
                  actedIn_NONE: MovieWhere
                  \\"\\"\\"Return Actors where one of the related Movies match this filter\\"\\"\\"
                  actedIn_SINGLE: MovieWhere
                  \\"\\"\\"Return Actors where some of the related Movies match this filter\\"\\"\\"
                  actedIn_SOME: MovieWhere
                  name: String @deprecated(reason: \\"Please use the explicit _EQ version\\")
                  name_CONTAINS: String
                  name_ENDS_WITH: String
                  name_EQ: String
                  name_IN: [String!]
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

                type Movie {
                  description: String
                  title: String!
                }

                type MovieAggregateSelection {
                  count: Int!
                  description: StringAggregateSelection!
                  title: StringAggregateSelection!
                }

                input MovieConnectWhere {
                  node: MovieWhere!
                }

                input MovieCreateInput {
                  description: String
                  title: String!
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
                  description: SortDirection
                  title: SortDirection
                }

                input MovieUpdateInput {
                  description: String
                  title: String
                }

                input MovieWhere {
                  AND: [MovieWhere!]
                  NOT: MovieWhere
                  OR: [MovieWhere!]
                  description: String @deprecated(reason: \\"Please use the explicit _EQ version\\")
                  description_CONTAINS: String
                  description_ENDS_WITH: String
                  description_EQ: String
                  description_IN: [String]
                  description_STARTS_WITH: String
                  title: String @deprecated(reason: \\"Please use the explicit _EQ version\\")
                  title_CONTAINS: String
                  title_ENDS_WITH: String
                  title_EQ: String
                  title_IN: [String!]
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
                  updateActors(connect: ActorConnectInput @deprecated(reason: \\"Top level connect input argument in update is deprecated. Use the nested connect field in the relationship within the update argument\\"), create: ActorRelationInput @deprecated(reason: \\"Top level create input argument in update is deprecated. Use the nested create field in the relationship within the update argument\\"), delete: ActorDeleteInput @deprecated(reason: \\"Top level delete input argument in update is deprecated. Use the nested delete field in the relationship within the update argument\\"), disconnect: ActorDisconnectInput @deprecated(reason: \\"Top level disconnect input argument in update is deprecated. Use the nested disconnect field in the relationship within the update argument\\"), update: ActorUpdateInput, where: ActorWhere): UpdateActorsMutationResponse!
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
                  actorsAggregate(where: ActorWhere): ActorAggregateSelection!
                  actorsConnection(after: String, first: Int, sort: [ActorSort!], where: ActorWhere): ActorsConnection!
                  movies(limit: Int, offset: Int, options: MovieOptions @deprecated(reason: \\"Query options argument is deprecated, please use pagination arguments like limit, offset and sort instead.\\"), sort: [MovieSort!], where: MovieWhere): [Movie!]!
                  moviesAggregate(where: MovieWhere): MovieAggregateSelection!
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

        test("Prevent relationship field update", async () => {
            const typeDefs = gql`
                type Movie @query(aggregate: true) @node {
                    title: String!
                    description: String
                }

                type Actor @query(aggregate: true) @node {
                    name: String!
                    actedIn: [Movie!]!
                        @relationship(type: "ACTED_IN", direction: OUT)
                        @settable(onCreate: true, onUpdate: false)
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
                  actedIn(directed: Boolean = true, limit: Int, offset: Int, options: MovieOptions @deprecated(reason: \\"Query options argument is deprecated, please use pagination arguments like limit, offset and sort instead.\\"), sort: [MovieSort!], where: MovieWhere): [Movie!]!
                  actedInAggregate(directed: Boolean = true, where: MovieWhere): ActorMovieActedInAggregationSelection
                  actedInConnection(after: String, directed: Boolean = true, first: Int, sort: [ActorActedInConnectionSort!], where: ActorActedInConnectionWhere): ActorActedInConnection!
                  name: String!
                }

                input ActorActedInAggregateInput {
                  AND: [ActorActedInAggregateInput!]
                  NOT: ActorActedInAggregateInput
                  OR: [ActorActedInAggregateInput!]
                  count: Int @deprecated(reason: \\"Please use the explicit _EQ version\\")
                  count_EQ: Int
                  count_GT: Int
                  count_GTE: Int
                  count_LT: Int
                  count_LTE: Int
                  node: ActorActedInNodeAggregationWhereInput
                }

                input ActorActedInConnectFieldInput {
                  \\"\\"\\"
                  Whether or not to overwrite any matching relationship with the new properties.
                  \\"\\"\\"
                  overwrite: Boolean! = true
                  where: MovieConnectWhere
                }

                type ActorActedInConnection {
                  edges: [ActorActedInRelationship!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
                }

                input ActorActedInConnectionSort {
                  node: MovieSort
                }

                input ActorActedInConnectionWhere {
                  AND: [ActorActedInConnectionWhere!]
                  NOT: ActorActedInConnectionWhere
                  OR: [ActorActedInConnectionWhere!]
                  node: MovieWhere
                }

                input ActorActedInCreateFieldInput {
                  node: MovieCreateInput!
                }

                input ActorActedInDeleteFieldInput {
                  where: ActorActedInConnectionWhere
                }

                input ActorActedInDisconnectFieldInput {
                  where: ActorActedInConnectionWhere
                }

                input ActorActedInFieldInput {
                  connect: [ActorActedInConnectFieldInput!]
                  create: [ActorActedInCreateFieldInput!]
                }

                input ActorActedInNodeAggregationWhereInput {
                  AND: [ActorActedInNodeAggregationWhereInput!]
                  NOT: ActorActedInNodeAggregationWhereInput
                  OR: [ActorActedInNodeAggregationWhereInput!]
                  description_AVERAGE_EQUAL: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                  description_AVERAGE_GT: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                  description_AVERAGE_GTE: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                  description_AVERAGE_LENGTH_EQUAL: Float
                  description_AVERAGE_LENGTH_GT: Float
                  description_AVERAGE_LENGTH_GTE: Float
                  description_AVERAGE_LENGTH_LT: Float
                  description_AVERAGE_LENGTH_LTE: Float
                  description_AVERAGE_LT: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                  description_AVERAGE_LTE: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                  description_EQUAL: String @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
                  description_GT: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
                  description_GTE: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
                  description_LONGEST_EQUAL: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                  description_LONGEST_GT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                  description_LONGEST_GTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                  description_LONGEST_LENGTH_EQUAL: Int
                  description_LONGEST_LENGTH_GT: Int
                  description_LONGEST_LENGTH_GTE: Int
                  description_LONGEST_LENGTH_LT: Int
                  description_LONGEST_LENGTH_LTE: Int
                  description_LONGEST_LT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                  description_LONGEST_LTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                  description_LT: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
                  description_LTE: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
                  description_SHORTEST_EQUAL: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                  description_SHORTEST_GT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                  description_SHORTEST_GTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                  description_SHORTEST_LENGTH_EQUAL: Int
                  description_SHORTEST_LENGTH_GT: Int
                  description_SHORTEST_LENGTH_GTE: Int
                  description_SHORTEST_LENGTH_LT: Int
                  description_SHORTEST_LENGTH_LTE: Int
                  description_SHORTEST_LT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                  description_SHORTEST_LTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
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

                type ActorActedInRelationship {
                  cursor: String!
                  node: Movie!
                }

                type ActorAggregateSelection {
                  count: Int!
                  name: StringAggregateSelection!
                }

                input ActorConnectInput {
                  actedIn: [ActorActedInConnectFieldInput!]
                }

                input ActorCreateInput {
                  actedIn: ActorActedInFieldInput
                  name: String!
                }

                input ActorDeleteInput {
                  actedIn: [ActorActedInDeleteFieldInput!]
                }

                input ActorDisconnectInput {
                  actedIn: [ActorActedInDisconnectFieldInput!]
                }

                type ActorEdge {
                  cursor: String!
                  node: Actor!
                }

                type ActorMovieActedInAggregationSelection {
                  count: Int!
                  node: ActorMovieActedInNodeAggregateSelection
                }

                type ActorMovieActedInNodeAggregateSelection {
                  description: StringAggregateSelection!
                  title: StringAggregateSelection!
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
                  actedIn: [ActorActedInCreateFieldInput!]
                }

                \\"\\"\\"
                Fields to sort Actors by. The order in which sorts are applied is not guaranteed when specifying many fields in one ActorSort object.
                \\"\\"\\"
                input ActorSort {
                  name: SortDirection
                }

                input ActorUpdateInput {
                  name: String
                }

                input ActorWhere {
                  AND: [ActorWhere!]
                  NOT: ActorWhere
                  OR: [ActorWhere!]
                  actedIn: MovieWhere @deprecated(reason: \\"Use \`actedIn_SOME\` instead.\\")
                  actedInAggregate: ActorActedInAggregateInput
                  actedInConnection: ActorActedInConnectionWhere @deprecated(reason: \\"Use \`actedInConnection_SOME\` instead.\\")
                  \\"\\"\\"
                  Return Actors where all of the related ActorActedInConnections match this filter
                  \\"\\"\\"
                  actedInConnection_ALL: ActorActedInConnectionWhere
                  \\"\\"\\"
                  Return Actors where none of the related ActorActedInConnections match this filter
                  \\"\\"\\"
                  actedInConnection_NONE: ActorActedInConnectionWhere
                  \\"\\"\\"
                  Return Actors where one of the related ActorActedInConnections match this filter
                  \\"\\"\\"
                  actedInConnection_SINGLE: ActorActedInConnectionWhere
                  \\"\\"\\"
                  Return Actors where some of the related ActorActedInConnections match this filter
                  \\"\\"\\"
                  actedInConnection_SOME: ActorActedInConnectionWhere
                  \\"\\"\\"Return Actors where all of the related Movies match this filter\\"\\"\\"
                  actedIn_ALL: MovieWhere
                  \\"\\"\\"Return Actors where none of the related Movies match this filter\\"\\"\\"
                  actedIn_NONE: MovieWhere
                  \\"\\"\\"Return Actors where one of the related Movies match this filter\\"\\"\\"
                  actedIn_SINGLE: MovieWhere
                  \\"\\"\\"Return Actors where some of the related Movies match this filter\\"\\"\\"
                  actedIn_SOME: MovieWhere
                  name: String @deprecated(reason: \\"Please use the explicit _EQ version\\")
                  name_CONTAINS: String
                  name_ENDS_WITH: String
                  name_EQ: String
                  name_IN: [String!]
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

                type Movie {
                  description: String
                  title: String!
                }

                type MovieAggregateSelection {
                  count: Int!
                  description: StringAggregateSelection!
                  title: StringAggregateSelection!
                }

                input MovieConnectWhere {
                  node: MovieWhere!
                }

                input MovieCreateInput {
                  description: String
                  title: String!
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
                  description: SortDirection
                  title: SortDirection
                }

                input MovieUpdateInput {
                  description: String
                  title: String
                }

                input MovieWhere {
                  AND: [MovieWhere!]
                  NOT: MovieWhere
                  OR: [MovieWhere!]
                  description: String @deprecated(reason: \\"Please use the explicit _EQ version\\")
                  description_CONTAINS: String
                  description_ENDS_WITH: String
                  description_EQ: String
                  description_IN: [String]
                  description_STARTS_WITH: String
                  title: String @deprecated(reason: \\"Please use the explicit _EQ version\\")
                  title_CONTAINS: String
                  title_ENDS_WITH: String
                  title_EQ: String
                  title_IN: [String!]
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
                  updateActors(connect: ActorConnectInput @deprecated(reason: \\"Top level connect input argument in update is deprecated. Use the nested connect field in the relationship within the update argument\\"), create: ActorRelationInput @deprecated(reason: \\"Top level create input argument in update is deprecated. Use the nested create field in the relationship within the update argument\\"), delete: ActorDeleteInput @deprecated(reason: \\"Top level delete input argument in update is deprecated. Use the nested delete field in the relationship within the update argument\\"), disconnect: ActorDisconnectInput @deprecated(reason: \\"Top level disconnect input argument in update is deprecated. Use the nested disconnect field in the relationship within the update argument\\"), update: ActorUpdateInput, where: ActorWhere): UpdateActorsMutationResponse!
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
                  actorsAggregate(where: ActorWhere): ActorAggregateSelection!
                  actorsConnection(after: String, first: Int, sort: [ActorSort!], where: ActorWhere): ActorsConnection!
                  movies(limit: Int, offset: Int, options: MovieOptions @deprecated(reason: \\"Query options argument is deprecated, please use pagination arguments like limit, offset and sort instead.\\"), sort: [MovieSort!], where: MovieWhere): [Movie!]!
                  moviesAggregate(where: MovieWhere): MovieAggregateSelection!
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

        test("Prevent update on nested relationships", async () => {
            const typeDefs = gql`
                type Movie @query(aggregate: true) @node {
                    title: String!
                    description: String
                    actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN)
                }

                type Actor @query(aggregate: true) @node {
                    name: String!
                    actedIn: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT) @settable(onUpdate: false)
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
                  actedIn(directed: Boolean = true, limit: Int, offset: Int, options: MovieOptions @deprecated(reason: \\"Query options argument is deprecated, please use pagination arguments like limit, offset and sort instead.\\"), sort: [MovieSort!], where: MovieWhere): [Movie!]!
                  actedInAggregate(directed: Boolean = true, where: MovieWhere): ActorMovieActedInAggregationSelection
                  actedInConnection(after: String, directed: Boolean = true, first: Int, sort: [ActorActedInConnectionSort!], where: ActorActedInConnectionWhere): ActorActedInConnection!
                  name: String!
                }

                input ActorActedInAggregateInput {
                  AND: [ActorActedInAggregateInput!]
                  NOT: ActorActedInAggregateInput
                  OR: [ActorActedInAggregateInput!]
                  count: Int @deprecated(reason: \\"Please use the explicit _EQ version\\")
                  count_EQ: Int
                  count_GT: Int
                  count_GTE: Int
                  count_LT: Int
                  count_LTE: Int
                  node: ActorActedInNodeAggregationWhereInput
                }

                input ActorActedInConnectFieldInput {
                  connect: [MovieConnectInput!]
                  \\"\\"\\"
                  Whether or not to overwrite any matching relationship with the new properties.
                  \\"\\"\\"
                  overwrite: Boolean! = true
                  where: MovieConnectWhere
                }

                type ActorActedInConnection {
                  edges: [ActorActedInRelationship!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
                }

                input ActorActedInConnectionSort {
                  node: MovieSort
                }

                input ActorActedInConnectionWhere {
                  AND: [ActorActedInConnectionWhere!]
                  NOT: ActorActedInConnectionWhere
                  OR: [ActorActedInConnectionWhere!]
                  node: MovieWhere
                }

                input ActorActedInCreateFieldInput {
                  node: MovieCreateInput!
                }

                input ActorActedInDeleteFieldInput {
                  delete: MovieDeleteInput
                  where: ActorActedInConnectionWhere
                }

                input ActorActedInDisconnectFieldInput {
                  disconnect: MovieDisconnectInput
                  where: ActorActedInConnectionWhere
                }

                input ActorActedInFieldInput {
                  connect: [ActorActedInConnectFieldInput!]
                  create: [ActorActedInCreateFieldInput!]
                }

                input ActorActedInNodeAggregationWhereInput {
                  AND: [ActorActedInNodeAggregationWhereInput!]
                  NOT: ActorActedInNodeAggregationWhereInput
                  OR: [ActorActedInNodeAggregationWhereInput!]
                  description_AVERAGE_EQUAL: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                  description_AVERAGE_GT: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                  description_AVERAGE_GTE: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                  description_AVERAGE_LENGTH_EQUAL: Float
                  description_AVERAGE_LENGTH_GT: Float
                  description_AVERAGE_LENGTH_GTE: Float
                  description_AVERAGE_LENGTH_LT: Float
                  description_AVERAGE_LENGTH_LTE: Float
                  description_AVERAGE_LT: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                  description_AVERAGE_LTE: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                  description_EQUAL: String @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
                  description_GT: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
                  description_GTE: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
                  description_LONGEST_EQUAL: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                  description_LONGEST_GT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                  description_LONGEST_GTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                  description_LONGEST_LENGTH_EQUAL: Int
                  description_LONGEST_LENGTH_GT: Int
                  description_LONGEST_LENGTH_GTE: Int
                  description_LONGEST_LENGTH_LT: Int
                  description_LONGEST_LENGTH_LTE: Int
                  description_LONGEST_LT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                  description_LONGEST_LTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                  description_LT: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
                  description_LTE: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
                  description_SHORTEST_EQUAL: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                  description_SHORTEST_GT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                  description_SHORTEST_GTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                  description_SHORTEST_LENGTH_EQUAL: Int
                  description_SHORTEST_LENGTH_GT: Int
                  description_SHORTEST_LENGTH_GTE: Int
                  description_SHORTEST_LENGTH_LT: Int
                  description_SHORTEST_LENGTH_LTE: Int
                  description_SHORTEST_LT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                  description_SHORTEST_LTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
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

                type ActorActedInRelationship {
                  cursor: String!
                  node: Movie!
                }

                type ActorAggregateSelection {
                  count: Int!
                  name: StringAggregateSelection!
                }

                input ActorConnectInput {
                  actedIn: [ActorActedInConnectFieldInput!]
                }

                input ActorConnectWhere {
                  node: ActorWhere!
                }

                input ActorCreateInput {
                  actedIn: ActorActedInFieldInput
                  name: String!
                }

                input ActorDeleteInput {
                  actedIn: [ActorActedInDeleteFieldInput!]
                }

                input ActorDisconnectInput {
                  actedIn: [ActorActedInDisconnectFieldInput!]
                }

                type ActorEdge {
                  cursor: String!
                  node: Actor!
                }

                type ActorMovieActedInAggregationSelection {
                  count: Int!
                  node: ActorMovieActedInNodeAggregateSelection
                }

                type ActorMovieActedInNodeAggregateSelection {
                  description: StringAggregateSelection!
                  title: StringAggregateSelection!
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
                  actedIn: [ActorActedInCreateFieldInput!]
                }

                \\"\\"\\"
                Fields to sort Actors by. The order in which sorts are applied is not guaranteed when specifying many fields in one ActorSort object.
                \\"\\"\\"
                input ActorSort {
                  name: SortDirection
                }

                input ActorUpdateInput {
                  name: String
                }

                input ActorWhere {
                  AND: [ActorWhere!]
                  NOT: ActorWhere
                  OR: [ActorWhere!]
                  actedIn: MovieWhere @deprecated(reason: \\"Use \`actedIn_SOME\` instead.\\")
                  actedInAggregate: ActorActedInAggregateInput
                  actedInConnection: ActorActedInConnectionWhere @deprecated(reason: \\"Use \`actedInConnection_SOME\` instead.\\")
                  \\"\\"\\"
                  Return Actors where all of the related ActorActedInConnections match this filter
                  \\"\\"\\"
                  actedInConnection_ALL: ActorActedInConnectionWhere
                  \\"\\"\\"
                  Return Actors where none of the related ActorActedInConnections match this filter
                  \\"\\"\\"
                  actedInConnection_NONE: ActorActedInConnectionWhere
                  \\"\\"\\"
                  Return Actors where one of the related ActorActedInConnections match this filter
                  \\"\\"\\"
                  actedInConnection_SINGLE: ActorActedInConnectionWhere
                  \\"\\"\\"
                  Return Actors where some of the related ActorActedInConnections match this filter
                  \\"\\"\\"
                  actedInConnection_SOME: ActorActedInConnectionWhere
                  \\"\\"\\"Return Actors where all of the related Movies match this filter\\"\\"\\"
                  actedIn_ALL: MovieWhere
                  \\"\\"\\"Return Actors where none of the related Movies match this filter\\"\\"\\"
                  actedIn_NONE: MovieWhere
                  \\"\\"\\"Return Actors where one of the related Movies match this filter\\"\\"\\"
                  actedIn_SINGLE: MovieWhere
                  \\"\\"\\"Return Actors where some of the related Movies match this filter\\"\\"\\"
                  actedIn_SOME: MovieWhere
                  name: String @deprecated(reason: \\"Please use the explicit _EQ version\\")
                  name_CONTAINS: String
                  name_ENDS_WITH: String
                  name_EQ: String
                  name_IN: [String!]
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

                type Movie {
                  actors(directed: Boolean = true, limit: Int, offset: Int, options: ActorOptions @deprecated(reason: \\"Query options argument is deprecated, please use pagination arguments like limit, offset and sort instead.\\"), sort: [ActorSort!], where: ActorWhere): [Actor!]!
                  actorsAggregate(directed: Boolean = true, where: ActorWhere): MovieActorActorsAggregationSelection
                  actorsConnection(after: String, directed: Boolean = true, first: Int, sort: [MovieActorsConnectionSort!], where: MovieActorsConnectionWhere): MovieActorsConnection!
                  description: String
                  title: String!
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
                  count: Int!
                  description: StringAggregateSelection!
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
                  description: String
                  title: String!
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
                  description: SortDirection
                  title: SortDirection
                }

                input MovieUpdateInput {
                  actors: [MovieActorsUpdateFieldInput!]
                  description: String
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
                  description: String @deprecated(reason: \\"Please use the explicit _EQ version\\")
                  description_CONTAINS: String
                  description_ENDS_WITH: String
                  description_EQ: String
                  description_IN: [String]
                  description_STARTS_WITH: String
                  title: String @deprecated(reason: \\"Please use the explicit _EQ version\\")
                  title_CONTAINS: String
                  title_ENDS_WITH: String
                  title_EQ: String
                  title_IN: [String!]
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
                  actors(limit: Int, offset: Int, options: ActorOptions @deprecated(reason: \\"Query options argument is deprecated, please use pagination arguments like limit, offset and sort instead.\\"), sort: [ActorSort!], where: ActorWhere): [Actor!]!
                  actorsAggregate(where: ActorWhere): ActorAggregateSelection!
                  actorsConnection(after: String, first: Int, sort: [ActorSort!], where: ActorWhere): ActorsConnection!
                  movies(limit: Int, offset: Int, options: MovieOptions @deprecated(reason: \\"Query options argument is deprecated, please use pagination arguments like limit, offset and sort instead.\\"), sort: [MovieSort!], where: MovieWhere): [Movie!]!
                  moviesAggregate(where: MovieWhere): MovieAggregateSelection!
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

        test("Prevent create on nested relationships", async () => {
            const typeDefs = gql`
                type Movie @query(aggregate: true) @node {
                    title: String!
                    description: String
                    actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN)
                }

                type Actor @query(aggregate: true) @node {
                    name: String!
                    actedIn: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT) @settable(onCreate: false)
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
                  actedIn(directed: Boolean = true, limit: Int, offset: Int, options: MovieOptions @deprecated(reason: \\"Query options argument is deprecated, please use pagination arguments like limit, offset and sort instead.\\"), sort: [MovieSort!], where: MovieWhere): [Movie!]!
                  actedInAggregate(directed: Boolean = true, where: MovieWhere): ActorMovieActedInAggregationSelection
                  actedInConnection(after: String, directed: Boolean = true, first: Int, sort: [ActorActedInConnectionSort!], where: ActorActedInConnectionWhere): ActorActedInConnection!
                  name: String!
                }

                input ActorActedInAggregateInput {
                  AND: [ActorActedInAggregateInput!]
                  NOT: ActorActedInAggregateInput
                  OR: [ActorActedInAggregateInput!]
                  count: Int @deprecated(reason: \\"Please use the explicit _EQ version\\")
                  count_EQ: Int
                  count_GT: Int
                  count_GTE: Int
                  count_LT: Int
                  count_LTE: Int
                  node: ActorActedInNodeAggregationWhereInput
                }

                input ActorActedInConnectFieldInput {
                  connect: [MovieConnectInput!]
                  \\"\\"\\"
                  Whether or not to overwrite any matching relationship with the new properties.
                  \\"\\"\\"
                  overwrite: Boolean! = true
                  where: MovieConnectWhere
                }

                type ActorActedInConnection {
                  edges: [ActorActedInRelationship!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
                }

                input ActorActedInConnectionSort {
                  node: MovieSort
                }

                input ActorActedInConnectionWhere {
                  AND: [ActorActedInConnectionWhere!]
                  NOT: ActorActedInConnectionWhere
                  OR: [ActorActedInConnectionWhere!]
                  node: MovieWhere
                }

                input ActorActedInCreateFieldInput {
                  node: MovieCreateInput!
                }

                input ActorActedInDeleteFieldInput {
                  delete: MovieDeleteInput
                  where: ActorActedInConnectionWhere
                }

                input ActorActedInDisconnectFieldInput {
                  disconnect: MovieDisconnectInput
                  where: ActorActedInConnectionWhere
                }

                input ActorActedInNodeAggregationWhereInput {
                  AND: [ActorActedInNodeAggregationWhereInput!]
                  NOT: ActorActedInNodeAggregationWhereInput
                  OR: [ActorActedInNodeAggregationWhereInput!]
                  description_AVERAGE_EQUAL: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                  description_AVERAGE_GT: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                  description_AVERAGE_GTE: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                  description_AVERAGE_LENGTH_EQUAL: Float
                  description_AVERAGE_LENGTH_GT: Float
                  description_AVERAGE_LENGTH_GTE: Float
                  description_AVERAGE_LENGTH_LT: Float
                  description_AVERAGE_LENGTH_LTE: Float
                  description_AVERAGE_LT: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                  description_AVERAGE_LTE: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                  description_EQUAL: String @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
                  description_GT: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
                  description_GTE: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
                  description_LONGEST_EQUAL: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                  description_LONGEST_GT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                  description_LONGEST_GTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                  description_LONGEST_LENGTH_EQUAL: Int
                  description_LONGEST_LENGTH_GT: Int
                  description_LONGEST_LENGTH_GTE: Int
                  description_LONGEST_LENGTH_LT: Int
                  description_LONGEST_LENGTH_LTE: Int
                  description_LONGEST_LT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                  description_LONGEST_LTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                  description_LT: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
                  description_LTE: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
                  description_SHORTEST_EQUAL: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                  description_SHORTEST_GT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                  description_SHORTEST_GTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                  description_SHORTEST_LENGTH_EQUAL: Int
                  description_SHORTEST_LENGTH_GT: Int
                  description_SHORTEST_LENGTH_GTE: Int
                  description_SHORTEST_LENGTH_LT: Int
                  description_SHORTEST_LENGTH_LTE: Int
                  description_SHORTEST_LT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                  description_SHORTEST_LTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
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

                type ActorActedInRelationship {
                  cursor: String!
                  node: Movie!
                }

                input ActorActedInUpdateConnectionInput {
                  node: MovieUpdateInput
                }

                input ActorActedInUpdateFieldInput {
                  connect: [ActorActedInConnectFieldInput!]
                  create: [ActorActedInCreateFieldInput!]
                  delete: [ActorActedInDeleteFieldInput!]
                  disconnect: [ActorActedInDisconnectFieldInput!]
                  update: ActorActedInUpdateConnectionInput
                  where: ActorActedInConnectionWhere
                }

                type ActorAggregateSelection {
                  count: Int!
                  name: StringAggregateSelection!
                }

                input ActorConnectInput {
                  actedIn: [ActorActedInConnectFieldInput!]
                }

                input ActorConnectWhere {
                  node: ActorWhere!
                }

                input ActorCreateInput {
                  name: String!
                }

                input ActorDeleteInput {
                  actedIn: [ActorActedInDeleteFieldInput!]
                }

                input ActorDisconnectInput {
                  actedIn: [ActorActedInDisconnectFieldInput!]
                }

                type ActorEdge {
                  cursor: String!
                  node: Actor!
                }

                type ActorMovieActedInAggregationSelection {
                  count: Int!
                  node: ActorMovieActedInNodeAggregateSelection
                }

                type ActorMovieActedInNodeAggregateSelection {
                  description: StringAggregateSelection!
                  title: StringAggregateSelection!
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
                  actedIn: [ActorActedInCreateFieldInput!]
                }

                \\"\\"\\"
                Fields to sort Actors by. The order in which sorts are applied is not guaranteed when specifying many fields in one ActorSort object.
                \\"\\"\\"
                input ActorSort {
                  name: SortDirection
                }

                input ActorUpdateInput {
                  actedIn: [ActorActedInUpdateFieldInput!]
                  name: String
                }

                input ActorWhere {
                  AND: [ActorWhere!]
                  NOT: ActorWhere
                  OR: [ActorWhere!]
                  actedIn: MovieWhere @deprecated(reason: \\"Use \`actedIn_SOME\` instead.\\")
                  actedInAggregate: ActorActedInAggregateInput
                  actedInConnection: ActorActedInConnectionWhere @deprecated(reason: \\"Use \`actedInConnection_SOME\` instead.\\")
                  \\"\\"\\"
                  Return Actors where all of the related ActorActedInConnections match this filter
                  \\"\\"\\"
                  actedInConnection_ALL: ActorActedInConnectionWhere
                  \\"\\"\\"
                  Return Actors where none of the related ActorActedInConnections match this filter
                  \\"\\"\\"
                  actedInConnection_NONE: ActorActedInConnectionWhere
                  \\"\\"\\"
                  Return Actors where one of the related ActorActedInConnections match this filter
                  \\"\\"\\"
                  actedInConnection_SINGLE: ActorActedInConnectionWhere
                  \\"\\"\\"
                  Return Actors where some of the related ActorActedInConnections match this filter
                  \\"\\"\\"
                  actedInConnection_SOME: ActorActedInConnectionWhere
                  \\"\\"\\"Return Actors where all of the related Movies match this filter\\"\\"\\"
                  actedIn_ALL: MovieWhere
                  \\"\\"\\"Return Actors where none of the related Movies match this filter\\"\\"\\"
                  actedIn_NONE: MovieWhere
                  \\"\\"\\"Return Actors where one of the related Movies match this filter\\"\\"\\"
                  actedIn_SINGLE: MovieWhere
                  \\"\\"\\"Return Actors where some of the related Movies match this filter\\"\\"\\"
                  actedIn_SOME: MovieWhere
                  name: String @deprecated(reason: \\"Please use the explicit _EQ version\\")
                  name_CONTAINS: String
                  name_ENDS_WITH: String
                  name_EQ: String
                  name_IN: [String!]
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

                type Movie {
                  actors(directed: Boolean = true, limit: Int, offset: Int, options: ActorOptions @deprecated(reason: \\"Query options argument is deprecated, please use pagination arguments like limit, offset and sort instead.\\"), sort: [ActorSort!], where: ActorWhere): [Actor!]!
                  actorsAggregate(directed: Boolean = true, where: ActorWhere): MovieActorActorsAggregationSelection
                  actorsConnection(after: String, directed: Boolean = true, first: Int, sort: [MovieActorsConnectionSort!], where: MovieActorsConnectionWhere): MovieActorsConnection!
                  description: String
                  title: String!
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
                  count: Int!
                  description: StringAggregateSelection!
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
                  description: String
                  title: String!
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
                  description: SortDirection
                  title: SortDirection
                }

                input MovieUpdateInput {
                  actors: [MovieActorsUpdateFieldInput!]
                  description: String
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
                  description: String @deprecated(reason: \\"Please use the explicit _EQ version\\")
                  description_CONTAINS: String
                  description_ENDS_WITH: String
                  description_EQ: String
                  description_IN: [String]
                  description_STARTS_WITH: String
                  title: String @deprecated(reason: \\"Please use the explicit _EQ version\\")
                  title_CONTAINS: String
                  title_ENDS_WITH: String
                  title_EQ: String
                  title_IN: [String!]
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
                  actors(limit: Int, offset: Int, options: ActorOptions @deprecated(reason: \\"Query options argument is deprecated, please use pagination arguments like limit, offset and sort instead.\\"), sort: [ActorSort!], where: ActorWhere): [Actor!]!
                  actorsAggregate(where: ActorWhere): ActorAggregateSelection!
                  actorsConnection(after: String, first: Int, sort: [ActorSort!], where: ActorWhere): ActorsConnection!
                  movies(limit: Int, offset: Int, options: MovieOptions @deprecated(reason: \\"Query options argument is deprecated, please use pagination arguments like limit, offset and sort instead.\\"), sort: [MovieSort!], where: MovieWhere): [Movie!]!
                  moviesAggregate(where: MovieWhere): MovieAggregateSelection!
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
    describe("Relationships to a union type", () => {
        test("Prevent relationship field creation", async () => {
            const typeDefs = gql`
                type Movie @query(aggregate: true) @node {
                    title: String!
                    description: String
                }

                type Series @query(aggregate: true) @node {
                    name: String!
                    description: String
                }

                union Production = Movie | Series

                type Actor @query(aggregate: true) @node {
                    name: String!
                    actedIn: [Production!]!
                        @relationship(type: "ACTED_IN", direction: OUT)
                        @settable(onCreate: false, onUpdate: true)
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
                  actedIn(directed: Boolean = true, limit: Int, offset: Int, options: QueryOptions @deprecated(reason: \\"Query options argument is deprecated, please use pagination arguments like limit, offset and sort instead.\\"), where: ProductionWhere): [Production!]!
                  actedInConnection(after: String, directed: Boolean = true, first: Int, where: ActorActedInConnectionWhere): ActorActedInConnection!
                  name: String!
                }

                input ActorActedInConnectInput {
                  Movie: [ActorActedInMovieConnectFieldInput!]
                  Series: [ActorActedInSeriesConnectFieldInput!]
                }

                type ActorActedInConnection {
                  edges: [ActorActedInRelationship!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
                }

                input ActorActedInConnectionWhere {
                  Movie: ActorActedInMovieConnectionWhere
                  Series: ActorActedInSeriesConnectionWhere
                }

                input ActorActedInCreateFieldInput {
                  Movie: [ActorActedInMovieCreateFieldInput!]
                  Series: [ActorActedInSeriesCreateFieldInput!]
                }

                input ActorActedInDeleteInput {
                  Movie: [ActorActedInMovieDeleteFieldInput!]
                  Series: [ActorActedInSeriesDeleteFieldInput!]
                }

                input ActorActedInDisconnectInput {
                  Movie: [ActorActedInMovieDisconnectFieldInput!]
                  Series: [ActorActedInSeriesDisconnectFieldInput!]
                }

                input ActorActedInMovieConnectFieldInput {
                  where: MovieConnectWhere
                }

                input ActorActedInMovieConnectionWhere {
                  AND: [ActorActedInMovieConnectionWhere!]
                  NOT: ActorActedInMovieConnectionWhere
                  OR: [ActorActedInMovieConnectionWhere!]
                  node: MovieWhere
                }

                input ActorActedInMovieCreateFieldInput {
                  node: MovieCreateInput!
                }

                input ActorActedInMovieDeleteFieldInput {
                  where: ActorActedInMovieConnectionWhere
                }

                input ActorActedInMovieDisconnectFieldInput {
                  where: ActorActedInMovieConnectionWhere
                }

                input ActorActedInMovieUpdateConnectionInput {
                  node: MovieUpdateInput
                }

                input ActorActedInMovieUpdateFieldInput {
                  connect: [ActorActedInMovieConnectFieldInput!]
                  create: [ActorActedInMovieCreateFieldInput!]
                  delete: [ActorActedInMovieDeleteFieldInput!]
                  disconnect: [ActorActedInMovieDisconnectFieldInput!]
                  update: ActorActedInMovieUpdateConnectionInput
                  where: ActorActedInMovieConnectionWhere
                }

                type ActorActedInRelationship {
                  cursor: String!
                  node: Production!
                }

                input ActorActedInSeriesConnectFieldInput {
                  where: SeriesConnectWhere
                }

                input ActorActedInSeriesConnectionWhere {
                  AND: [ActorActedInSeriesConnectionWhere!]
                  NOT: ActorActedInSeriesConnectionWhere
                  OR: [ActorActedInSeriesConnectionWhere!]
                  node: SeriesWhere
                }

                input ActorActedInSeriesCreateFieldInput {
                  node: SeriesCreateInput!
                }

                input ActorActedInSeriesDeleteFieldInput {
                  where: ActorActedInSeriesConnectionWhere
                }

                input ActorActedInSeriesDisconnectFieldInput {
                  where: ActorActedInSeriesConnectionWhere
                }

                input ActorActedInSeriesUpdateConnectionInput {
                  node: SeriesUpdateInput
                }

                input ActorActedInSeriesUpdateFieldInput {
                  connect: [ActorActedInSeriesConnectFieldInput!]
                  create: [ActorActedInSeriesCreateFieldInput!]
                  delete: [ActorActedInSeriesDeleteFieldInput!]
                  disconnect: [ActorActedInSeriesDisconnectFieldInput!]
                  update: ActorActedInSeriesUpdateConnectionInput
                  where: ActorActedInSeriesConnectionWhere
                }

                input ActorActedInUpdateInput {
                  Movie: [ActorActedInMovieUpdateFieldInput!]
                  Series: [ActorActedInSeriesUpdateFieldInput!]
                }

                type ActorAggregateSelection {
                  count: Int!
                  name: StringAggregateSelection!
                }

                input ActorConnectInput {
                  actedIn: ActorActedInConnectInput
                }

                input ActorCreateInput {
                  name: String!
                }

                input ActorDeleteInput {
                  actedIn: ActorActedInDeleteInput
                }

                input ActorDisconnectInput {
                  actedIn: ActorActedInDisconnectInput
                }

                type ActorEdge {
                  cursor: String!
                  node: Actor!
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
                  actedIn: ActorActedInCreateFieldInput
                }

                \\"\\"\\"
                Fields to sort Actors by. The order in which sorts are applied is not guaranteed when specifying many fields in one ActorSort object.
                \\"\\"\\"
                input ActorSort {
                  name: SortDirection
                }

                input ActorUpdateInput {
                  actedIn: ActorActedInUpdateInput
                  name: String
                }

                input ActorWhere {
                  AND: [ActorWhere!]
                  NOT: ActorWhere
                  OR: [ActorWhere!]
                  actedIn: ProductionWhere @deprecated(reason: \\"Use \`actedIn_SOME\` instead.\\")
                  actedInConnection: ActorActedInConnectionWhere @deprecated(reason: \\"Use \`actedInConnection_SOME\` instead.\\")
                  \\"\\"\\"
                  Return Actors where all of the related ActorActedInConnections match this filter
                  \\"\\"\\"
                  actedInConnection_ALL: ActorActedInConnectionWhere
                  \\"\\"\\"
                  Return Actors where none of the related ActorActedInConnections match this filter
                  \\"\\"\\"
                  actedInConnection_NONE: ActorActedInConnectionWhere
                  \\"\\"\\"
                  Return Actors where one of the related ActorActedInConnections match this filter
                  \\"\\"\\"
                  actedInConnection_SINGLE: ActorActedInConnectionWhere
                  \\"\\"\\"
                  Return Actors where some of the related ActorActedInConnections match this filter
                  \\"\\"\\"
                  actedInConnection_SOME: ActorActedInConnectionWhere
                  \\"\\"\\"Return Actors where all of the related Productions match this filter\\"\\"\\"
                  actedIn_ALL: ProductionWhere
                  \\"\\"\\"Return Actors where none of the related Productions match this filter\\"\\"\\"
                  actedIn_NONE: ProductionWhere
                  \\"\\"\\"Return Actors where one of the related Productions match this filter\\"\\"\\"
                  actedIn_SINGLE: ProductionWhere
                  \\"\\"\\"Return Actors where some of the related Productions match this filter\\"\\"\\"
                  actedIn_SOME: ProductionWhere
                  name: String @deprecated(reason: \\"Please use the explicit _EQ version\\")
                  name_CONTAINS: String
                  name_ENDS_WITH: String
                  name_EQ: String
                  name_IN: [String!]
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
                  nodesCreated: Int!
                  relationshipsCreated: Int!
                }

                type CreateMoviesMutationResponse {
                  info: CreateInfo!
                  movies: [Movie!]!
                }

                type CreateSeriesMutationResponse {
                  info: CreateInfo!
                  series: [Series!]!
                }

                \\"\\"\\"
                Information about the number of nodes and relationships deleted during a delete mutation
                \\"\\"\\"
                type DeleteInfo {
                  nodesDeleted: Int!
                  relationshipsDeleted: Int!
                }

                type Movie {
                  description: String
                  title: String!
                }

                type MovieAggregateSelection {
                  count: Int!
                  description: StringAggregateSelection!
                  title: StringAggregateSelection!
                }

                input MovieConnectWhere {
                  node: MovieWhere!
                }

                input MovieCreateInput {
                  description: String
                  title: String!
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
                  description: SortDirection
                  title: SortDirection
                }

                input MovieUpdateInput {
                  description: String
                  title: String
                }

                input MovieWhere {
                  AND: [MovieWhere!]
                  NOT: MovieWhere
                  OR: [MovieWhere!]
                  description: String @deprecated(reason: \\"Please use the explicit _EQ version\\")
                  description_CONTAINS: String
                  description_ENDS_WITH: String
                  description_EQ: String
                  description_IN: [String]
                  description_STARTS_WITH: String
                  title: String @deprecated(reason: \\"Please use the explicit _EQ version\\")
                  title_CONTAINS: String
                  title_ENDS_WITH: String
                  title_EQ: String
                  title_IN: [String!]
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
                  createSeries(input: [SeriesCreateInput!]!): CreateSeriesMutationResponse!
                  deleteActors(delete: ActorDeleteInput, where: ActorWhere): DeleteInfo!
                  deleteMovies(where: MovieWhere): DeleteInfo!
                  deleteSeries(where: SeriesWhere): DeleteInfo!
                  updateActors(connect: ActorConnectInput @deprecated(reason: \\"Top level connect input argument in update is deprecated. Use the nested connect field in the relationship within the update argument\\"), create: ActorRelationInput @deprecated(reason: \\"Top level create input argument in update is deprecated. Use the nested create field in the relationship within the update argument\\"), delete: ActorDeleteInput @deprecated(reason: \\"Top level delete input argument in update is deprecated. Use the nested delete field in the relationship within the update argument\\"), disconnect: ActorDisconnectInput @deprecated(reason: \\"Top level disconnect input argument in update is deprecated. Use the nested disconnect field in the relationship within the update argument\\"), update: ActorUpdateInput, where: ActorWhere): UpdateActorsMutationResponse!
                  updateMovies(update: MovieUpdateInput, where: MovieWhere): UpdateMoviesMutationResponse!
                  updateSeries(update: SeriesUpdateInput, where: SeriesWhere): UpdateSeriesMutationResponse!
                }

                \\"\\"\\"Pagination information (Relay)\\"\\"\\"
                type PageInfo {
                  endCursor: String
                  hasNextPage: Boolean!
                  hasPreviousPage: Boolean!
                  startCursor: String
                }

                union Production = Movie | Series

                input ProductionWhere {
                  Movie: MovieWhere
                  Series: SeriesWhere
                }

                type Query {
                  actors(limit: Int, offset: Int, options: ActorOptions @deprecated(reason: \\"Query options argument is deprecated, please use pagination arguments like limit, offset and sort instead.\\"), sort: [ActorSort!], where: ActorWhere): [Actor!]!
                  actorsAggregate(where: ActorWhere): ActorAggregateSelection!
                  actorsConnection(after: String, first: Int, sort: [ActorSort!], where: ActorWhere): ActorsConnection!
                  movies(limit: Int, offset: Int, options: MovieOptions @deprecated(reason: \\"Query options argument is deprecated, please use pagination arguments like limit, offset and sort instead.\\"), sort: [MovieSort!], where: MovieWhere): [Movie!]!
                  moviesAggregate(where: MovieWhere): MovieAggregateSelection!
                  moviesConnection(after: String, first: Int, sort: [MovieSort!], where: MovieWhere): MoviesConnection!
                  productions(limit: Int, offset: Int, options: QueryOptions @deprecated(reason: \\"Query options argument is deprecated, please use pagination arguments like limit, offset and sort instead.\\"), where: ProductionWhere): [Production!]!
                  series(limit: Int, offset: Int, options: SeriesOptions @deprecated(reason: \\"Query options argument is deprecated, please use pagination arguments like limit, offset and sort instead.\\"), sort: [SeriesSort!], where: SeriesWhere): [Series!]!
                  seriesAggregate(where: SeriesWhere): SeriesAggregateSelection!
                  seriesConnection(after: String, first: Int, sort: [SeriesSort!], where: SeriesWhere): SeriesConnection!
                }

                \\"\\"\\"Input type for options that can be specified on a query operation.\\"\\"\\"
                input QueryOptions {
                  limit: Int
                  offset: Int
                }

                type Series {
                  description: String
                  name: String!
                }

                type SeriesAggregateSelection {
                  count: Int!
                  description: StringAggregateSelection!
                  name: StringAggregateSelection!
                }

                input SeriesConnectWhere {
                  node: SeriesWhere!
                }

                type SeriesConnection {
                  edges: [SeriesEdge!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
                }

                input SeriesCreateInput {
                  description: String
                  name: String!
                }

                type SeriesEdge {
                  cursor: String!
                  node: Series!
                }

                input SeriesOptions {
                  limit: Int
                  offset: Int
                  \\"\\"\\"
                  Specify one or more SeriesSort objects to sort Series by. The sorts will be applied in the order in which they are arranged in the array.
                  \\"\\"\\"
                  sort: [SeriesSort!]
                }

                \\"\\"\\"
                Fields to sort Series by. The order in which sorts are applied is not guaranteed when specifying many fields in one SeriesSort object.
                \\"\\"\\"
                input SeriesSort {
                  description: SortDirection
                  name: SortDirection
                }

                input SeriesUpdateInput {
                  description: String
                  name: String
                }

                input SeriesWhere {
                  AND: [SeriesWhere!]
                  NOT: SeriesWhere
                  OR: [SeriesWhere!]
                  description: String @deprecated(reason: \\"Please use the explicit _EQ version\\")
                  description_CONTAINS: String
                  description_ENDS_WITH: String
                  description_EQ: String
                  description_IN: [String]
                  description_STARTS_WITH: String
                  name: String @deprecated(reason: \\"Please use the explicit _EQ version\\")
                  name_CONTAINS: String
                  name_ENDS_WITH: String
                  name_EQ: String
                  name_IN: [String!]
                  name_STARTS_WITH: String
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
                  nodesCreated: Int!
                  nodesDeleted: Int!
                  relationshipsCreated: Int!
                  relationshipsDeleted: Int!
                }

                type UpdateMoviesMutationResponse {
                  info: UpdateInfo!
                  movies: [Movie!]!
                }

                type UpdateSeriesMutationResponse {
                  info: UpdateInfo!
                  series: [Series!]!
                }"
            `);
        });

        test("Prevent relationship field update", async () => {
            const typeDefs = gql`
                type Movie @query(aggregate: true) @node {
                    title: String!
                    description: String
                }

                type Series @query(aggregate: true) @node {
                    name: String!
                    description: String
                }

                union Production = Movie | Series

                type Actor @query(aggregate: true) @node {
                    name: String!
                    actedIn: [Production!]!
                        @relationship(type: "ACTED_IN", direction: OUT)
                        @settable(onCreate: true, onUpdate: false)
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
                  actedIn(directed: Boolean = true, limit: Int, offset: Int, options: QueryOptions @deprecated(reason: \\"Query options argument is deprecated, please use pagination arguments like limit, offset and sort instead.\\"), where: ProductionWhere): [Production!]!
                  actedInConnection(after: String, directed: Boolean = true, first: Int, where: ActorActedInConnectionWhere): ActorActedInConnection!
                  name: String!
                }

                input ActorActedInConnectInput {
                  Movie: [ActorActedInMovieConnectFieldInput!]
                  Series: [ActorActedInSeriesConnectFieldInput!]
                }

                type ActorActedInConnection {
                  edges: [ActorActedInRelationship!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
                }

                input ActorActedInConnectionWhere {
                  Movie: ActorActedInMovieConnectionWhere
                  Series: ActorActedInSeriesConnectionWhere
                }

                input ActorActedInCreateFieldInput {
                  Movie: [ActorActedInMovieCreateFieldInput!]
                  Series: [ActorActedInSeriesCreateFieldInput!]
                }

                input ActorActedInCreateInput {
                  Movie: ActorActedInMovieFieldInput
                  Series: ActorActedInSeriesFieldInput
                }

                input ActorActedInDeleteInput {
                  Movie: [ActorActedInMovieDeleteFieldInput!]
                  Series: [ActorActedInSeriesDeleteFieldInput!]
                }

                input ActorActedInDisconnectInput {
                  Movie: [ActorActedInMovieDisconnectFieldInput!]
                  Series: [ActorActedInSeriesDisconnectFieldInput!]
                }

                input ActorActedInMovieConnectFieldInput {
                  where: MovieConnectWhere
                }

                input ActorActedInMovieConnectionWhere {
                  AND: [ActorActedInMovieConnectionWhere!]
                  NOT: ActorActedInMovieConnectionWhere
                  OR: [ActorActedInMovieConnectionWhere!]
                  node: MovieWhere
                }

                input ActorActedInMovieCreateFieldInput {
                  node: MovieCreateInput!
                }

                input ActorActedInMovieDeleteFieldInput {
                  where: ActorActedInMovieConnectionWhere
                }

                input ActorActedInMovieDisconnectFieldInput {
                  where: ActorActedInMovieConnectionWhere
                }

                input ActorActedInMovieFieldInput {
                  connect: [ActorActedInMovieConnectFieldInput!]
                  create: [ActorActedInMovieCreateFieldInput!]
                }

                type ActorActedInRelationship {
                  cursor: String!
                  node: Production!
                }

                input ActorActedInSeriesConnectFieldInput {
                  where: SeriesConnectWhere
                }

                input ActorActedInSeriesConnectionWhere {
                  AND: [ActorActedInSeriesConnectionWhere!]
                  NOT: ActorActedInSeriesConnectionWhere
                  OR: [ActorActedInSeriesConnectionWhere!]
                  node: SeriesWhere
                }

                input ActorActedInSeriesCreateFieldInput {
                  node: SeriesCreateInput!
                }

                input ActorActedInSeriesDeleteFieldInput {
                  where: ActorActedInSeriesConnectionWhere
                }

                input ActorActedInSeriesDisconnectFieldInput {
                  where: ActorActedInSeriesConnectionWhere
                }

                input ActorActedInSeriesFieldInput {
                  connect: [ActorActedInSeriesConnectFieldInput!]
                  create: [ActorActedInSeriesCreateFieldInput!]
                }

                type ActorAggregateSelection {
                  count: Int!
                  name: StringAggregateSelection!
                }

                input ActorConnectInput {
                  actedIn: ActorActedInConnectInput
                }

                input ActorCreateInput {
                  actedIn: ActorActedInCreateInput
                  name: String!
                }

                input ActorDeleteInput {
                  actedIn: ActorActedInDeleteInput
                }

                input ActorDisconnectInput {
                  actedIn: ActorActedInDisconnectInput
                }

                type ActorEdge {
                  cursor: String!
                  node: Actor!
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
                  actedIn: ActorActedInCreateFieldInput
                }

                \\"\\"\\"
                Fields to sort Actors by. The order in which sorts are applied is not guaranteed when specifying many fields in one ActorSort object.
                \\"\\"\\"
                input ActorSort {
                  name: SortDirection
                }

                input ActorUpdateInput {
                  name: String
                }

                input ActorWhere {
                  AND: [ActorWhere!]
                  NOT: ActorWhere
                  OR: [ActorWhere!]
                  actedIn: ProductionWhere @deprecated(reason: \\"Use \`actedIn_SOME\` instead.\\")
                  actedInConnection: ActorActedInConnectionWhere @deprecated(reason: \\"Use \`actedInConnection_SOME\` instead.\\")
                  \\"\\"\\"
                  Return Actors where all of the related ActorActedInConnections match this filter
                  \\"\\"\\"
                  actedInConnection_ALL: ActorActedInConnectionWhere
                  \\"\\"\\"
                  Return Actors where none of the related ActorActedInConnections match this filter
                  \\"\\"\\"
                  actedInConnection_NONE: ActorActedInConnectionWhere
                  \\"\\"\\"
                  Return Actors where one of the related ActorActedInConnections match this filter
                  \\"\\"\\"
                  actedInConnection_SINGLE: ActorActedInConnectionWhere
                  \\"\\"\\"
                  Return Actors where some of the related ActorActedInConnections match this filter
                  \\"\\"\\"
                  actedInConnection_SOME: ActorActedInConnectionWhere
                  \\"\\"\\"Return Actors where all of the related Productions match this filter\\"\\"\\"
                  actedIn_ALL: ProductionWhere
                  \\"\\"\\"Return Actors where none of the related Productions match this filter\\"\\"\\"
                  actedIn_NONE: ProductionWhere
                  \\"\\"\\"Return Actors where one of the related Productions match this filter\\"\\"\\"
                  actedIn_SINGLE: ProductionWhere
                  \\"\\"\\"Return Actors where some of the related Productions match this filter\\"\\"\\"
                  actedIn_SOME: ProductionWhere
                  name: String @deprecated(reason: \\"Please use the explicit _EQ version\\")
                  name_CONTAINS: String
                  name_ENDS_WITH: String
                  name_EQ: String
                  name_IN: [String!]
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
                  nodesCreated: Int!
                  relationshipsCreated: Int!
                }

                type CreateMoviesMutationResponse {
                  info: CreateInfo!
                  movies: [Movie!]!
                }

                type CreateSeriesMutationResponse {
                  info: CreateInfo!
                  series: [Series!]!
                }

                \\"\\"\\"
                Information about the number of nodes and relationships deleted during a delete mutation
                \\"\\"\\"
                type DeleteInfo {
                  nodesDeleted: Int!
                  relationshipsDeleted: Int!
                }

                type Movie {
                  description: String
                  title: String!
                }

                type MovieAggregateSelection {
                  count: Int!
                  description: StringAggregateSelection!
                  title: StringAggregateSelection!
                }

                input MovieConnectWhere {
                  node: MovieWhere!
                }

                input MovieCreateInput {
                  description: String
                  title: String!
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
                  description: SortDirection
                  title: SortDirection
                }

                input MovieUpdateInput {
                  description: String
                  title: String
                }

                input MovieWhere {
                  AND: [MovieWhere!]
                  NOT: MovieWhere
                  OR: [MovieWhere!]
                  description: String @deprecated(reason: \\"Please use the explicit _EQ version\\")
                  description_CONTAINS: String
                  description_ENDS_WITH: String
                  description_EQ: String
                  description_IN: [String]
                  description_STARTS_WITH: String
                  title: String @deprecated(reason: \\"Please use the explicit _EQ version\\")
                  title_CONTAINS: String
                  title_ENDS_WITH: String
                  title_EQ: String
                  title_IN: [String!]
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
                  createSeries(input: [SeriesCreateInput!]!): CreateSeriesMutationResponse!
                  deleteActors(delete: ActorDeleteInput, where: ActorWhere): DeleteInfo!
                  deleteMovies(where: MovieWhere): DeleteInfo!
                  deleteSeries(where: SeriesWhere): DeleteInfo!
                  updateActors(connect: ActorConnectInput @deprecated(reason: \\"Top level connect input argument in update is deprecated. Use the nested connect field in the relationship within the update argument\\"), create: ActorRelationInput @deprecated(reason: \\"Top level create input argument in update is deprecated. Use the nested create field in the relationship within the update argument\\"), delete: ActorDeleteInput @deprecated(reason: \\"Top level delete input argument in update is deprecated. Use the nested delete field in the relationship within the update argument\\"), disconnect: ActorDisconnectInput @deprecated(reason: \\"Top level disconnect input argument in update is deprecated. Use the nested disconnect field in the relationship within the update argument\\"), update: ActorUpdateInput, where: ActorWhere): UpdateActorsMutationResponse!
                  updateMovies(update: MovieUpdateInput, where: MovieWhere): UpdateMoviesMutationResponse!
                  updateSeries(update: SeriesUpdateInput, where: SeriesWhere): UpdateSeriesMutationResponse!
                }

                \\"\\"\\"Pagination information (Relay)\\"\\"\\"
                type PageInfo {
                  endCursor: String
                  hasNextPage: Boolean!
                  hasPreviousPage: Boolean!
                  startCursor: String
                }

                union Production = Movie | Series

                input ProductionWhere {
                  Movie: MovieWhere
                  Series: SeriesWhere
                }

                type Query {
                  actors(limit: Int, offset: Int, options: ActorOptions @deprecated(reason: \\"Query options argument is deprecated, please use pagination arguments like limit, offset and sort instead.\\"), sort: [ActorSort!], where: ActorWhere): [Actor!]!
                  actorsAggregate(where: ActorWhere): ActorAggregateSelection!
                  actorsConnection(after: String, first: Int, sort: [ActorSort!], where: ActorWhere): ActorsConnection!
                  movies(limit: Int, offset: Int, options: MovieOptions @deprecated(reason: \\"Query options argument is deprecated, please use pagination arguments like limit, offset and sort instead.\\"), sort: [MovieSort!], where: MovieWhere): [Movie!]!
                  moviesAggregate(where: MovieWhere): MovieAggregateSelection!
                  moviesConnection(after: String, first: Int, sort: [MovieSort!], where: MovieWhere): MoviesConnection!
                  productions(limit: Int, offset: Int, options: QueryOptions @deprecated(reason: \\"Query options argument is deprecated, please use pagination arguments like limit, offset and sort instead.\\"), where: ProductionWhere): [Production!]!
                  series(limit: Int, offset: Int, options: SeriesOptions @deprecated(reason: \\"Query options argument is deprecated, please use pagination arguments like limit, offset and sort instead.\\"), sort: [SeriesSort!], where: SeriesWhere): [Series!]!
                  seriesAggregate(where: SeriesWhere): SeriesAggregateSelection!
                  seriesConnection(after: String, first: Int, sort: [SeriesSort!], where: SeriesWhere): SeriesConnection!
                }

                \\"\\"\\"Input type for options that can be specified on a query operation.\\"\\"\\"
                input QueryOptions {
                  limit: Int
                  offset: Int
                }

                type Series {
                  description: String
                  name: String!
                }

                type SeriesAggregateSelection {
                  count: Int!
                  description: StringAggregateSelection!
                  name: StringAggregateSelection!
                }

                input SeriesConnectWhere {
                  node: SeriesWhere!
                }

                type SeriesConnection {
                  edges: [SeriesEdge!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
                }

                input SeriesCreateInput {
                  description: String
                  name: String!
                }

                type SeriesEdge {
                  cursor: String!
                  node: Series!
                }

                input SeriesOptions {
                  limit: Int
                  offset: Int
                  \\"\\"\\"
                  Specify one or more SeriesSort objects to sort Series by. The sorts will be applied in the order in which they are arranged in the array.
                  \\"\\"\\"
                  sort: [SeriesSort!]
                }

                \\"\\"\\"
                Fields to sort Series by. The order in which sorts are applied is not guaranteed when specifying many fields in one SeriesSort object.
                \\"\\"\\"
                input SeriesSort {
                  description: SortDirection
                  name: SortDirection
                }

                input SeriesUpdateInput {
                  description: String
                  name: String
                }

                input SeriesWhere {
                  AND: [SeriesWhere!]
                  NOT: SeriesWhere
                  OR: [SeriesWhere!]
                  description: String @deprecated(reason: \\"Please use the explicit _EQ version\\")
                  description_CONTAINS: String
                  description_ENDS_WITH: String
                  description_EQ: String
                  description_IN: [String]
                  description_STARTS_WITH: String
                  name: String @deprecated(reason: \\"Please use the explicit _EQ version\\")
                  name_CONTAINS: String
                  name_ENDS_WITH: String
                  name_EQ: String
                  name_IN: [String!]
                  name_STARTS_WITH: String
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
                  nodesCreated: Int!
                  nodesDeleted: Int!
                  relationshipsCreated: Int!
                  relationshipsDeleted: Int!
                }

                type UpdateMoviesMutationResponse {
                  info: UpdateInfo!
                  movies: [Movie!]!
                }

                type UpdateSeriesMutationResponse {
                  info: UpdateInfo!
                  series: [Series!]!
                }"
            `);
        });

        test("Prevent update on nested relationships", async () => {
            const typeDefs = gql`
                type Movie @query(aggregate: true) @node {
                    title: String!
                    description: String
                    actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN)
                }

                type Series @query(aggregate: true) @node {
                    name: String!
                    description: String
                }

                union Production = Movie | Series

                type Actor @query(aggregate: true) @node {
                    name: String!
                    actedIn: [Production!]! @relationship(type: "ACTED_IN", direction: OUT) @settable(onUpdate: false)
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
                  actedIn(directed: Boolean = true, limit: Int, offset: Int, options: QueryOptions @deprecated(reason: \\"Query options argument is deprecated, please use pagination arguments like limit, offset and sort instead.\\"), where: ProductionWhere): [Production!]!
                  actedInConnection(after: String, directed: Boolean = true, first: Int, where: ActorActedInConnectionWhere): ActorActedInConnection!
                  name: String!
                }

                input ActorActedInConnectInput {
                  Movie: [ActorActedInMovieConnectFieldInput!]
                  Series: [ActorActedInSeriesConnectFieldInput!]
                }

                type ActorActedInConnection {
                  edges: [ActorActedInRelationship!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
                }

                input ActorActedInConnectionWhere {
                  Movie: ActorActedInMovieConnectionWhere
                  Series: ActorActedInSeriesConnectionWhere
                }

                input ActorActedInCreateFieldInput {
                  Movie: [ActorActedInMovieCreateFieldInput!]
                  Series: [ActorActedInSeriesCreateFieldInput!]
                }

                input ActorActedInCreateInput {
                  Movie: ActorActedInMovieFieldInput
                  Series: ActorActedInSeriesFieldInput
                }

                input ActorActedInDeleteInput {
                  Movie: [ActorActedInMovieDeleteFieldInput!]
                  Series: [ActorActedInSeriesDeleteFieldInput!]
                }

                input ActorActedInDisconnectInput {
                  Movie: [ActorActedInMovieDisconnectFieldInput!]
                  Series: [ActorActedInSeriesDisconnectFieldInput!]
                }

                input ActorActedInMovieConnectFieldInput {
                  connect: [MovieConnectInput!]
                  where: MovieConnectWhere
                }

                input ActorActedInMovieConnectionWhere {
                  AND: [ActorActedInMovieConnectionWhere!]
                  NOT: ActorActedInMovieConnectionWhere
                  OR: [ActorActedInMovieConnectionWhere!]
                  node: MovieWhere
                }

                input ActorActedInMovieCreateFieldInput {
                  node: MovieCreateInput!
                }

                input ActorActedInMovieDeleteFieldInput {
                  delete: MovieDeleteInput
                  where: ActorActedInMovieConnectionWhere
                }

                input ActorActedInMovieDisconnectFieldInput {
                  disconnect: MovieDisconnectInput
                  where: ActorActedInMovieConnectionWhere
                }

                input ActorActedInMovieFieldInput {
                  connect: [ActorActedInMovieConnectFieldInput!]
                  create: [ActorActedInMovieCreateFieldInput!]
                }

                type ActorActedInRelationship {
                  cursor: String!
                  node: Production!
                }

                input ActorActedInSeriesConnectFieldInput {
                  where: SeriesConnectWhere
                }

                input ActorActedInSeriesConnectionWhere {
                  AND: [ActorActedInSeriesConnectionWhere!]
                  NOT: ActorActedInSeriesConnectionWhere
                  OR: [ActorActedInSeriesConnectionWhere!]
                  node: SeriesWhere
                }

                input ActorActedInSeriesCreateFieldInput {
                  node: SeriesCreateInput!
                }

                input ActorActedInSeriesDeleteFieldInput {
                  where: ActorActedInSeriesConnectionWhere
                }

                input ActorActedInSeriesDisconnectFieldInput {
                  where: ActorActedInSeriesConnectionWhere
                }

                input ActorActedInSeriesFieldInput {
                  connect: [ActorActedInSeriesConnectFieldInput!]
                  create: [ActorActedInSeriesCreateFieldInput!]
                }

                type ActorAggregateSelection {
                  count: Int!
                  name: StringAggregateSelection!
                }

                input ActorConnectInput {
                  actedIn: ActorActedInConnectInput
                }

                input ActorConnectWhere {
                  node: ActorWhere!
                }

                input ActorCreateInput {
                  actedIn: ActorActedInCreateInput
                  name: String!
                }

                input ActorDeleteInput {
                  actedIn: ActorActedInDeleteInput
                }

                input ActorDisconnectInput {
                  actedIn: ActorActedInDisconnectInput
                }

                type ActorEdge {
                  cursor: String!
                  node: Actor!
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
                  actedIn: ActorActedInCreateFieldInput
                }

                \\"\\"\\"
                Fields to sort Actors by. The order in which sorts are applied is not guaranteed when specifying many fields in one ActorSort object.
                \\"\\"\\"
                input ActorSort {
                  name: SortDirection
                }

                input ActorUpdateInput {
                  name: String
                }

                input ActorWhere {
                  AND: [ActorWhere!]
                  NOT: ActorWhere
                  OR: [ActorWhere!]
                  actedIn: ProductionWhere @deprecated(reason: \\"Use \`actedIn_SOME\` instead.\\")
                  actedInConnection: ActorActedInConnectionWhere @deprecated(reason: \\"Use \`actedInConnection_SOME\` instead.\\")
                  \\"\\"\\"
                  Return Actors where all of the related ActorActedInConnections match this filter
                  \\"\\"\\"
                  actedInConnection_ALL: ActorActedInConnectionWhere
                  \\"\\"\\"
                  Return Actors where none of the related ActorActedInConnections match this filter
                  \\"\\"\\"
                  actedInConnection_NONE: ActorActedInConnectionWhere
                  \\"\\"\\"
                  Return Actors where one of the related ActorActedInConnections match this filter
                  \\"\\"\\"
                  actedInConnection_SINGLE: ActorActedInConnectionWhere
                  \\"\\"\\"
                  Return Actors where some of the related ActorActedInConnections match this filter
                  \\"\\"\\"
                  actedInConnection_SOME: ActorActedInConnectionWhere
                  \\"\\"\\"Return Actors where all of the related Productions match this filter\\"\\"\\"
                  actedIn_ALL: ProductionWhere
                  \\"\\"\\"Return Actors where none of the related Productions match this filter\\"\\"\\"
                  actedIn_NONE: ProductionWhere
                  \\"\\"\\"Return Actors where one of the related Productions match this filter\\"\\"\\"
                  actedIn_SINGLE: ProductionWhere
                  \\"\\"\\"Return Actors where some of the related Productions match this filter\\"\\"\\"
                  actedIn_SOME: ProductionWhere
                  name: String @deprecated(reason: \\"Please use the explicit _EQ version\\")
                  name_CONTAINS: String
                  name_ENDS_WITH: String
                  name_EQ: String
                  name_IN: [String!]
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
                  nodesCreated: Int!
                  relationshipsCreated: Int!
                }

                type CreateMoviesMutationResponse {
                  info: CreateInfo!
                  movies: [Movie!]!
                }

                type CreateSeriesMutationResponse {
                  info: CreateInfo!
                  series: [Series!]!
                }

                \\"\\"\\"
                Information about the number of nodes and relationships deleted during a delete mutation
                \\"\\"\\"
                type DeleteInfo {
                  nodesDeleted: Int!
                  relationshipsDeleted: Int!
                }

                type Movie {
                  actors(directed: Boolean = true, limit: Int, offset: Int, options: ActorOptions @deprecated(reason: \\"Query options argument is deprecated, please use pagination arguments like limit, offset and sort instead.\\"), sort: [ActorSort!], where: ActorWhere): [Actor!]!
                  actorsAggregate(directed: Boolean = true, where: ActorWhere): MovieActorActorsAggregationSelection
                  actorsConnection(after: String, directed: Boolean = true, first: Int, sort: [MovieActorsConnectionSort!], where: MovieActorsConnectionWhere): MovieActorsConnection!
                  description: String
                  title: String!
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
                  count: Int!
                  description: StringAggregateSelection!
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
                  description: String
                  title: String!
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
                  description: SortDirection
                  title: SortDirection
                }

                input MovieUpdateInput {
                  actors: [MovieActorsUpdateFieldInput!]
                  description: String
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
                  description: String @deprecated(reason: \\"Please use the explicit _EQ version\\")
                  description_CONTAINS: String
                  description_ENDS_WITH: String
                  description_EQ: String
                  description_IN: [String]
                  description_STARTS_WITH: String
                  title: String @deprecated(reason: \\"Please use the explicit _EQ version\\")
                  title_CONTAINS: String
                  title_ENDS_WITH: String
                  title_EQ: String
                  title_IN: [String!]
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
                  createSeries(input: [SeriesCreateInput!]!): CreateSeriesMutationResponse!
                  deleteActors(delete: ActorDeleteInput, where: ActorWhere): DeleteInfo!
                  deleteMovies(delete: MovieDeleteInput, where: MovieWhere): DeleteInfo!
                  deleteSeries(where: SeriesWhere): DeleteInfo!
                  updateActors(connect: ActorConnectInput @deprecated(reason: \\"Top level connect input argument in update is deprecated. Use the nested connect field in the relationship within the update argument\\"), create: ActorRelationInput @deprecated(reason: \\"Top level create input argument in update is deprecated. Use the nested create field in the relationship within the update argument\\"), delete: ActorDeleteInput @deprecated(reason: \\"Top level delete input argument in update is deprecated. Use the nested delete field in the relationship within the update argument\\"), disconnect: ActorDisconnectInput @deprecated(reason: \\"Top level disconnect input argument in update is deprecated. Use the nested disconnect field in the relationship within the update argument\\"), update: ActorUpdateInput, where: ActorWhere): UpdateActorsMutationResponse!
                  updateMovies(connect: MovieConnectInput @deprecated(reason: \\"Top level connect input argument in update is deprecated. Use the nested connect field in the relationship within the update argument\\"), create: MovieRelationInput @deprecated(reason: \\"Top level create input argument in update is deprecated. Use the nested create field in the relationship within the update argument\\"), delete: MovieDeleteInput @deprecated(reason: \\"Top level delete input argument in update is deprecated. Use the nested delete field in the relationship within the update argument\\"), disconnect: MovieDisconnectInput @deprecated(reason: \\"Top level disconnect input argument in update is deprecated. Use the nested disconnect field in the relationship within the update argument\\"), update: MovieUpdateInput, where: MovieWhere): UpdateMoviesMutationResponse!
                  updateSeries(update: SeriesUpdateInput, where: SeriesWhere): UpdateSeriesMutationResponse!
                }

                \\"\\"\\"Pagination information (Relay)\\"\\"\\"
                type PageInfo {
                  endCursor: String
                  hasNextPage: Boolean!
                  hasPreviousPage: Boolean!
                  startCursor: String
                }

                union Production = Movie | Series

                input ProductionWhere {
                  Movie: MovieWhere
                  Series: SeriesWhere
                }

                type Query {
                  actors(limit: Int, offset: Int, options: ActorOptions @deprecated(reason: \\"Query options argument is deprecated, please use pagination arguments like limit, offset and sort instead.\\"), sort: [ActorSort!], where: ActorWhere): [Actor!]!
                  actorsAggregate(where: ActorWhere): ActorAggregateSelection!
                  actorsConnection(after: String, first: Int, sort: [ActorSort!], where: ActorWhere): ActorsConnection!
                  movies(limit: Int, offset: Int, options: MovieOptions @deprecated(reason: \\"Query options argument is deprecated, please use pagination arguments like limit, offset and sort instead.\\"), sort: [MovieSort!], where: MovieWhere): [Movie!]!
                  moviesAggregate(where: MovieWhere): MovieAggregateSelection!
                  moviesConnection(after: String, first: Int, sort: [MovieSort!], where: MovieWhere): MoviesConnection!
                  productions(limit: Int, offset: Int, options: QueryOptions @deprecated(reason: \\"Query options argument is deprecated, please use pagination arguments like limit, offset and sort instead.\\"), where: ProductionWhere): [Production!]!
                  series(limit: Int, offset: Int, options: SeriesOptions @deprecated(reason: \\"Query options argument is deprecated, please use pagination arguments like limit, offset and sort instead.\\"), sort: [SeriesSort!], where: SeriesWhere): [Series!]!
                  seriesAggregate(where: SeriesWhere): SeriesAggregateSelection!
                  seriesConnection(after: String, first: Int, sort: [SeriesSort!], where: SeriesWhere): SeriesConnection!
                }

                \\"\\"\\"Input type for options that can be specified on a query operation.\\"\\"\\"
                input QueryOptions {
                  limit: Int
                  offset: Int
                }

                type Series {
                  description: String
                  name: String!
                }

                type SeriesAggregateSelection {
                  count: Int!
                  description: StringAggregateSelection!
                  name: StringAggregateSelection!
                }

                input SeriesConnectWhere {
                  node: SeriesWhere!
                }

                type SeriesConnection {
                  edges: [SeriesEdge!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
                }

                input SeriesCreateInput {
                  description: String
                  name: String!
                }

                type SeriesEdge {
                  cursor: String!
                  node: Series!
                }

                input SeriesOptions {
                  limit: Int
                  offset: Int
                  \\"\\"\\"
                  Specify one or more SeriesSort objects to sort Series by. The sorts will be applied in the order in which they are arranged in the array.
                  \\"\\"\\"
                  sort: [SeriesSort!]
                }

                \\"\\"\\"
                Fields to sort Series by. The order in which sorts are applied is not guaranteed when specifying many fields in one SeriesSort object.
                \\"\\"\\"
                input SeriesSort {
                  description: SortDirection
                  name: SortDirection
                }

                input SeriesUpdateInput {
                  description: String
                  name: String
                }

                input SeriesWhere {
                  AND: [SeriesWhere!]
                  NOT: SeriesWhere
                  OR: [SeriesWhere!]
                  description: String @deprecated(reason: \\"Please use the explicit _EQ version\\")
                  description_CONTAINS: String
                  description_ENDS_WITH: String
                  description_EQ: String
                  description_IN: [String]
                  description_STARTS_WITH: String
                  name: String @deprecated(reason: \\"Please use the explicit _EQ version\\")
                  name_CONTAINS: String
                  name_ENDS_WITH: String
                  name_EQ: String
                  name_IN: [String!]
                  name_STARTS_WITH: String
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
                  nodesCreated: Int!
                  nodesDeleted: Int!
                  relationshipsCreated: Int!
                  relationshipsDeleted: Int!
                }

                type UpdateMoviesMutationResponse {
                  info: UpdateInfo!
                  movies: [Movie!]!
                }

                type UpdateSeriesMutationResponse {
                  info: UpdateInfo!
                  series: [Series!]!
                }"
            `);
        });

        test("Prevent create on nested relationships", async () => {
            const typeDefs = gql`
                type Movie @query(aggregate: true) @node {
                    title: String!
                    description: String
                    actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN)
                }

                type Series @query(aggregate: true) @node {
                    name: String!
                    description: String
                }

                union Production = Movie | Series

                type Actor @query(aggregate: true) @node {
                    name: String!
                    actedIn: [Production!]! @relationship(type: "ACTED_IN", direction: OUT) @settable(onCreate: false)
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
                  actedIn(directed: Boolean = true, limit: Int, offset: Int, options: QueryOptions @deprecated(reason: \\"Query options argument is deprecated, please use pagination arguments like limit, offset and sort instead.\\"), where: ProductionWhere): [Production!]!
                  actedInConnection(after: String, directed: Boolean = true, first: Int, where: ActorActedInConnectionWhere): ActorActedInConnection!
                  name: String!
                }

                input ActorActedInConnectInput {
                  Movie: [ActorActedInMovieConnectFieldInput!]
                  Series: [ActorActedInSeriesConnectFieldInput!]
                }

                type ActorActedInConnection {
                  edges: [ActorActedInRelationship!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
                }

                input ActorActedInConnectionWhere {
                  Movie: ActorActedInMovieConnectionWhere
                  Series: ActorActedInSeriesConnectionWhere
                }

                input ActorActedInCreateFieldInput {
                  Movie: [ActorActedInMovieCreateFieldInput!]
                  Series: [ActorActedInSeriesCreateFieldInput!]
                }

                input ActorActedInDeleteInput {
                  Movie: [ActorActedInMovieDeleteFieldInput!]
                  Series: [ActorActedInSeriesDeleteFieldInput!]
                }

                input ActorActedInDisconnectInput {
                  Movie: [ActorActedInMovieDisconnectFieldInput!]
                  Series: [ActorActedInSeriesDisconnectFieldInput!]
                }

                input ActorActedInMovieConnectFieldInput {
                  connect: [MovieConnectInput!]
                  where: MovieConnectWhere
                }

                input ActorActedInMovieConnectionWhere {
                  AND: [ActorActedInMovieConnectionWhere!]
                  NOT: ActorActedInMovieConnectionWhere
                  OR: [ActorActedInMovieConnectionWhere!]
                  node: MovieWhere
                }

                input ActorActedInMovieCreateFieldInput {
                  node: MovieCreateInput!
                }

                input ActorActedInMovieDeleteFieldInput {
                  delete: MovieDeleteInput
                  where: ActorActedInMovieConnectionWhere
                }

                input ActorActedInMovieDisconnectFieldInput {
                  disconnect: MovieDisconnectInput
                  where: ActorActedInMovieConnectionWhere
                }

                input ActorActedInMovieUpdateConnectionInput {
                  node: MovieUpdateInput
                }

                input ActorActedInMovieUpdateFieldInput {
                  connect: [ActorActedInMovieConnectFieldInput!]
                  create: [ActorActedInMovieCreateFieldInput!]
                  delete: [ActorActedInMovieDeleteFieldInput!]
                  disconnect: [ActorActedInMovieDisconnectFieldInput!]
                  update: ActorActedInMovieUpdateConnectionInput
                  where: ActorActedInMovieConnectionWhere
                }

                type ActorActedInRelationship {
                  cursor: String!
                  node: Production!
                }

                input ActorActedInSeriesConnectFieldInput {
                  where: SeriesConnectWhere
                }

                input ActorActedInSeriesConnectionWhere {
                  AND: [ActorActedInSeriesConnectionWhere!]
                  NOT: ActorActedInSeriesConnectionWhere
                  OR: [ActorActedInSeriesConnectionWhere!]
                  node: SeriesWhere
                }

                input ActorActedInSeriesCreateFieldInput {
                  node: SeriesCreateInput!
                }

                input ActorActedInSeriesDeleteFieldInput {
                  where: ActorActedInSeriesConnectionWhere
                }

                input ActorActedInSeriesDisconnectFieldInput {
                  where: ActorActedInSeriesConnectionWhere
                }

                input ActorActedInSeriesUpdateConnectionInput {
                  node: SeriesUpdateInput
                }

                input ActorActedInSeriesUpdateFieldInput {
                  connect: [ActorActedInSeriesConnectFieldInput!]
                  create: [ActorActedInSeriesCreateFieldInput!]
                  delete: [ActorActedInSeriesDeleteFieldInput!]
                  disconnect: [ActorActedInSeriesDisconnectFieldInput!]
                  update: ActorActedInSeriesUpdateConnectionInput
                  where: ActorActedInSeriesConnectionWhere
                }

                input ActorActedInUpdateInput {
                  Movie: [ActorActedInMovieUpdateFieldInput!]
                  Series: [ActorActedInSeriesUpdateFieldInput!]
                }

                type ActorAggregateSelection {
                  count: Int!
                  name: StringAggregateSelection!
                }

                input ActorConnectInput {
                  actedIn: ActorActedInConnectInput
                }

                input ActorConnectWhere {
                  node: ActorWhere!
                }

                input ActorCreateInput {
                  name: String!
                }

                input ActorDeleteInput {
                  actedIn: ActorActedInDeleteInput
                }

                input ActorDisconnectInput {
                  actedIn: ActorActedInDisconnectInput
                }

                type ActorEdge {
                  cursor: String!
                  node: Actor!
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
                  actedIn: ActorActedInCreateFieldInput
                }

                \\"\\"\\"
                Fields to sort Actors by. The order in which sorts are applied is not guaranteed when specifying many fields in one ActorSort object.
                \\"\\"\\"
                input ActorSort {
                  name: SortDirection
                }

                input ActorUpdateInput {
                  actedIn: ActorActedInUpdateInput
                  name: String
                }

                input ActorWhere {
                  AND: [ActorWhere!]
                  NOT: ActorWhere
                  OR: [ActorWhere!]
                  actedIn: ProductionWhere @deprecated(reason: \\"Use \`actedIn_SOME\` instead.\\")
                  actedInConnection: ActorActedInConnectionWhere @deprecated(reason: \\"Use \`actedInConnection_SOME\` instead.\\")
                  \\"\\"\\"
                  Return Actors where all of the related ActorActedInConnections match this filter
                  \\"\\"\\"
                  actedInConnection_ALL: ActorActedInConnectionWhere
                  \\"\\"\\"
                  Return Actors where none of the related ActorActedInConnections match this filter
                  \\"\\"\\"
                  actedInConnection_NONE: ActorActedInConnectionWhere
                  \\"\\"\\"
                  Return Actors where one of the related ActorActedInConnections match this filter
                  \\"\\"\\"
                  actedInConnection_SINGLE: ActorActedInConnectionWhere
                  \\"\\"\\"
                  Return Actors where some of the related ActorActedInConnections match this filter
                  \\"\\"\\"
                  actedInConnection_SOME: ActorActedInConnectionWhere
                  \\"\\"\\"Return Actors where all of the related Productions match this filter\\"\\"\\"
                  actedIn_ALL: ProductionWhere
                  \\"\\"\\"Return Actors where none of the related Productions match this filter\\"\\"\\"
                  actedIn_NONE: ProductionWhere
                  \\"\\"\\"Return Actors where one of the related Productions match this filter\\"\\"\\"
                  actedIn_SINGLE: ProductionWhere
                  \\"\\"\\"Return Actors where some of the related Productions match this filter\\"\\"\\"
                  actedIn_SOME: ProductionWhere
                  name: String @deprecated(reason: \\"Please use the explicit _EQ version\\")
                  name_CONTAINS: String
                  name_ENDS_WITH: String
                  name_EQ: String
                  name_IN: [String!]
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
                  nodesCreated: Int!
                  relationshipsCreated: Int!
                }

                type CreateMoviesMutationResponse {
                  info: CreateInfo!
                  movies: [Movie!]!
                }

                type CreateSeriesMutationResponse {
                  info: CreateInfo!
                  series: [Series!]!
                }

                \\"\\"\\"
                Information about the number of nodes and relationships deleted during a delete mutation
                \\"\\"\\"
                type DeleteInfo {
                  nodesDeleted: Int!
                  relationshipsDeleted: Int!
                }

                type Movie {
                  actors(directed: Boolean = true, limit: Int, offset: Int, options: ActorOptions @deprecated(reason: \\"Query options argument is deprecated, please use pagination arguments like limit, offset and sort instead.\\"), sort: [ActorSort!], where: ActorWhere): [Actor!]!
                  actorsAggregate(directed: Boolean = true, where: ActorWhere): MovieActorActorsAggregationSelection
                  actorsConnection(after: String, directed: Boolean = true, first: Int, sort: [MovieActorsConnectionSort!], where: MovieActorsConnectionWhere): MovieActorsConnection!
                  description: String
                  title: String!
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
                  count: Int!
                  description: StringAggregateSelection!
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
                  description: String
                  title: String!
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
                  description: SortDirection
                  title: SortDirection
                }

                input MovieUpdateInput {
                  actors: [MovieActorsUpdateFieldInput!]
                  description: String
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
                  description: String @deprecated(reason: \\"Please use the explicit _EQ version\\")
                  description_CONTAINS: String
                  description_ENDS_WITH: String
                  description_EQ: String
                  description_IN: [String]
                  description_STARTS_WITH: String
                  title: String @deprecated(reason: \\"Please use the explicit _EQ version\\")
                  title_CONTAINS: String
                  title_ENDS_WITH: String
                  title_EQ: String
                  title_IN: [String!]
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
                  createSeries(input: [SeriesCreateInput!]!): CreateSeriesMutationResponse!
                  deleteActors(delete: ActorDeleteInput, where: ActorWhere): DeleteInfo!
                  deleteMovies(delete: MovieDeleteInput, where: MovieWhere): DeleteInfo!
                  deleteSeries(where: SeriesWhere): DeleteInfo!
                  updateActors(connect: ActorConnectInput @deprecated(reason: \\"Top level connect input argument in update is deprecated. Use the nested connect field in the relationship within the update argument\\"), create: ActorRelationInput @deprecated(reason: \\"Top level create input argument in update is deprecated. Use the nested create field in the relationship within the update argument\\"), delete: ActorDeleteInput @deprecated(reason: \\"Top level delete input argument in update is deprecated. Use the nested delete field in the relationship within the update argument\\"), disconnect: ActorDisconnectInput @deprecated(reason: \\"Top level disconnect input argument in update is deprecated. Use the nested disconnect field in the relationship within the update argument\\"), update: ActorUpdateInput, where: ActorWhere): UpdateActorsMutationResponse!
                  updateMovies(connect: MovieConnectInput @deprecated(reason: \\"Top level connect input argument in update is deprecated. Use the nested connect field in the relationship within the update argument\\"), create: MovieRelationInput @deprecated(reason: \\"Top level create input argument in update is deprecated. Use the nested create field in the relationship within the update argument\\"), delete: MovieDeleteInput @deprecated(reason: \\"Top level delete input argument in update is deprecated. Use the nested delete field in the relationship within the update argument\\"), disconnect: MovieDisconnectInput @deprecated(reason: \\"Top level disconnect input argument in update is deprecated. Use the nested disconnect field in the relationship within the update argument\\"), update: MovieUpdateInput, where: MovieWhere): UpdateMoviesMutationResponse!
                  updateSeries(update: SeriesUpdateInput, where: SeriesWhere): UpdateSeriesMutationResponse!
                }

                \\"\\"\\"Pagination information (Relay)\\"\\"\\"
                type PageInfo {
                  endCursor: String
                  hasNextPage: Boolean!
                  hasPreviousPage: Boolean!
                  startCursor: String
                }

                union Production = Movie | Series

                input ProductionWhere {
                  Movie: MovieWhere
                  Series: SeriesWhere
                }

                type Query {
                  actors(limit: Int, offset: Int, options: ActorOptions @deprecated(reason: \\"Query options argument is deprecated, please use pagination arguments like limit, offset and sort instead.\\"), sort: [ActorSort!], where: ActorWhere): [Actor!]!
                  actorsAggregate(where: ActorWhere): ActorAggregateSelection!
                  actorsConnection(after: String, first: Int, sort: [ActorSort!], where: ActorWhere): ActorsConnection!
                  movies(limit: Int, offset: Int, options: MovieOptions @deprecated(reason: \\"Query options argument is deprecated, please use pagination arguments like limit, offset and sort instead.\\"), sort: [MovieSort!], where: MovieWhere): [Movie!]!
                  moviesAggregate(where: MovieWhere): MovieAggregateSelection!
                  moviesConnection(after: String, first: Int, sort: [MovieSort!], where: MovieWhere): MoviesConnection!
                  productions(limit: Int, offset: Int, options: QueryOptions @deprecated(reason: \\"Query options argument is deprecated, please use pagination arguments like limit, offset and sort instead.\\"), where: ProductionWhere): [Production!]!
                  series(limit: Int, offset: Int, options: SeriesOptions @deprecated(reason: \\"Query options argument is deprecated, please use pagination arguments like limit, offset and sort instead.\\"), sort: [SeriesSort!], where: SeriesWhere): [Series!]!
                  seriesAggregate(where: SeriesWhere): SeriesAggregateSelection!
                  seriesConnection(after: String, first: Int, sort: [SeriesSort!], where: SeriesWhere): SeriesConnection!
                }

                \\"\\"\\"Input type for options that can be specified on a query operation.\\"\\"\\"
                input QueryOptions {
                  limit: Int
                  offset: Int
                }

                type Series {
                  description: String
                  name: String!
                }

                type SeriesAggregateSelection {
                  count: Int!
                  description: StringAggregateSelection!
                  name: StringAggregateSelection!
                }

                input SeriesConnectWhere {
                  node: SeriesWhere!
                }

                type SeriesConnection {
                  edges: [SeriesEdge!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
                }

                input SeriesCreateInput {
                  description: String
                  name: String!
                }

                type SeriesEdge {
                  cursor: String!
                  node: Series!
                }

                input SeriesOptions {
                  limit: Int
                  offset: Int
                  \\"\\"\\"
                  Specify one or more SeriesSort objects to sort Series by. The sorts will be applied in the order in which they are arranged in the array.
                  \\"\\"\\"
                  sort: [SeriesSort!]
                }

                \\"\\"\\"
                Fields to sort Series by. The order in which sorts are applied is not guaranteed when specifying many fields in one SeriesSort object.
                \\"\\"\\"
                input SeriesSort {
                  description: SortDirection
                  name: SortDirection
                }

                input SeriesUpdateInput {
                  description: String
                  name: String
                }

                input SeriesWhere {
                  AND: [SeriesWhere!]
                  NOT: SeriesWhere
                  OR: [SeriesWhere!]
                  description: String @deprecated(reason: \\"Please use the explicit _EQ version\\")
                  description_CONTAINS: String
                  description_ENDS_WITH: String
                  description_EQ: String
                  description_IN: [String]
                  description_STARTS_WITH: String
                  name: String @deprecated(reason: \\"Please use the explicit _EQ version\\")
                  name_CONTAINS: String
                  name_ENDS_WITH: String
                  name_EQ: String
                  name_IN: [String!]
                  name_STARTS_WITH: String
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
                  nodesCreated: Int!
                  nodesDeleted: Int!
                  relationshipsCreated: Int!
                  relationshipsDeleted: Int!
                }

                type UpdateMoviesMutationResponse {
                  info: UpdateInfo!
                  movies: [Movie!]!
                }

                type UpdateSeriesMutationResponse {
                  info: UpdateInfo!
                  series: [Series!]!
                }"
            `);
        });
    });

    describe("Relationships to an interface type", () => {
        test("Prevent relationship field creation", async () => {
            const typeDefs = gql`
                interface Production {
                    title: String!
                    description: String
                }

                type Movie implements Production @query(aggregate: true) @node {
                    title: String!
                    description: String
                }

                type Series implements Production @query(aggregate: true) @node {
                    title: String!
                    description: String
                }

                type Actor @query(aggregate: true) @node {
                    name: String!
                    actedIn: [Production!]!
                        @relationship(type: "ACTED_IN", direction: OUT)
                        @settable(onCreate: false, onUpdate: true)
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
                  actedIn(directed: Boolean = true, limit: Int, offset: Int, options: ProductionOptions @deprecated(reason: \\"Query options argument is deprecated, please use pagination arguments like limit, offset and sort instead.\\"), sort: [ProductionSort!], where: ProductionWhere): [Production!]!
                  actedInAggregate(directed: Boolean = true, where: ProductionWhere): ActorProductionActedInAggregationSelection
                  actedInConnection(after: String, directed: Boolean = true, first: Int, sort: [ActorActedInConnectionSort!], where: ActorActedInConnectionWhere): ActorActedInConnection!
                  name: String!
                }

                input ActorActedInAggregateInput {
                  AND: [ActorActedInAggregateInput!]
                  NOT: ActorActedInAggregateInput
                  OR: [ActorActedInAggregateInput!]
                  count: Int @deprecated(reason: \\"Please use the explicit _EQ version\\")
                  count_EQ: Int
                  count_GT: Int
                  count_GTE: Int
                  count_LT: Int
                  count_LTE: Int
                  node: ActorActedInNodeAggregationWhereInput
                }

                input ActorActedInConnectFieldInput {
                  where: ProductionConnectWhere
                }

                type ActorActedInConnection {
                  edges: [ActorActedInRelationship!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
                }

                input ActorActedInConnectionSort {
                  node: ProductionSort
                }

                input ActorActedInConnectionWhere {
                  AND: [ActorActedInConnectionWhere!]
                  NOT: ActorActedInConnectionWhere
                  OR: [ActorActedInConnectionWhere!]
                  node: ProductionWhere
                }

                input ActorActedInCreateFieldInput {
                  node: ProductionCreateInput!
                }

                input ActorActedInDeleteFieldInput {
                  where: ActorActedInConnectionWhere
                }

                input ActorActedInDisconnectFieldInput {
                  where: ActorActedInConnectionWhere
                }

                input ActorActedInNodeAggregationWhereInput {
                  AND: [ActorActedInNodeAggregationWhereInput!]
                  NOT: ActorActedInNodeAggregationWhereInput
                  OR: [ActorActedInNodeAggregationWhereInput!]
                  description_AVERAGE_EQUAL: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                  description_AVERAGE_GT: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                  description_AVERAGE_GTE: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                  description_AVERAGE_LENGTH_EQUAL: Float
                  description_AVERAGE_LENGTH_GT: Float
                  description_AVERAGE_LENGTH_GTE: Float
                  description_AVERAGE_LENGTH_LT: Float
                  description_AVERAGE_LENGTH_LTE: Float
                  description_AVERAGE_LT: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                  description_AVERAGE_LTE: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                  description_EQUAL: String @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
                  description_GT: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
                  description_GTE: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
                  description_LONGEST_EQUAL: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                  description_LONGEST_GT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                  description_LONGEST_GTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                  description_LONGEST_LENGTH_EQUAL: Int
                  description_LONGEST_LENGTH_GT: Int
                  description_LONGEST_LENGTH_GTE: Int
                  description_LONGEST_LENGTH_LT: Int
                  description_LONGEST_LENGTH_LTE: Int
                  description_LONGEST_LT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                  description_LONGEST_LTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                  description_LT: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
                  description_LTE: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
                  description_SHORTEST_EQUAL: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                  description_SHORTEST_GT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                  description_SHORTEST_GTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                  description_SHORTEST_LENGTH_EQUAL: Int
                  description_SHORTEST_LENGTH_GT: Int
                  description_SHORTEST_LENGTH_GTE: Int
                  description_SHORTEST_LENGTH_LT: Int
                  description_SHORTEST_LENGTH_LTE: Int
                  description_SHORTEST_LT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                  description_SHORTEST_LTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
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

                type ActorActedInRelationship {
                  cursor: String!
                  node: Production!
                }

                input ActorActedInUpdateConnectionInput {
                  node: ProductionUpdateInput
                }

                input ActorActedInUpdateFieldInput {
                  connect: [ActorActedInConnectFieldInput!]
                  create: [ActorActedInCreateFieldInput!]
                  delete: [ActorActedInDeleteFieldInput!]
                  disconnect: [ActorActedInDisconnectFieldInput!]
                  update: ActorActedInUpdateConnectionInput
                  where: ActorActedInConnectionWhere
                }

                type ActorAggregateSelection {
                  count: Int!
                  name: StringAggregateSelection!
                }

                input ActorConnectInput {
                  actedIn: [ActorActedInConnectFieldInput!]
                }

                input ActorCreateInput {
                  name: String!
                }

                input ActorDeleteInput {
                  actedIn: [ActorActedInDeleteFieldInput!]
                }

                input ActorDisconnectInput {
                  actedIn: [ActorActedInDisconnectFieldInput!]
                }

                type ActorEdge {
                  cursor: String!
                  node: Actor!
                }

                input ActorOptions {
                  limit: Int
                  offset: Int
                  \\"\\"\\"
                  Specify one or more ActorSort objects to sort Actors by. The sorts will be applied in the order in which they are arranged in the array.
                  \\"\\"\\"
                  sort: [ActorSort!]
                }

                type ActorProductionActedInAggregationSelection {
                  count: Int!
                  node: ActorProductionActedInNodeAggregateSelection
                }

                type ActorProductionActedInNodeAggregateSelection {
                  description: StringAggregateSelection!
                  title: StringAggregateSelection!
                }

                input ActorRelationInput {
                  actedIn: [ActorActedInCreateFieldInput!]
                }

                \\"\\"\\"
                Fields to sort Actors by. The order in which sorts are applied is not guaranteed when specifying many fields in one ActorSort object.
                \\"\\"\\"
                input ActorSort {
                  name: SortDirection
                }

                input ActorUpdateInput {
                  actedIn: [ActorActedInUpdateFieldInput!]
                  name: String
                }

                input ActorWhere {
                  AND: [ActorWhere!]
                  NOT: ActorWhere
                  OR: [ActorWhere!]
                  actedIn: ProductionWhere @deprecated(reason: \\"Use \`actedIn_SOME\` instead.\\")
                  actedInAggregate: ActorActedInAggregateInput
                  actedInConnection: ActorActedInConnectionWhere @deprecated(reason: \\"Use \`actedInConnection_SOME\` instead.\\")
                  \\"\\"\\"
                  Return Actors where all of the related ActorActedInConnections match this filter
                  \\"\\"\\"
                  actedInConnection_ALL: ActorActedInConnectionWhere
                  \\"\\"\\"
                  Return Actors where none of the related ActorActedInConnections match this filter
                  \\"\\"\\"
                  actedInConnection_NONE: ActorActedInConnectionWhere
                  \\"\\"\\"
                  Return Actors where one of the related ActorActedInConnections match this filter
                  \\"\\"\\"
                  actedInConnection_SINGLE: ActorActedInConnectionWhere
                  \\"\\"\\"
                  Return Actors where some of the related ActorActedInConnections match this filter
                  \\"\\"\\"
                  actedInConnection_SOME: ActorActedInConnectionWhere
                  \\"\\"\\"Return Actors where all of the related Productions match this filter\\"\\"\\"
                  actedIn_ALL: ProductionWhere
                  \\"\\"\\"Return Actors where none of the related Productions match this filter\\"\\"\\"
                  actedIn_NONE: ProductionWhere
                  \\"\\"\\"Return Actors where one of the related Productions match this filter\\"\\"\\"
                  actedIn_SINGLE: ProductionWhere
                  \\"\\"\\"Return Actors where some of the related Productions match this filter\\"\\"\\"
                  actedIn_SOME: ProductionWhere
                  name: String @deprecated(reason: \\"Please use the explicit _EQ version\\")
                  name_CONTAINS: String
                  name_ENDS_WITH: String
                  name_EQ: String
                  name_IN: [String!]
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
                  nodesCreated: Int!
                  relationshipsCreated: Int!
                }

                type CreateMoviesMutationResponse {
                  info: CreateInfo!
                  movies: [Movie!]!
                }

                type CreateSeriesMutationResponse {
                  info: CreateInfo!
                  series: [Series!]!
                }

                \\"\\"\\"
                Information about the number of nodes and relationships deleted during a delete mutation
                \\"\\"\\"
                type DeleteInfo {
                  nodesDeleted: Int!
                  relationshipsDeleted: Int!
                }

                type Movie implements Production {
                  description: String
                  title: String!
                }

                type MovieAggregateSelection {
                  count: Int!
                  description: StringAggregateSelection!
                  title: StringAggregateSelection!
                }

                input MovieCreateInput {
                  description: String
                  title: String!
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
                  description: SortDirection
                  title: SortDirection
                }

                input MovieUpdateInput {
                  description: String
                  title: String
                }

                input MovieWhere {
                  AND: [MovieWhere!]
                  NOT: MovieWhere
                  OR: [MovieWhere!]
                  description: String @deprecated(reason: \\"Please use the explicit _EQ version\\")
                  description_CONTAINS: String
                  description_ENDS_WITH: String
                  description_EQ: String
                  description_IN: [String]
                  description_STARTS_WITH: String
                  title: String @deprecated(reason: \\"Please use the explicit _EQ version\\")
                  title_CONTAINS: String
                  title_ENDS_WITH: String
                  title_EQ: String
                  title_IN: [String!]
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
                  createSeries(input: [SeriesCreateInput!]!): CreateSeriesMutationResponse!
                  deleteActors(delete: ActorDeleteInput, where: ActorWhere): DeleteInfo!
                  deleteMovies(where: MovieWhere): DeleteInfo!
                  deleteSeries(where: SeriesWhere): DeleteInfo!
                  updateActors(connect: ActorConnectInput @deprecated(reason: \\"Top level connect input argument in update is deprecated. Use the nested connect field in the relationship within the update argument\\"), create: ActorRelationInput @deprecated(reason: \\"Top level create input argument in update is deprecated. Use the nested create field in the relationship within the update argument\\"), delete: ActorDeleteInput @deprecated(reason: \\"Top level delete input argument in update is deprecated. Use the nested delete field in the relationship within the update argument\\"), disconnect: ActorDisconnectInput @deprecated(reason: \\"Top level disconnect input argument in update is deprecated. Use the nested disconnect field in the relationship within the update argument\\"), update: ActorUpdateInput, where: ActorWhere): UpdateActorsMutationResponse!
                  updateMovies(update: MovieUpdateInput, where: MovieWhere): UpdateMoviesMutationResponse!
                  updateSeries(update: SeriesUpdateInput, where: SeriesWhere): UpdateSeriesMutationResponse!
                }

                \\"\\"\\"Pagination information (Relay)\\"\\"\\"
                type PageInfo {
                  endCursor: String
                  hasNextPage: Boolean!
                  hasPreviousPage: Boolean!
                  startCursor: String
                }

                interface Production {
                  description: String
                  title: String!
                }

                type ProductionAggregateSelection {
                  count: Int!
                  description: StringAggregateSelection!
                  title: StringAggregateSelection!
                }

                input ProductionConnectWhere {
                  node: ProductionWhere!
                }

                input ProductionCreateInput {
                  Movie: MovieCreateInput
                  Series: SeriesCreateInput
                }

                type ProductionEdge {
                  cursor: String!
                  node: Production!
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
                  sort: [ProductionSort!]
                }

                \\"\\"\\"
                Fields to sort Productions by. The order in which sorts are applied is not guaranteed when specifying many fields in one ProductionSort object.
                \\"\\"\\"
                input ProductionSort {
                  description: SortDirection
                  title: SortDirection
                }

                input ProductionUpdateInput {
                  description: String
                  title: String
                }

                input ProductionWhere {
                  AND: [ProductionWhere!]
                  NOT: ProductionWhere
                  OR: [ProductionWhere!]
                  description: String @deprecated(reason: \\"Please use the explicit _EQ version\\")
                  description_CONTAINS: String
                  description_ENDS_WITH: String
                  description_EQ: String
                  description_IN: [String]
                  description_STARTS_WITH: String
                  title: String @deprecated(reason: \\"Please use the explicit _EQ version\\")
                  title_CONTAINS: String
                  title_ENDS_WITH: String
                  title_EQ: String
                  title_IN: [String!]
                  title_STARTS_WITH: String
                  typename_IN: [ProductionImplementation!]
                }

                type ProductionsConnection {
                  edges: [ProductionEdge!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
                }

                type Query {
                  actors(limit: Int, offset: Int, options: ActorOptions @deprecated(reason: \\"Query options argument is deprecated, please use pagination arguments like limit, offset and sort instead.\\"), sort: [ActorSort!], where: ActorWhere): [Actor!]!
                  actorsAggregate(where: ActorWhere): ActorAggregateSelection!
                  actorsConnection(after: String, first: Int, sort: [ActorSort!], where: ActorWhere): ActorsConnection!
                  movies(limit: Int, offset: Int, options: MovieOptions @deprecated(reason: \\"Query options argument is deprecated, please use pagination arguments like limit, offset and sort instead.\\"), sort: [MovieSort!], where: MovieWhere): [Movie!]!
                  moviesAggregate(where: MovieWhere): MovieAggregateSelection!
                  moviesConnection(after: String, first: Int, sort: [MovieSort!], where: MovieWhere): MoviesConnection!
                  productions(limit: Int, offset: Int, options: ProductionOptions @deprecated(reason: \\"Query options argument is deprecated, please use pagination arguments like limit, offset and sort instead.\\"), sort: [ProductionSort!], where: ProductionWhere): [Production!]!
                  productionsAggregate(where: ProductionWhere): ProductionAggregateSelection!
                  productionsConnection(after: String, first: Int, sort: [ProductionSort!], where: ProductionWhere): ProductionsConnection!
                  series(limit: Int, offset: Int, options: SeriesOptions @deprecated(reason: \\"Query options argument is deprecated, please use pagination arguments like limit, offset and sort instead.\\"), sort: [SeriesSort!], where: SeriesWhere): [Series!]!
                  seriesAggregate(where: SeriesWhere): SeriesAggregateSelection!
                  seriesConnection(after: String, first: Int, sort: [SeriesSort!], where: SeriesWhere): SeriesConnection!
                }

                type Series implements Production {
                  description: String
                  title: String!
                }

                type SeriesAggregateSelection {
                  count: Int!
                  description: StringAggregateSelection!
                  title: StringAggregateSelection!
                }

                type SeriesConnection {
                  edges: [SeriesEdge!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
                }

                input SeriesCreateInput {
                  description: String
                  title: String!
                }

                type SeriesEdge {
                  cursor: String!
                  node: Series!
                }

                input SeriesOptions {
                  limit: Int
                  offset: Int
                  \\"\\"\\"
                  Specify one or more SeriesSort objects to sort Series by. The sorts will be applied in the order in which they are arranged in the array.
                  \\"\\"\\"
                  sort: [SeriesSort!]
                }

                \\"\\"\\"
                Fields to sort Series by. The order in which sorts are applied is not guaranteed when specifying many fields in one SeriesSort object.
                \\"\\"\\"
                input SeriesSort {
                  description: SortDirection
                  title: SortDirection
                }

                input SeriesUpdateInput {
                  description: String
                  title: String
                }

                input SeriesWhere {
                  AND: [SeriesWhere!]
                  NOT: SeriesWhere
                  OR: [SeriesWhere!]
                  description: String @deprecated(reason: \\"Please use the explicit _EQ version\\")
                  description_CONTAINS: String
                  description_ENDS_WITH: String
                  description_EQ: String
                  description_IN: [String]
                  description_STARTS_WITH: String
                  title: String @deprecated(reason: \\"Please use the explicit _EQ version\\")
                  title_CONTAINS: String
                  title_ENDS_WITH: String
                  title_EQ: String
                  title_IN: [String!]
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
                }

                type UpdateSeriesMutationResponse {
                  info: UpdateInfo!
                  series: [Series!]!
                }"
            `);
        });

        test("Prevent relationship field update", async () => {
            const typeDefs = gql`
                interface Production {
                    title: String!
                    description: String
                }

                type Movie implements Production @query(aggregate: true) @node {
                    title: String!
                    description: String
                }

                type Series implements Production @query(aggregate: true) @node {
                    title: String!
                    description: String
                }

                type Actor @query(aggregate: true) @node {
                    name: String!
                    actedIn: [Production!]!
                        @relationship(type: "ACTED_IN", direction: OUT)
                        @settable(onCreate: true, onUpdate: false)
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
                  actedIn(directed: Boolean = true, limit: Int, offset: Int, options: ProductionOptions @deprecated(reason: \\"Query options argument is deprecated, please use pagination arguments like limit, offset and sort instead.\\"), sort: [ProductionSort!], where: ProductionWhere): [Production!]!
                  actedInAggregate(directed: Boolean = true, where: ProductionWhere): ActorProductionActedInAggregationSelection
                  actedInConnection(after: String, directed: Boolean = true, first: Int, sort: [ActorActedInConnectionSort!], where: ActorActedInConnectionWhere): ActorActedInConnection!
                  name: String!
                }

                input ActorActedInAggregateInput {
                  AND: [ActorActedInAggregateInput!]
                  NOT: ActorActedInAggregateInput
                  OR: [ActorActedInAggregateInput!]
                  count: Int @deprecated(reason: \\"Please use the explicit _EQ version\\")
                  count_EQ: Int
                  count_GT: Int
                  count_GTE: Int
                  count_LT: Int
                  count_LTE: Int
                  node: ActorActedInNodeAggregationWhereInput
                }

                input ActorActedInConnectFieldInput {
                  where: ProductionConnectWhere
                }

                type ActorActedInConnection {
                  edges: [ActorActedInRelationship!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
                }

                input ActorActedInConnectionSort {
                  node: ProductionSort
                }

                input ActorActedInConnectionWhere {
                  AND: [ActorActedInConnectionWhere!]
                  NOT: ActorActedInConnectionWhere
                  OR: [ActorActedInConnectionWhere!]
                  node: ProductionWhere
                }

                input ActorActedInCreateFieldInput {
                  node: ProductionCreateInput!
                }

                input ActorActedInDeleteFieldInput {
                  where: ActorActedInConnectionWhere
                }

                input ActorActedInDisconnectFieldInput {
                  where: ActorActedInConnectionWhere
                }

                input ActorActedInFieldInput {
                  connect: [ActorActedInConnectFieldInput!]
                  create: [ActorActedInCreateFieldInput!]
                }

                input ActorActedInNodeAggregationWhereInput {
                  AND: [ActorActedInNodeAggregationWhereInput!]
                  NOT: ActorActedInNodeAggregationWhereInput
                  OR: [ActorActedInNodeAggregationWhereInput!]
                  description_AVERAGE_EQUAL: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                  description_AVERAGE_GT: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                  description_AVERAGE_GTE: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                  description_AVERAGE_LENGTH_EQUAL: Float
                  description_AVERAGE_LENGTH_GT: Float
                  description_AVERAGE_LENGTH_GTE: Float
                  description_AVERAGE_LENGTH_LT: Float
                  description_AVERAGE_LENGTH_LTE: Float
                  description_AVERAGE_LT: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                  description_AVERAGE_LTE: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                  description_EQUAL: String @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
                  description_GT: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
                  description_GTE: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
                  description_LONGEST_EQUAL: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                  description_LONGEST_GT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                  description_LONGEST_GTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                  description_LONGEST_LENGTH_EQUAL: Int
                  description_LONGEST_LENGTH_GT: Int
                  description_LONGEST_LENGTH_GTE: Int
                  description_LONGEST_LENGTH_LT: Int
                  description_LONGEST_LENGTH_LTE: Int
                  description_LONGEST_LT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                  description_LONGEST_LTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                  description_LT: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
                  description_LTE: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
                  description_SHORTEST_EQUAL: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                  description_SHORTEST_GT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                  description_SHORTEST_GTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                  description_SHORTEST_LENGTH_EQUAL: Int
                  description_SHORTEST_LENGTH_GT: Int
                  description_SHORTEST_LENGTH_GTE: Int
                  description_SHORTEST_LENGTH_LT: Int
                  description_SHORTEST_LENGTH_LTE: Int
                  description_SHORTEST_LT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                  description_SHORTEST_LTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
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

                type ActorActedInRelationship {
                  cursor: String!
                  node: Production!
                }

                type ActorAggregateSelection {
                  count: Int!
                  name: StringAggregateSelection!
                }

                input ActorConnectInput {
                  actedIn: [ActorActedInConnectFieldInput!]
                }

                input ActorCreateInput {
                  actedIn: ActorActedInFieldInput
                  name: String!
                }

                input ActorDeleteInput {
                  actedIn: [ActorActedInDeleteFieldInput!]
                }

                input ActorDisconnectInput {
                  actedIn: [ActorActedInDisconnectFieldInput!]
                }

                type ActorEdge {
                  cursor: String!
                  node: Actor!
                }

                input ActorOptions {
                  limit: Int
                  offset: Int
                  \\"\\"\\"
                  Specify one or more ActorSort objects to sort Actors by. The sorts will be applied in the order in which they are arranged in the array.
                  \\"\\"\\"
                  sort: [ActorSort!]
                }

                type ActorProductionActedInAggregationSelection {
                  count: Int!
                  node: ActorProductionActedInNodeAggregateSelection
                }

                type ActorProductionActedInNodeAggregateSelection {
                  description: StringAggregateSelection!
                  title: StringAggregateSelection!
                }

                input ActorRelationInput {
                  actedIn: [ActorActedInCreateFieldInput!]
                }

                \\"\\"\\"
                Fields to sort Actors by. The order in which sorts are applied is not guaranteed when specifying many fields in one ActorSort object.
                \\"\\"\\"
                input ActorSort {
                  name: SortDirection
                }

                input ActorUpdateInput {
                  name: String
                }

                input ActorWhere {
                  AND: [ActorWhere!]
                  NOT: ActorWhere
                  OR: [ActorWhere!]
                  actedIn: ProductionWhere @deprecated(reason: \\"Use \`actedIn_SOME\` instead.\\")
                  actedInAggregate: ActorActedInAggregateInput
                  actedInConnection: ActorActedInConnectionWhere @deprecated(reason: \\"Use \`actedInConnection_SOME\` instead.\\")
                  \\"\\"\\"
                  Return Actors where all of the related ActorActedInConnections match this filter
                  \\"\\"\\"
                  actedInConnection_ALL: ActorActedInConnectionWhere
                  \\"\\"\\"
                  Return Actors where none of the related ActorActedInConnections match this filter
                  \\"\\"\\"
                  actedInConnection_NONE: ActorActedInConnectionWhere
                  \\"\\"\\"
                  Return Actors where one of the related ActorActedInConnections match this filter
                  \\"\\"\\"
                  actedInConnection_SINGLE: ActorActedInConnectionWhere
                  \\"\\"\\"
                  Return Actors where some of the related ActorActedInConnections match this filter
                  \\"\\"\\"
                  actedInConnection_SOME: ActorActedInConnectionWhere
                  \\"\\"\\"Return Actors where all of the related Productions match this filter\\"\\"\\"
                  actedIn_ALL: ProductionWhere
                  \\"\\"\\"Return Actors where none of the related Productions match this filter\\"\\"\\"
                  actedIn_NONE: ProductionWhere
                  \\"\\"\\"Return Actors where one of the related Productions match this filter\\"\\"\\"
                  actedIn_SINGLE: ProductionWhere
                  \\"\\"\\"Return Actors where some of the related Productions match this filter\\"\\"\\"
                  actedIn_SOME: ProductionWhere
                  name: String @deprecated(reason: \\"Please use the explicit _EQ version\\")
                  name_CONTAINS: String
                  name_ENDS_WITH: String
                  name_EQ: String
                  name_IN: [String!]
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
                  nodesCreated: Int!
                  relationshipsCreated: Int!
                }

                type CreateMoviesMutationResponse {
                  info: CreateInfo!
                  movies: [Movie!]!
                }

                type CreateSeriesMutationResponse {
                  info: CreateInfo!
                  series: [Series!]!
                }

                \\"\\"\\"
                Information about the number of nodes and relationships deleted during a delete mutation
                \\"\\"\\"
                type DeleteInfo {
                  nodesDeleted: Int!
                  relationshipsDeleted: Int!
                }

                type Movie implements Production {
                  description: String
                  title: String!
                }

                type MovieAggregateSelection {
                  count: Int!
                  description: StringAggregateSelection!
                  title: StringAggregateSelection!
                }

                input MovieCreateInput {
                  description: String
                  title: String!
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
                  description: SortDirection
                  title: SortDirection
                }

                input MovieUpdateInput {
                  description: String
                  title: String
                }

                input MovieWhere {
                  AND: [MovieWhere!]
                  NOT: MovieWhere
                  OR: [MovieWhere!]
                  description: String @deprecated(reason: \\"Please use the explicit _EQ version\\")
                  description_CONTAINS: String
                  description_ENDS_WITH: String
                  description_EQ: String
                  description_IN: [String]
                  description_STARTS_WITH: String
                  title: String @deprecated(reason: \\"Please use the explicit _EQ version\\")
                  title_CONTAINS: String
                  title_ENDS_WITH: String
                  title_EQ: String
                  title_IN: [String!]
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
                  createSeries(input: [SeriesCreateInput!]!): CreateSeriesMutationResponse!
                  deleteActors(delete: ActorDeleteInput, where: ActorWhere): DeleteInfo!
                  deleteMovies(where: MovieWhere): DeleteInfo!
                  deleteSeries(where: SeriesWhere): DeleteInfo!
                  updateActors(connect: ActorConnectInput @deprecated(reason: \\"Top level connect input argument in update is deprecated. Use the nested connect field in the relationship within the update argument\\"), create: ActorRelationInput @deprecated(reason: \\"Top level create input argument in update is deprecated. Use the nested create field in the relationship within the update argument\\"), delete: ActorDeleteInput @deprecated(reason: \\"Top level delete input argument in update is deprecated. Use the nested delete field in the relationship within the update argument\\"), disconnect: ActorDisconnectInput @deprecated(reason: \\"Top level disconnect input argument in update is deprecated. Use the nested disconnect field in the relationship within the update argument\\"), update: ActorUpdateInput, where: ActorWhere): UpdateActorsMutationResponse!
                  updateMovies(update: MovieUpdateInput, where: MovieWhere): UpdateMoviesMutationResponse!
                  updateSeries(update: SeriesUpdateInput, where: SeriesWhere): UpdateSeriesMutationResponse!
                }

                \\"\\"\\"Pagination information (Relay)\\"\\"\\"
                type PageInfo {
                  endCursor: String
                  hasNextPage: Boolean!
                  hasPreviousPage: Boolean!
                  startCursor: String
                }

                interface Production {
                  description: String
                  title: String!
                }

                type ProductionAggregateSelection {
                  count: Int!
                  description: StringAggregateSelection!
                  title: StringAggregateSelection!
                }

                input ProductionConnectWhere {
                  node: ProductionWhere!
                }

                input ProductionCreateInput {
                  Movie: MovieCreateInput
                  Series: SeriesCreateInput
                }

                type ProductionEdge {
                  cursor: String!
                  node: Production!
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
                  sort: [ProductionSort!]
                }

                \\"\\"\\"
                Fields to sort Productions by. The order in which sorts are applied is not guaranteed when specifying many fields in one ProductionSort object.
                \\"\\"\\"
                input ProductionSort {
                  description: SortDirection
                  title: SortDirection
                }

                input ProductionWhere {
                  AND: [ProductionWhere!]
                  NOT: ProductionWhere
                  OR: [ProductionWhere!]
                  description: String @deprecated(reason: \\"Please use the explicit _EQ version\\")
                  description_CONTAINS: String
                  description_ENDS_WITH: String
                  description_EQ: String
                  description_IN: [String]
                  description_STARTS_WITH: String
                  title: String @deprecated(reason: \\"Please use the explicit _EQ version\\")
                  title_CONTAINS: String
                  title_ENDS_WITH: String
                  title_EQ: String
                  title_IN: [String!]
                  title_STARTS_WITH: String
                  typename_IN: [ProductionImplementation!]
                }

                type ProductionsConnection {
                  edges: [ProductionEdge!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
                }

                type Query {
                  actors(limit: Int, offset: Int, options: ActorOptions @deprecated(reason: \\"Query options argument is deprecated, please use pagination arguments like limit, offset and sort instead.\\"), sort: [ActorSort!], where: ActorWhere): [Actor!]!
                  actorsAggregate(where: ActorWhere): ActorAggregateSelection!
                  actorsConnection(after: String, first: Int, sort: [ActorSort!], where: ActorWhere): ActorsConnection!
                  movies(limit: Int, offset: Int, options: MovieOptions @deprecated(reason: \\"Query options argument is deprecated, please use pagination arguments like limit, offset and sort instead.\\"), sort: [MovieSort!], where: MovieWhere): [Movie!]!
                  moviesAggregate(where: MovieWhere): MovieAggregateSelection!
                  moviesConnection(after: String, first: Int, sort: [MovieSort!], where: MovieWhere): MoviesConnection!
                  productions(limit: Int, offset: Int, options: ProductionOptions @deprecated(reason: \\"Query options argument is deprecated, please use pagination arguments like limit, offset and sort instead.\\"), sort: [ProductionSort!], where: ProductionWhere): [Production!]!
                  productionsAggregate(where: ProductionWhere): ProductionAggregateSelection!
                  productionsConnection(after: String, first: Int, sort: [ProductionSort!], where: ProductionWhere): ProductionsConnection!
                  series(limit: Int, offset: Int, options: SeriesOptions @deprecated(reason: \\"Query options argument is deprecated, please use pagination arguments like limit, offset and sort instead.\\"), sort: [SeriesSort!], where: SeriesWhere): [Series!]!
                  seriesAggregate(where: SeriesWhere): SeriesAggregateSelection!
                  seriesConnection(after: String, first: Int, sort: [SeriesSort!], where: SeriesWhere): SeriesConnection!
                }

                type Series implements Production {
                  description: String
                  title: String!
                }

                type SeriesAggregateSelection {
                  count: Int!
                  description: StringAggregateSelection!
                  title: StringAggregateSelection!
                }

                type SeriesConnection {
                  edges: [SeriesEdge!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
                }

                input SeriesCreateInput {
                  description: String
                  title: String!
                }

                type SeriesEdge {
                  cursor: String!
                  node: Series!
                }

                input SeriesOptions {
                  limit: Int
                  offset: Int
                  \\"\\"\\"
                  Specify one or more SeriesSort objects to sort Series by. The sorts will be applied in the order in which they are arranged in the array.
                  \\"\\"\\"
                  sort: [SeriesSort!]
                }

                \\"\\"\\"
                Fields to sort Series by. The order in which sorts are applied is not guaranteed when specifying many fields in one SeriesSort object.
                \\"\\"\\"
                input SeriesSort {
                  description: SortDirection
                  title: SortDirection
                }

                input SeriesUpdateInput {
                  description: String
                  title: String
                }

                input SeriesWhere {
                  AND: [SeriesWhere!]
                  NOT: SeriesWhere
                  OR: [SeriesWhere!]
                  description: String @deprecated(reason: \\"Please use the explicit _EQ version\\")
                  description_CONTAINS: String
                  description_ENDS_WITH: String
                  description_EQ: String
                  description_IN: [String]
                  description_STARTS_WITH: String
                  title: String @deprecated(reason: \\"Please use the explicit _EQ version\\")
                  title_CONTAINS: String
                  title_ENDS_WITH: String
                  title_EQ: String
                  title_IN: [String!]
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
                }

                type UpdateSeriesMutationResponse {
                  info: UpdateInfo!
                  series: [Series!]!
                }"
            `);
        });

        test("Prevent update on nested relationships", async () => {
            const typeDefs = gql`
                interface Production {
                    title: String!
                    description: String
                    actors: [Actor!]! @declareRelationship
                }

                type Movie implements Production @query(aggregate: true) @node {
                    title: String!
                    description: String
                    actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN)
                }

                type Series implements Production @query(aggregate: true) @node {
                    title: String!
                    description: String
                    actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN)
                }

                type Actor @query(aggregate: true) @node {
                    name: String!
                    actedIn: [Production!]! @relationship(type: "ACTED_IN", direction: OUT) @settable(onUpdate: false)
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
                  actedIn(directed: Boolean = true, limit: Int, offset: Int, options: ProductionOptions @deprecated(reason: \\"Query options argument is deprecated, please use pagination arguments like limit, offset and sort instead.\\"), sort: [ProductionSort!], where: ProductionWhere): [Production!]!
                  actedInAggregate(directed: Boolean = true, where: ProductionWhere): ActorProductionActedInAggregationSelection
                  actedInConnection(after: String, directed: Boolean = true, first: Int, sort: [ActorActedInConnectionSort!], where: ActorActedInConnectionWhere): ActorActedInConnection!
                  name: String!
                }

                input ActorActedInAggregateInput {
                  AND: [ActorActedInAggregateInput!]
                  NOT: ActorActedInAggregateInput
                  OR: [ActorActedInAggregateInput!]
                  count: Int @deprecated(reason: \\"Please use the explicit _EQ version\\")
                  count_EQ: Int
                  count_GT: Int
                  count_GTE: Int
                  count_LT: Int
                  count_LTE: Int
                  node: ActorActedInNodeAggregationWhereInput
                }

                input ActorActedInConnectFieldInput {
                  connect: ProductionConnectInput
                  where: ProductionConnectWhere
                }

                type ActorActedInConnection {
                  edges: [ActorActedInRelationship!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
                }

                input ActorActedInConnectionSort {
                  node: ProductionSort
                }

                input ActorActedInConnectionWhere {
                  AND: [ActorActedInConnectionWhere!]
                  NOT: ActorActedInConnectionWhere
                  OR: [ActorActedInConnectionWhere!]
                  node: ProductionWhere
                }

                input ActorActedInCreateFieldInput {
                  node: ProductionCreateInput!
                }

                input ActorActedInDeleteFieldInput {
                  delete: ProductionDeleteInput
                  where: ActorActedInConnectionWhere
                }

                input ActorActedInDisconnectFieldInput {
                  disconnect: ProductionDisconnectInput
                  where: ActorActedInConnectionWhere
                }

                input ActorActedInFieldInput {
                  connect: [ActorActedInConnectFieldInput!]
                  create: [ActorActedInCreateFieldInput!]
                }

                input ActorActedInNodeAggregationWhereInput {
                  AND: [ActorActedInNodeAggregationWhereInput!]
                  NOT: ActorActedInNodeAggregationWhereInput
                  OR: [ActorActedInNodeAggregationWhereInput!]
                  description_AVERAGE_EQUAL: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                  description_AVERAGE_GT: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                  description_AVERAGE_GTE: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                  description_AVERAGE_LENGTH_EQUAL: Float
                  description_AVERAGE_LENGTH_GT: Float
                  description_AVERAGE_LENGTH_GTE: Float
                  description_AVERAGE_LENGTH_LT: Float
                  description_AVERAGE_LENGTH_LTE: Float
                  description_AVERAGE_LT: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                  description_AVERAGE_LTE: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                  description_EQUAL: String @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
                  description_GT: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
                  description_GTE: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
                  description_LONGEST_EQUAL: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                  description_LONGEST_GT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                  description_LONGEST_GTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                  description_LONGEST_LENGTH_EQUAL: Int
                  description_LONGEST_LENGTH_GT: Int
                  description_LONGEST_LENGTH_GTE: Int
                  description_LONGEST_LENGTH_LT: Int
                  description_LONGEST_LENGTH_LTE: Int
                  description_LONGEST_LT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                  description_LONGEST_LTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                  description_LT: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
                  description_LTE: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
                  description_SHORTEST_EQUAL: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                  description_SHORTEST_GT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                  description_SHORTEST_GTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                  description_SHORTEST_LENGTH_EQUAL: Int
                  description_SHORTEST_LENGTH_GT: Int
                  description_SHORTEST_LENGTH_GTE: Int
                  description_SHORTEST_LENGTH_LT: Int
                  description_SHORTEST_LENGTH_LTE: Int
                  description_SHORTEST_LT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                  description_SHORTEST_LTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
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

                type ActorActedInRelationship {
                  cursor: String!
                  node: Production!
                }

                type ActorAggregateSelection {
                  count: Int!
                  name: StringAggregateSelection!
                }

                input ActorConnectInput {
                  actedIn: [ActorActedInConnectFieldInput!]
                }

                input ActorConnectWhere {
                  node: ActorWhere!
                }

                input ActorCreateInput {
                  actedIn: ActorActedInFieldInput
                  name: String!
                }

                input ActorDeleteInput {
                  actedIn: [ActorActedInDeleteFieldInput!]
                }

                input ActorDisconnectInput {
                  actedIn: [ActorActedInDisconnectFieldInput!]
                }

                type ActorEdge {
                  cursor: String!
                  node: Actor!
                }

                input ActorOptions {
                  limit: Int
                  offset: Int
                  \\"\\"\\"
                  Specify one or more ActorSort objects to sort Actors by. The sorts will be applied in the order in which they are arranged in the array.
                  \\"\\"\\"
                  sort: [ActorSort!]
                }

                type ActorProductionActedInAggregationSelection {
                  count: Int!
                  node: ActorProductionActedInNodeAggregateSelection
                }

                type ActorProductionActedInNodeAggregateSelection {
                  description: StringAggregateSelection!
                  title: StringAggregateSelection!
                }

                input ActorRelationInput {
                  actedIn: [ActorActedInCreateFieldInput!]
                }

                \\"\\"\\"
                Fields to sort Actors by. The order in which sorts are applied is not guaranteed when specifying many fields in one ActorSort object.
                \\"\\"\\"
                input ActorSort {
                  name: SortDirection
                }

                input ActorUpdateInput {
                  name: String
                }

                input ActorWhere {
                  AND: [ActorWhere!]
                  NOT: ActorWhere
                  OR: [ActorWhere!]
                  actedIn: ProductionWhere @deprecated(reason: \\"Use \`actedIn_SOME\` instead.\\")
                  actedInAggregate: ActorActedInAggregateInput
                  actedInConnection: ActorActedInConnectionWhere @deprecated(reason: \\"Use \`actedInConnection_SOME\` instead.\\")
                  \\"\\"\\"
                  Return Actors where all of the related ActorActedInConnections match this filter
                  \\"\\"\\"
                  actedInConnection_ALL: ActorActedInConnectionWhere
                  \\"\\"\\"
                  Return Actors where none of the related ActorActedInConnections match this filter
                  \\"\\"\\"
                  actedInConnection_NONE: ActorActedInConnectionWhere
                  \\"\\"\\"
                  Return Actors where one of the related ActorActedInConnections match this filter
                  \\"\\"\\"
                  actedInConnection_SINGLE: ActorActedInConnectionWhere
                  \\"\\"\\"
                  Return Actors where some of the related ActorActedInConnections match this filter
                  \\"\\"\\"
                  actedInConnection_SOME: ActorActedInConnectionWhere
                  \\"\\"\\"Return Actors where all of the related Productions match this filter\\"\\"\\"
                  actedIn_ALL: ProductionWhere
                  \\"\\"\\"Return Actors where none of the related Productions match this filter\\"\\"\\"
                  actedIn_NONE: ProductionWhere
                  \\"\\"\\"Return Actors where one of the related Productions match this filter\\"\\"\\"
                  actedIn_SINGLE: ProductionWhere
                  \\"\\"\\"Return Actors where some of the related Productions match this filter\\"\\"\\"
                  actedIn_SOME: ProductionWhere
                  name: String @deprecated(reason: \\"Please use the explicit _EQ version\\")
                  name_CONTAINS: String
                  name_ENDS_WITH: String
                  name_EQ: String
                  name_IN: [String!]
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
                  nodesCreated: Int!
                  relationshipsCreated: Int!
                }

                type CreateMoviesMutationResponse {
                  info: CreateInfo!
                  movies: [Movie!]!
                }

                type CreateSeriesMutationResponse {
                  info: CreateInfo!
                  series: [Series!]!
                }

                \\"\\"\\"
                Information about the number of nodes and relationships deleted during a delete mutation
                \\"\\"\\"
                type DeleteInfo {
                  nodesDeleted: Int!
                  relationshipsDeleted: Int!
                }

                type Movie implements Production {
                  actors(directed: Boolean = true, limit: Int, offset: Int, options: ActorOptions @deprecated(reason: \\"Query options argument is deprecated, please use pagination arguments like limit, offset and sort instead.\\"), sort: [ActorSort!], where: ActorWhere): [Actor!]!
                  actorsAggregate(directed: Boolean = true, where: ActorWhere): MovieActorActorsAggregationSelection
                  actorsConnection(after: String, directed: Boolean = true, first: Int, sort: [ProductionActorsConnectionSort!], where: ProductionActorsConnectionWhere): ProductionActorsConnection!
                  description: String
                  title: String!
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
                  overwrite: Boolean! = true
                  where: ActorConnectWhere
                }

                input MovieActorsCreateFieldInput {
                  node: ActorCreateInput!
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

                input MovieActorsUpdateConnectionInput {
                  node: ActorUpdateInput
                }

                input MovieActorsUpdateFieldInput {
                  connect: [MovieActorsConnectFieldInput!]
                  create: [MovieActorsCreateFieldInput!]
                  delete: [ProductionActorsDeleteFieldInput!]
                  disconnect: [ProductionActorsDisconnectFieldInput!]
                  update: MovieActorsUpdateConnectionInput
                  where: ProductionActorsConnectionWhere
                }

                type MovieAggregateSelection {
                  count: Int!
                  description: StringAggregateSelection!
                  title: StringAggregateSelection!
                }

                input MovieConnectInput {
                  actors: [MovieActorsConnectFieldInput!]
                }

                input MovieCreateInput {
                  actors: MovieActorsFieldInput
                  description: String
                  title: String!
                }

                input MovieDeleteInput {
                  actors: [ProductionActorsDeleteFieldInput!]
                }

                input MovieDisconnectInput {
                  actors: [ProductionActorsDisconnectFieldInput!]
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
                  description: SortDirection
                  title: SortDirection
                }

                input MovieUpdateInput {
                  actors: [MovieActorsUpdateFieldInput!]
                  description: String
                  title: String
                }

                input MovieWhere {
                  AND: [MovieWhere!]
                  NOT: MovieWhere
                  OR: [MovieWhere!]
                  actors: ActorWhere @deprecated(reason: \\"Use \`actors_SOME\` instead.\\")
                  actorsAggregate: MovieActorsAggregateInput
                  actorsConnection: ProductionActorsConnectionWhere @deprecated(reason: \\"Use \`actorsConnection_SOME\` instead.\\")
                  \\"\\"\\"
                  Return Movies where all of the related ProductionActorsConnections match this filter
                  \\"\\"\\"
                  actorsConnection_ALL: ProductionActorsConnectionWhere
                  \\"\\"\\"
                  Return Movies where none of the related ProductionActorsConnections match this filter
                  \\"\\"\\"
                  actorsConnection_NONE: ProductionActorsConnectionWhere
                  \\"\\"\\"
                  Return Movies where one of the related ProductionActorsConnections match this filter
                  \\"\\"\\"
                  actorsConnection_SINGLE: ProductionActorsConnectionWhere
                  \\"\\"\\"
                  Return Movies where some of the related ProductionActorsConnections match this filter
                  \\"\\"\\"
                  actorsConnection_SOME: ProductionActorsConnectionWhere
                  \\"\\"\\"Return Movies where all of the related Actors match this filter\\"\\"\\"
                  actors_ALL: ActorWhere
                  \\"\\"\\"Return Movies where none of the related Actors match this filter\\"\\"\\"
                  actors_NONE: ActorWhere
                  \\"\\"\\"Return Movies where one of the related Actors match this filter\\"\\"\\"
                  actors_SINGLE: ActorWhere
                  \\"\\"\\"Return Movies where some of the related Actors match this filter\\"\\"\\"
                  actors_SOME: ActorWhere
                  description: String @deprecated(reason: \\"Please use the explicit _EQ version\\")
                  description_CONTAINS: String
                  description_ENDS_WITH: String
                  description_EQ: String
                  description_IN: [String]
                  description_STARTS_WITH: String
                  title: String @deprecated(reason: \\"Please use the explicit _EQ version\\")
                  title_CONTAINS: String
                  title_ENDS_WITH: String
                  title_EQ: String
                  title_IN: [String!]
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
                  createSeries(input: [SeriesCreateInput!]!): CreateSeriesMutationResponse!
                  deleteActors(delete: ActorDeleteInput, where: ActorWhere): DeleteInfo!
                  deleteMovies(delete: MovieDeleteInput, where: MovieWhere): DeleteInfo!
                  deleteSeries(delete: SeriesDeleteInput, where: SeriesWhere): DeleteInfo!
                  updateActors(connect: ActorConnectInput @deprecated(reason: \\"Top level connect input argument in update is deprecated. Use the nested connect field in the relationship within the update argument\\"), create: ActorRelationInput @deprecated(reason: \\"Top level create input argument in update is deprecated. Use the nested create field in the relationship within the update argument\\"), delete: ActorDeleteInput @deprecated(reason: \\"Top level delete input argument in update is deprecated. Use the nested delete field in the relationship within the update argument\\"), disconnect: ActorDisconnectInput @deprecated(reason: \\"Top level disconnect input argument in update is deprecated. Use the nested disconnect field in the relationship within the update argument\\"), update: ActorUpdateInput, where: ActorWhere): UpdateActorsMutationResponse!
                  updateMovies(connect: MovieConnectInput @deprecated(reason: \\"Top level connect input argument in update is deprecated. Use the nested connect field in the relationship within the update argument\\"), create: MovieRelationInput @deprecated(reason: \\"Top level create input argument in update is deprecated. Use the nested create field in the relationship within the update argument\\"), delete: MovieDeleteInput @deprecated(reason: \\"Top level delete input argument in update is deprecated. Use the nested delete field in the relationship within the update argument\\"), disconnect: MovieDisconnectInput @deprecated(reason: \\"Top level disconnect input argument in update is deprecated. Use the nested disconnect field in the relationship within the update argument\\"), update: MovieUpdateInput, where: MovieWhere): UpdateMoviesMutationResponse!
                  updateSeries(connect: SeriesConnectInput @deprecated(reason: \\"Top level connect input argument in update is deprecated. Use the nested connect field in the relationship within the update argument\\"), create: SeriesRelationInput @deprecated(reason: \\"Top level create input argument in update is deprecated. Use the nested create field in the relationship within the update argument\\"), delete: SeriesDeleteInput @deprecated(reason: \\"Top level delete input argument in update is deprecated. Use the nested delete field in the relationship within the update argument\\"), disconnect: SeriesDisconnectInput @deprecated(reason: \\"Top level disconnect input argument in update is deprecated. Use the nested disconnect field in the relationship within the update argument\\"), update: SeriesUpdateInput, where: SeriesWhere): UpdateSeriesMutationResponse!
                }

                \\"\\"\\"Pagination information (Relay)\\"\\"\\"
                type PageInfo {
                  endCursor: String
                  hasNextPage: Boolean!
                  hasPreviousPage: Boolean!
                  startCursor: String
                }

                interface Production {
                  actors(limit: Int, offset: Int, options: ActorOptions @deprecated(reason: \\"Query options argument is deprecated, please use pagination arguments like limit, offset and sort instead.\\"), sort: [ActorSort!], where: ActorWhere): [Actor!]!
                  actorsConnection(after: String, first: Int, sort: [ProductionActorsConnectionSort!], where: ProductionActorsConnectionWhere): ProductionActorsConnection!
                  description: String
                  title: String!
                }

                input ProductionActorsAggregateInput {
                  AND: [ProductionActorsAggregateInput!]
                  NOT: ProductionActorsAggregateInput
                  OR: [ProductionActorsAggregateInput!]
                  count: Int @deprecated(reason: \\"Please use the explicit _EQ version\\")
                  count_EQ: Int
                  count_GT: Int
                  count_GTE: Int
                  count_LT: Int
                  count_LTE: Int
                  node: ProductionActorsNodeAggregationWhereInput
                }

                input ProductionActorsConnectFieldInput {
                  connect: [ActorConnectInput!]
                  \\"\\"\\"
                  Whether or not to overwrite any matching relationship with the new properties.
                  \\"\\"\\"
                  overwrite: Boolean! = true
                  where: ActorConnectWhere
                }

                type ProductionActorsConnection {
                  edges: [ProductionActorsRelationship!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
                }

                input ProductionActorsConnectionSort {
                  node: ActorSort
                }

                input ProductionActorsConnectionWhere {
                  AND: [ProductionActorsConnectionWhere!]
                  NOT: ProductionActorsConnectionWhere
                  OR: [ProductionActorsConnectionWhere!]
                  node: ActorWhere
                }

                input ProductionActorsDeleteFieldInput {
                  delete: ActorDeleteInput
                  where: ProductionActorsConnectionWhere
                }

                input ProductionActorsDisconnectFieldInput {
                  disconnect: ActorDisconnectInput
                  where: ProductionActorsConnectionWhere
                }

                input ProductionActorsNodeAggregationWhereInput {
                  AND: [ProductionActorsNodeAggregationWhereInput!]
                  NOT: ProductionActorsNodeAggregationWhereInput
                  OR: [ProductionActorsNodeAggregationWhereInput!]
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

                type ProductionActorsRelationship {
                  cursor: String!
                  node: Actor!
                }

                type ProductionAggregateSelection {
                  count: Int!
                  description: StringAggregateSelection!
                  title: StringAggregateSelection!
                }

                input ProductionConnectInput {
                  actors: [ProductionActorsConnectFieldInput!]
                }

                input ProductionConnectWhere {
                  node: ProductionWhere!
                }

                input ProductionCreateInput {
                  Movie: MovieCreateInput
                  Series: SeriesCreateInput
                }

                input ProductionDeleteInput {
                  actors: [ProductionActorsDeleteFieldInput!]
                }

                input ProductionDisconnectInput {
                  actors: [ProductionActorsDisconnectFieldInput!]
                }

                type ProductionEdge {
                  cursor: String!
                  node: Production!
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
                  sort: [ProductionSort!]
                }

                \\"\\"\\"
                Fields to sort Productions by. The order in which sorts are applied is not guaranteed when specifying many fields in one ProductionSort object.
                \\"\\"\\"
                input ProductionSort {
                  description: SortDirection
                  title: SortDirection
                }

                input ProductionWhere {
                  AND: [ProductionWhere!]
                  NOT: ProductionWhere
                  OR: [ProductionWhere!]
                  actors: ActorWhere @deprecated(reason: \\"Use \`actors_SOME\` instead.\\")
                  actorsAggregate: ProductionActorsAggregateInput
                  actorsConnection: ProductionActorsConnectionWhere @deprecated(reason: \\"Use \`actorsConnection_SOME\` instead.\\")
                  \\"\\"\\"
                  Return Productions where all of the related ProductionActorsConnections match this filter
                  \\"\\"\\"
                  actorsConnection_ALL: ProductionActorsConnectionWhere
                  \\"\\"\\"
                  Return Productions where none of the related ProductionActorsConnections match this filter
                  \\"\\"\\"
                  actorsConnection_NONE: ProductionActorsConnectionWhere
                  \\"\\"\\"
                  Return Productions where one of the related ProductionActorsConnections match this filter
                  \\"\\"\\"
                  actorsConnection_SINGLE: ProductionActorsConnectionWhere
                  \\"\\"\\"
                  Return Productions where some of the related ProductionActorsConnections match this filter
                  \\"\\"\\"
                  actorsConnection_SOME: ProductionActorsConnectionWhere
                  \\"\\"\\"Return Productions where all of the related Actors match this filter\\"\\"\\"
                  actors_ALL: ActorWhere
                  \\"\\"\\"Return Productions where none of the related Actors match this filter\\"\\"\\"
                  actors_NONE: ActorWhere
                  \\"\\"\\"Return Productions where one of the related Actors match this filter\\"\\"\\"
                  actors_SINGLE: ActorWhere
                  \\"\\"\\"Return Productions where some of the related Actors match this filter\\"\\"\\"
                  actors_SOME: ActorWhere
                  description: String @deprecated(reason: \\"Please use the explicit _EQ version\\")
                  description_CONTAINS: String
                  description_ENDS_WITH: String
                  description_EQ: String
                  description_IN: [String]
                  description_STARTS_WITH: String
                  title: String @deprecated(reason: \\"Please use the explicit _EQ version\\")
                  title_CONTAINS: String
                  title_ENDS_WITH: String
                  title_EQ: String
                  title_IN: [String!]
                  title_STARTS_WITH: String
                  typename_IN: [ProductionImplementation!]
                }

                type ProductionsConnection {
                  edges: [ProductionEdge!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
                }

                type Query {
                  actors(limit: Int, offset: Int, options: ActorOptions @deprecated(reason: \\"Query options argument is deprecated, please use pagination arguments like limit, offset and sort instead.\\"), sort: [ActorSort!], where: ActorWhere): [Actor!]!
                  actorsAggregate(where: ActorWhere): ActorAggregateSelection!
                  actorsConnection(after: String, first: Int, sort: [ActorSort!], where: ActorWhere): ActorsConnection!
                  movies(limit: Int, offset: Int, options: MovieOptions @deprecated(reason: \\"Query options argument is deprecated, please use pagination arguments like limit, offset and sort instead.\\"), sort: [MovieSort!], where: MovieWhere): [Movie!]!
                  moviesAggregate(where: MovieWhere): MovieAggregateSelection!
                  moviesConnection(after: String, first: Int, sort: [MovieSort!], where: MovieWhere): MoviesConnection!
                  productions(limit: Int, offset: Int, options: ProductionOptions @deprecated(reason: \\"Query options argument is deprecated, please use pagination arguments like limit, offset and sort instead.\\"), sort: [ProductionSort!], where: ProductionWhere): [Production!]!
                  productionsAggregate(where: ProductionWhere): ProductionAggregateSelection!
                  productionsConnection(after: String, first: Int, sort: [ProductionSort!], where: ProductionWhere): ProductionsConnection!
                  series(limit: Int, offset: Int, options: SeriesOptions @deprecated(reason: \\"Query options argument is deprecated, please use pagination arguments like limit, offset and sort instead.\\"), sort: [SeriesSort!], where: SeriesWhere): [Series!]!
                  seriesAggregate(where: SeriesWhere): SeriesAggregateSelection!
                  seriesConnection(after: String, first: Int, sort: [SeriesSort!], where: SeriesWhere): SeriesConnection!
                }

                type Series implements Production {
                  actors(directed: Boolean = true, limit: Int, offset: Int, options: ActorOptions @deprecated(reason: \\"Query options argument is deprecated, please use pagination arguments like limit, offset and sort instead.\\"), sort: [ActorSort!], where: ActorWhere): [Actor!]!
                  actorsAggregate(directed: Boolean = true, where: ActorWhere): SeriesActorActorsAggregationSelection
                  actorsConnection(after: String, directed: Boolean = true, first: Int, sort: [ProductionActorsConnectionSort!], where: ProductionActorsConnectionWhere): ProductionActorsConnection!
                  description: String
                  title: String!
                }

                type SeriesActorActorsAggregationSelection {
                  count: Int!
                  node: SeriesActorActorsNodeAggregateSelection
                }

                type SeriesActorActorsNodeAggregateSelection {
                  name: StringAggregateSelection!
                }

                input SeriesActorsAggregateInput {
                  AND: [SeriesActorsAggregateInput!]
                  NOT: SeriesActorsAggregateInput
                  OR: [SeriesActorsAggregateInput!]
                  count: Int @deprecated(reason: \\"Please use the explicit _EQ version\\")
                  count_EQ: Int
                  count_GT: Int
                  count_GTE: Int
                  count_LT: Int
                  count_LTE: Int
                  node: SeriesActorsNodeAggregationWhereInput
                }

                input SeriesActorsConnectFieldInput {
                  connect: [ActorConnectInput!]
                  \\"\\"\\"
                  Whether or not to overwrite any matching relationship with the new properties.
                  \\"\\"\\"
                  overwrite: Boolean! = true
                  where: ActorConnectWhere
                }

                input SeriesActorsCreateFieldInput {
                  node: ActorCreateInput!
                }

                input SeriesActorsFieldInput {
                  connect: [SeriesActorsConnectFieldInput!]
                  create: [SeriesActorsCreateFieldInput!]
                }

                input SeriesActorsNodeAggregationWhereInput {
                  AND: [SeriesActorsNodeAggregationWhereInput!]
                  NOT: SeriesActorsNodeAggregationWhereInput
                  OR: [SeriesActorsNodeAggregationWhereInput!]
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

                input SeriesActorsUpdateConnectionInput {
                  node: ActorUpdateInput
                }

                input SeriesActorsUpdateFieldInput {
                  connect: [SeriesActorsConnectFieldInput!]
                  create: [SeriesActorsCreateFieldInput!]
                  delete: [ProductionActorsDeleteFieldInput!]
                  disconnect: [ProductionActorsDisconnectFieldInput!]
                  update: SeriesActorsUpdateConnectionInput
                  where: ProductionActorsConnectionWhere
                }

                type SeriesAggregateSelection {
                  count: Int!
                  description: StringAggregateSelection!
                  title: StringAggregateSelection!
                }

                input SeriesConnectInput {
                  actors: [SeriesActorsConnectFieldInput!]
                }

                type SeriesConnection {
                  edges: [SeriesEdge!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
                }

                input SeriesCreateInput {
                  actors: SeriesActorsFieldInput
                  description: String
                  title: String!
                }

                input SeriesDeleteInput {
                  actors: [ProductionActorsDeleteFieldInput!]
                }

                input SeriesDisconnectInput {
                  actors: [ProductionActorsDisconnectFieldInput!]
                }

                type SeriesEdge {
                  cursor: String!
                  node: Series!
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
                  actors: [SeriesActorsCreateFieldInput!]
                }

                \\"\\"\\"
                Fields to sort Series by. The order in which sorts are applied is not guaranteed when specifying many fields in one SeriesSort object.
                \\"\\"\\"
                input SeriesSort {
                  description: SortDirection
                  title: SortDirection
                }

                input SeriesUpdateInput {
                  actors: [SeriesActorsUpdateFieldInput!]
                  description: String
                  title: String
                }

                input SeriesWhere {
                  AND: [SeriesWhere!]
                  NOT: SeriesWhere
                  OR: [SeriesWhere!]
                  actors: ActorWhere @deprecated(reason: \\"Use \`actors_SOME\` instead.\\")
                  actorsAggregate: SeriesActorsAggregateInput
                  actorsConnection: ProductionActorsConnectionWhere @deprecated(reason: \\"Use \`actorsConnection_SOME\` instead.\\")
                  \\"\\"\\"
                  Return Series where all of the related ProductionActorsConnections match this filter
                  \\"\\"\\"
                  actorsConnection_ALL: ProductionActorsConnectionWhere
                  \\"\\"\\"
                  Return Series where none of the related ProductionActorsConnections match this filter
                  \\"\\"\\"
                  actorsConnection_NONE: ProductionActorsConnectionWhere
                  \\"\\"\\"
                  Return Series where one of the related ProductionActorsConnections match this filter
                  \\"\\"\\"
                  actorsConnection_SINGLE: ProductionActorsConnectionWhere
                  \\"\\"\\"
                  Return Series where some of the related ProductionActorsConnections match this filter
                  \\"\\"\\"
                  actorsConnection_SOME: ProductionActorsConnectionWhere
                  \\"\\"\\"Return Series where all of the related Actors match this filter\\"\\"\\"
                  actors_ALL: ActorWhere
                  \\"\\"\\"Return Series where none of the related Actors match this filter\\"\\"\\"
                  actors_NONE: ActorWhere
                  \\"\\"\\"Return Series where one of the related Actors match this filter\\"\\"\\"
                  actors_SINGLE: ActorWhere
                  \\"\\"\\"Return Series where some of the related Actors match this filter\\"\\"\\"
                  actors_SOME: ActorWhere
                  description: String @deprecated(reason: \\"Please use the explicit _EQ version\\")
                  description_CONTAINS: String
                  description_ENDS_WITH: String
                  description_EQ: String
                  description_IN: [String]
                  description_STARTS_WITH: String
                  title: String @deprecated(reason: \\"Please use the explicit _EQ version\\")
                  title_CONTAINS: String
                  title_ENDS_WITH: String
                  title_EQ: String
                  title_IN: [String!]
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
                }

                type UpdateSeriesMutationResponse {
                  info: UpdateInfo!
                  series: [Series!]!
                }"
            `);
        });

        test("Prevent create on nested relationships", async () => {
            const typeDefs = gql`
                interface Production {
                    title: String!
                    description: String
                    actors: [Actor!]! @declareRelationship
                }

                type Movie implements Production @query(aggregate: true) @node {
                    title: String!
                    description: String
                    actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN)
                }

                type Series implements Production @query(aggregate: true) @node {
                    title: String!
                    description: String
                    actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN)
                }

                type Actor @query(aggregate: true) @node {
                    name: String!
                    actedIn: [Production!]! @relationship(type: "ACTED_IN", direction: OUT) @settable(onCreate: false)
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
                  actedIn(directed: Boolean = true, limit: Int, offset: Int, options: ProductionOptions @deprecated(reason: \\"Query options argument is deprecated, please use pagination arguments like limit, offset and sort instead.\\"), sort: [ProductionSort!], where: ProductionWhere): [Production!]!
                  actedInAggregate(directed: Boolean = true, where: ProductionWhere): ActorProductionActedInAggregationSelection
                  actedInConnection(after: String, directed: Boolean = true, first: Int, sort: [ActorActedInConnectionSort!], where: ActorActedInConnectionWhere): ActorActedInConnection!
                  name: String!
                }

                input ActorActedInAggregateInput {
                  AND: [ActorActedInAggregateInput!]
                  NOT: ActorActedInAggregateInput
                  OR: [ActorActedInAggregateInput!]
                  count: Int @deprecated(reason: \\"Please use the explicit _EQ version\\")
                  count_EQ: Int
                  count_GT: Int
                  count_GTE: Int
                  count_LT: Int
                  count_LTE: Int
                  node: ActorActedInNodeAggregationWhereInput
                }

                input ActorActedInConnectFieldInput {
                  connect: ProductionConnectInput
                  where: ProductionConnectWhere
                }

                type ActorActedInConnection {
                  edges: [ActorActedInRelationship!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
                }

                input ActorActedInConnectionSort {
                  node: ProductionSort
                }

                input ActorActedInConnectionWhere {
                  AND: [ActorActedInConnectionWhere!]
                  NOT: ActorActedInConnectionWhere
                  OR: [ActorActedInConnectionWhere!]
                  node: ProductionWhere
                }

                input ActorActedInCreateFieldInput {
                  node: ProductionCreateInput!
                }

                input ActorActedInDeleteFieldInput {
                  delete: ProductionDeleteInput
                  where: ActorActedInConnectionWhere
                }

                input ActorActedInDisconnectFieldInput {
                  disconnect: ProductionDisconnectInput
                  where: ActorActedInConnectionWhere
                }

                input ActorActedInNodeAggregationWhereInput {
                  AND: [ActorActedInNodeAggregationWhereInput!]
                  NOT: ActorActedInNodeAggregationWhereInput
                  OR: [ActorActedInNodeAggregationWhereInput!]
                  description_AVERAGE_EQUAL: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                  description_AVERAGE_GT: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                  description_AVERAGE_GTE: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                  description_AVERAGE_LENGTH_EQUAL: Float
                  description_AVERAGE_LENGTH_GT: Float
                  description_AVERAGE_LENGTH_GTE: Float
                  description_AVERAGE_LENGTH_LT: Float
                  description_AVERAGE_LENGTH_LTE: Float
                  description_AVERAGE_LT: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                  description_AVERAGE_LTE: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                  description_EQUAL: String @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
                  description_GT: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
                  description_GTE: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
                  description_LONGEST_EQUAL: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                  description_LONGEST_GT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                  description_LONGEST_GTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                  description_LONGEST_LENGTH_EQUAL: Int
                  description_LONGEST_LENGTH_GT: Int
                  description_LONGEST_LENGTH_GTE: Int
                  description_LONGEST_LENGTH_LT: Int
                  description_LONGEST_LENGTH_LTE: Int
                  description_LONGEST_LT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                  description_LONGEST_LTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                  description_LT: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
                  description_LTE: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
                  description_SHORTEST_EQUAL: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                  description_SHORTEST_GT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                  description_SHORTEST_GTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                  description_SHORTEST_LENGTH_EQUAL: Int
                  description_SHORTEST_LENGTH_GT: Int
                  description_SHORTEST_LENGTH_GTE: Int
                  description_SHORTEST_LENGTH_LT: Int
                  description_SHORTEST_LENGTH_LTE: Int
                  description_SHORTEST_LT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                  description_SHORTEST_LTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
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

                type ActorActedInRelationship {
                  cursor: String!
                  node: Production!
                }

                input ActorActedInUpdateConnectionInput {
                  node: ProductionUpdateInput
                }

                input ActorActedInUpdateFieldInput {
                  connect: [ActorActedInConnectFieldInput!]
                  create: [ActorActedInCreateFieldInput!]
                  delete: [ActorActedInDeleteFieldInput!]
                  disconnect: [ActorActedInDisconnectFieldInput!]
                  update: ActorActedInUpdateConnectionInput
                  where: ActorActedInConnectionWhere
                }

                type ActorAggregateSelection {
                  count: Int!
                  name: StringAggregateSelection!
                }

                input ActorConnectInput {
                  actedIn: [ActorActedInConnectFieldInput!]
                }

                input ActorConnectWhere {
                  node: ActorWhere!
                }

                input ActorCreateInput {
                  name: String!
                }

                input ActorDeleteInput {
                  actedIn: [ActorActedInDeleteFieldInput!]
                }

                input ActorDisconnectInput {
                  actedIn: [ActorActedInDisconnectFieldInput!]
                }

                type ActorEdge {
                  cursor: String!
                  node: Actor!
                }

                input ActorOptions {
                  limit: Int
                  offset: Int
                  \\"\\"\\"
                  Specify one or more ActorSort objects to sort Actors by. The sorts will be applied in the order in which they are arranged in the array.
                  \\"\\"\\"
                  sort: [ActorSort!]
                }

                type ActorProductionActedInAggregationSelection {
                  count: Int!
                  node: ActorProductionActedInNodeAggregateSelection
                }

                type ActorProductionActedInNodeAggregateSelection {
                  description: StringAggregateSelection!
                  title: StringAggregateSelection!
                }

                input ActorRelationInput {
                  actedIn: [ActorActedInCreateFieldInput!]
                }

                \\"\\"\\"
                Fields to sort Actors by. The order in which sorts are applied is not guaranteed when specifying many fields in one ActorSort object.
                \\"\\"\\"
                input ActorSort {
                  name: SortDirection
                }

                input ActorUpdateInput {
                  actedIn: [ActorActedInUpdateFieldInput!]
                  name: String
                }

                input ActorWhere {
                  AND: [ActorWhere!]
                  NOT: ActorWhere
                  OR: [ActorWhere!]
                  actedIn: ProductionWhere @deprecated(reason: \\"Use \`actedIn_SOME\` instead.\\")
                  actedInAggregate: ActorActedInAggregateInput
                  actedInConnection: ActorActedInConnectionWhere @deprecated(reason: \\"Use \`actedInConnection_SOME\` instead.\\")
                  \\"\\"\\"
                  Return Actors where all of the related ActorActedInConnections match this filter
                  \\"\\"\\"
                  actedInConnection_ALL: ActorActedInConnectionWhere
                  \\"\\"\\"
                  Return Actors where none of the related ActorActedInConnections match this filter
                  \\"\\"\\"
                  actedInConnection_NONE: ActorActedInConnectionWhere
                  \\"\\"\\"
                  Return Actors where one of the related ActorActedInConnections match this filter
                  \\"\\"\\"
                  actedInConnection_SINGLE: ActorActedInConnectionWhere
                  \\"\\"\\"
                  Return Actors where some of the related ActorActedInConnections match this filter
                  \\"\\"\\"
                  actedInConnection_SOME: ActorActedInConnectionWhere
                  \\"\\"\\"Return Actors where all of the related Productions match this filter\\"\\"\\"
                  actedIn_ALL: ProductionWhere
                  \\"\\"\\"Return Actors where none of the related Productions match this filter\\"\\"\\"
                  actedIn_NONE: ProductionWhere
                  \\"\\"\\"Return Actors where one of the related Productions match this filter\\"\\"\\"
                  actedIn_SINGLE: ProductionWhere
                  \\"\\"\\"Return Actors where some of the related Productions match this filter\\"\\"\\"
                  actedIn_SOME: ProductionWhere
                  name: String @deprecated(reason: \\"Please use the explicit _EQ version\\")
                  name_CONTAINS: String
                  name_ENDS_WITH: String
                  name_EQ: String
                  name_IN: [String!]
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
                  nodesCreated: Int!
                  relationshipsCreated: Int!
                }

                type CreateMoviesMutationResponse {
                  info: CreateInfo!
                  movies: [Movie!]!
                }

                type CreateSeriesMutationResponse {
                  info: CreateInfo!
                  series: [Series!]!
                }

                \\"\\"\\"
                Information about the number of nodes and relationships deleted during a delete mutation
                \\"\\"\\"
                type DeleteInfo {
                  nodesDeleted: Int!
                  relationshipsDeleted: Int!
                }

                type Movie implements Production {
                  actors(directed: Boolean = true, limit: Int, offset: Int, options: ActorOptions @deprecated(reason: \\"Query options argument is deprecated, please use pagination arguments like limit, offset and sort instead.\\"), sort: [ActorSort!], where: ActorWhere): [Actor!]!
                  actorsAggregate(directed: Boolean = true, where: ActorWhere): MovieActorActorsAggregationSelection
                  actorsConnection(after: String, directed: Boolean = true, first: Int, sort: [ProductionActorsConnectionSort!], where: ProductionActorsConnectionWhere): ProductionActorsConnection!
                  description: String
                  title: String!
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
                  overwrite: Boolean! = true
                  where: ActorConnectWhere
                }

                input MovieActorsCreateFieldInput {
                  node: ActorCreateInput!
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

                input MovieActorsUpdateConnectionInput {
                  node: ActorUpdateInput
                }

                input MovieActorsUpdateFieldInput {
                  connect: [MovieActorsConnectFieldInput!]
                  create: [MovieActorsCreateFieldInput!]
                  delete: [ProductionActorsDeleteFieldInput!]
                  disconnect: [ProductionActorsDisconnectFieldInput!]
                  update: MovieActorsUpdateConnectionInput
                  where: ProductionActorsConnectionWhere
                }

                type MovieAggregateSelection {
                  count: Int!
                  description: StringAggregateSelection!
                  title: StringAggregateSelection!
                }

                input MovieConnectInput {
                  actors: [MovieActorsConnectFieldInput!]
                }

                input MovieCreateInput {
                  actors: MovieActorsFieldInput
                  description: String
                  title: String!
                }

                input MovieDeleteInput {
                  actors: [ProductionActorsDeleteFieldInput!]
                }

                input MovieDisconnectInput {
                  actors: [ProductionActorsDisconnectFieldInput!]
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
                  description: SortDirection
                  title: SortDirection
                }

                input MovieUpdateInput {
                  actors: [MovieActorsUpdateFieldInput!]
                  description: String
                  title: String
                }

                input MovieWhere {
                  AND: [MovieWhere!]
                  NOT: MovieWhere
                  OR: [MovieWhere!]
                  actors: ActorWhere @deprecated(reason: \\"Use \`actors_SOME\` instead.\\")
                  actorsAggregate: MovieActorsAggregateInput
                  actorsConnection: ProductionActorsConnectionWhere @deprecated(reason: \\"Use \`actorsConnection_SOME\` instead.\\")
                  \\"\\"\\"
                  Return Movies where all of the related ProductionActorsConnections match this filter
                  \\"\\"\\"
                  actorsConnection_ALL: ProductionActorsConnectionWhere
                  \\"\\"\\"
                  Return Movies where none of the related ProductionActorsConnections match this filter
                  \\"\\"\\"
                  actorsConnection_NONE: ProductionActorsConnectionWhere
                  \\"\\"\\"
                  Return Movies where one of the related ProductionActorsConnections match this filter
                  \\"\\"\\"
                  actorsConnection_SINGLE: ProductionActorsConnectionWhere
                  \\"\\"\\"
                  Return Movies where some of the related ProductionActorsConnections match this filter
                  \\"\\"\\"
                  actorsConnection_SOME: ProductionActorsConnectionWhere
                  \\"\\"\\"Return Movies where all of the related Actors match this filter\\"\\"\\"
                  actors_ALL: ActorWhere
                  \\"\\"\\"Return Movies where none of the related Actors match this filter\\"\\"\\"
                  actors_NONE: ActorWhere
                  \\"\\"\\"Return Movies where one of the related Actors match this filter\\"\\"\\"
                  actors_SINGLE: ActorWhere
                  \\"\\"\\"Return Movies where some of the related Actors match this filter\\"\\"\\"
                  actors_SOME: ActorWhere
                  description: String @deprecated(reason: \\"Please use the explicit _EQ version\\")
                  description_CONTAINS: String
                  description_ENDS_WITH: String
                  description_EQ: String
                  description_IN: [String]
                  description_STARTS_WITH: String
                  title: String @deprecated(reason: \\"Please use the explicit _EQ version\\")
                  title_CONTAINS: String
                  title_ENDS_WITH: String
                  title_EQ: String
                  title_IN: [String!]
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
                  createSeries(input: [SeriesCreateInput!]!): CreateSeriesMutationResponse!
                  deleteActors(delete: ActorDeleteInput, where: ActorWhere): DeleteInfo!
                  deleteMovies(delete: MovieDeleteInput, where: MovieWhere): DeleteInfo!
                  deleteSeries(delete: SeriesDeleteInput, where: SeriesWhere): DeleteInfo!
                  updateActors(connect: ActorConnectInput @deprecated(reason: \\"Top level connect input argument in update is deprecated. Use the nested connect field in the relationship within the update argument\\"), create: ActorRelationInput @deprecated(reason: \\"Top level create input argument in update is deprecated. Use the nested create field in the relationship within the update argument\\"), delete: ActorDeleteInput @deprecated(reason: \\"Top level delete input argument in update is deprecated. Use the nested delete field in the relationship within the update argument\\"), disconnect: ActorDisconnectInput @deprecated(reason: \\"Top level disconnect input argument in update is deprecated. Use the nested disconnect field in the relationship within the update argument\\"), update: ActorUpdateInput, where: ActorWhere): UpdateActorsMutationResponse!
                  updateMovies(connect: MovieConnectInput @deprecated(reason: \\"Top level connect input argument in update is deprecated. Use the nested connect field in the relationship within the update argument\\"), create: MovieRelationInput @deprecated(reason: \\"Top level create input argument in update is deprecated. Use the nested create field in the relationship within the update argument\\"), delete: MovieDeleteInput @deprecated(reason: \\"Top level delete input argument in update is deprecated. Use the nested delete field in the relationship within the update argument\\"), disconnect: MovieDisconnectInput @deprecated(reason: \\"Top level disconnect input argument in update is deprecated. Use the nested disconnect field in the relationship within the update argument\\"), update: MovieUpdateInput, where: MovieWhere): UpdateMoviesMutationResponse!
                  updateSeries(connect: SeriesConnectInput @deprecated(reason: \\"Top level connect input argument in update is deprecated. Use the nested connect field in the relationship within the update argument\\"), create: SeriesRelationInput @deprecated(reason: \\"Top level create input argument in update is deprecated. Use the nested create field in the relationship within the update argument\\"), delete: SeriesDeleteInput @deprecated(reason: \\"Top level delete input argument in update is deprecated. Use the nested delete field in the relationship within the update argument\\"), disconnect: SeriesDisconnectInput @deprecated(reason: \\"Top level disconnect input argument in update is deprecated. Use the nested disconnect field in the relationship within the update argument\\"), update: SeriesUpdateInput, where: SeriesWhere): UpdateSeriesMutationResponse!
                }

                \\"\\"\\"Pagination information (Relay)\\"\\"\\"
                type PageInfo {
                  endCursor: String
                  hasNextPage: Boolean!
                  hasPreviousPage: Boolean!
                  startCursor: String
                }

                interface Production {
                  actors(limit: Int, offset: Int, options: ActorOptions @deprecated(reason: \\"Query options argument is deprecated, please use pagination arguments like limit, offset and sort instead.\\"), sort: [ActorSort!], where: ActorWhere): [Actor!]!
                  actorsConnection(after: String, first: Int, sort: [ProductionActorsConnectionSort!], where: ProductionActorsConnectionWhere): ProductionActorsConnection!
                  description: String
                  title: String!
                }

                input ProductionActorsAggregateInput {
                  AND: [ProductionActorsAggregateInput!]
                  NOT: ProductionActorsAggregateInput
                  OR: [ProductionActorsAggregateInput!]
                  count: Int @deprecated(reason: \\"Please use the explicit _EQ version\\")
                  count_EQ: Int
                  count_GT: Int
                  count_GTE: Int
                  count_LT: Int
                  count_LTE: Int
                  node: ProductionActorsNodeAggregationWhereInput
                }

                input ProductionActorsConnectFieldInput {
                  connect: [ActorConnectInput!]
                  \\"\\"\\"
                  Whether or not to overwrite any matching relationship with the new properties.
                  \\"\\"\\"
                  overwrite: Boolean! = true
                  where: ActorConnectWhere
                }

                type ProductionActorsConnection {
                  edges: [ProductionActorsRelationship!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
                }

                input ProductionActorsConnectionSort {
                  node: ActorSort
                }

                input ProductionActorsConnectionWhere {
                  AND: [ProductionActorsConnectionWhere!]
                  NOT: ProductionActorsConnectionWhere
                  OR: [ProductionActorsConnectionWhere!]
                  node: ActorWhere
                }

                input ProductionActorsCreateFieldInput {
                  node: ActorCreateInput!
                }

                input ProductionActorsDeleteFieldInput {
                  delete: ActorDeleteInput
                  where: ProductionActorsConnectionWhere
                }

                input ProductionActorsDisconnectFieldInput {
                  disconnect: ActorDisconnectInput
                  where: ProductionActorsConnectionWhere
                }

                input ProductionActorsNodeAggregationWhereInput {
                  AND: [ProductionActorsNodeAggregationWhereInput!]
                  NOT: ProductionActorsNodeAggregationWhereInput
                  OR: [ProductionActorsNodeAggregationWhereInput!]
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

                type ProductionActorsRelationship {
                  cursor: String!
                  node: Actor!
                }

                input ProductionActorsUpdateConnectionInput {
                  node: ActorUpdateInput
                }

                input ProductionActorsUpdateFieldInput {
                  connect: [ProductionActorsConnectFieldInput!]
                  create: [ProductionActorsCreateFieldInput!]
                  delete: [ProductionActorsDeleteFieldInput!]
                  disconnect: [ProductionActorsDisconnectFieldInput!]
                  update: ProductionActorsUpdateConnectionInput
                  where: ProductionActorsConnectionWhere
                }

                type ProductionAggregateSelection {
                  count: Int!
                  description: StringAggregateSelection!
                  title: StringAggregateSelection!
                }

                input ProductionConnectInput {
                  actors: [ProductionActorsConnectFieldInput!]
                }

                input ProductionConnectWhere {
                  node: ProductionWhere!
                }

                input ProductionCreateInput {
                  Movie: MovieCreateInput
                  Series: SeriesCreateInput
                }

                input ProductionDeleteInput {
                  actors: [ProductionActorsDeleteFieldInput!]
                }

                input ProductionDisconnectInput {
                  actors: [ProductionActorsDisconnectFieldInput!]
                }

                type ProductionEdge {
                  cursor: String!
                  node: Production!
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
                  sort: [ProductionSort!]
                }

                \\"\\"\\"
                Fields to sort Productions by. The order in which sorts are applied is not guaranteed when specifying many fields in one ProductionSort object.
                \\"\\"\\"
                input ProductionSort {
                  description: SortDirection
                  title: SortDirection
                }

                input ProductionUpdateInput {
                  actors: [ProductionActorsUpdateFieldInput!]
                  description: String
                  title: String
                }

                input ProductionWhere {
                  AND: [ProductionWhere!]
                  NOT: ProductionWhere
                  OR: [ProductionWhere!]
                  actors: ActorWhere @deprecated(reason: \\"Use \`actors_SOME\` instead.\\")
                  actorsAggregate: ProductionActorsAggregateInput
                  actorsConnection: ProductionActorsConnectionWhere @deprecated(reason: \\"Use \`actorsConnection_SOME\` instead.\\")
                  \\"\\"\\"
                  Return Productions where all of the related ProductionActorsConnections match this filter
                  \\"\\"\\"
                  actorsConnection_ALL: ProductionActorsConnectionWhere
                  \\"\\"\\"
                  Return Productions where none of the related ProductionActorsConnections match this filter
                  \\"\\"\\"
                  actorsConnection_NONE: ProductionActorsConnectionWhere
                  \\"\\"\\"
                  Return Productions where one of the related ProductionActorsConnections match this filter
                  \\"\\"\\"
                  actorsConnection_SINGLE: ProductionActorsConnectionWhere
                  \\"\\"\\"
                  Return Productions where some of the related ProductionActorsConnections match this filter
                  \\"\\"\\"
                  actorsConnection_SOME: ProductionActorsConnectionWhere
                  \\"\\"\\"Return Productions where all of the related Actors match this filter\\"\\"\\"
                  actors_ALL: ActorWhere
                  \\"\\"\\"Return Productions where none of the related Actors match this filter\\"\\"\\"
                  actors_NONE: ActorWhere
                  \\"\\"\\"Return Productions where one of the related Actors match this filter\\"\\"\\"
                  actors_SINGLE: ActorWhere
                  \\"\\"\\"Return Productions where some of the related Actors match this filter\\"\\"\\"
                  actors_SOME: ActorWhere
                  description: String @deprecated(reason: \\"Please use the explicit _EQ version\\")
                  description_CONTAINS: String
                  description_ENDS_WITH: String
                  description_EQ: String
                  description_IN: [String]
                  description_STARTS_WITH: String
                  title: String @deprecated(reason: \\"Please use the explicit _EQ version\\")
                  title_CONTAINS: String
                  title_ENDS_WITH: String
                  title_EQ: String
                  title_IN: [String!]
                  title_STARTS_WITH: String
                  typename_IN: [ProductionImplementation!]
                }

                type ProductionsConnection {
                  edges: [ProductionEdge!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
                }

                type Query {
                  actors(limit: Int, offset: Int, options: ActorOptions @deprecated(reason: \\"Query options argument is deprecated, please use pagination arguments like limit, offset and sort instead.\\"), sort: [ActorSort!], where: ActorWhere): [Actor!]!
                  actorsAggregate(where: ActorWhere): ActorAggregateSelection!
                  actorsConnection(after: String, first: Int, sort: [ActorSort!], where: ActorWhere): ActorsConnection!
                  movies(limit: Int, offset: Int, options: MovieOptions @deprecated(reason: \\"Query options argument is deprecated, please use pagination arguments like limit, offset and sort instead.\\"), sort: [MovieSort!], where: MovieWhere): [Movie!]!
                  moviesAggregate(where: MovieWhere): MovieAggregateSelection!
                  moviesConnection(after: String, first: Int, sort: [MovieSort!], where: MovieWhere): MoviesConnection!
                  productions(limit: Int, offset: Int, options: ProductionOptions @deprecated(reason: \\"Query options argument is deprecated, please use pagination arguments like limit, offset and sort instead.\\"), sort: [ProductionSort!], where: ProductionWhere): [Production!]!
                  productionsAggregate(where: ProductionWhere): ProductionAggregateSelection!
                  productionsConnection(after: String, first: Int, sort: [ProductionSort!], where: ProductionWhere): ProductionsConnection!
                  series(limit: Int, offset: Int, options: SeriesOptions @deprecated(reason: \\"Query options argument is deprecated, please use pagination arguments like limit, offset and sort instead.\\"), sort: [SeriesSort!], where: SeriesWhere): [Series!]!
                  seriesAggregate(where: SeriesWhere): SeriesAggregateSelection!
                  seriesConnection(after: String, first: Int, sort: [SeriesSort!], where: SeriesWhere): SeriesConnection!
                }

                type Series implements Production {
                  actors(directed: Boolean = true, limit: Int, offset: Int, options: ActorOptions @deprecated(reason: \\"Query options argument is deprecated, please use pagination arguments like limit, offset and sort instead.\\"), sort: [ActorSort!], where: ActorWhere): [Actor!]!
                  actorsAggregate(directed: Boolean = true, where: ActorWhere): SeriesActorActorsAggregationSelection
                  actorsConnection(after: String, directed: Boolean = true, first: Int, sort: [ProductionActorsConnectionSort!], where: ProductionActorsConnectionWhere): ProductionActorsConnection!
                  description: String
                  title: String!
                }

                type SeriesActorActorsAggregationSelection {
                  count: Int!
                  node: SeriesActorActorsNodeAggregateSelection
                }

                type SeriesActorActorsNodeAggregateSelection {
                  name: StringAggregateSelection!
                }

                input SeriesActorsAggregateInput {
                  AND: [SeriesActorsAggregateInput!]
                  NOT: SeriesActorsAggregateInput
                  OR: [SeriesActorsAggregateInput!]
                  count: Int @deprecated(reason: \\"Please use the explicit _EQ version\\")
                  count_EQ: Int
                  count_GT: Int
                  count_GTE: Int
                  count_LT: Int
                  count_LTE: Int
                  node: SeriesActorsNodeAggregationWhereInput
                }

                input SeriesActorsConnectFieldInput {
                  connect: [ActorConnectInput!]
                  \\"\\"\\"
                  Whether or not to overwrite any matching relationship with the new properties.
                  \\"\\"\\"
                  overwrite: Boolean! = true
                  where: ActorConnectWhere
                }

                input SeriesActorsCreateFieldInput {
                  node: ActorCreateInput!
                }

                input SeriesActorsFieldInput {
                  connect: [SeriesActorsConnectFieldInput!]
                  create: [SeriesActorsCreateFieldInput!]
                }

                input SeriesActorsNodeAggregationWhereInput {
                  AND: [SeriesActorsNodeAggregationWhereInput!]
                  NOT: SeriesActorsNodeAggregationWhereInput
                  OR: [SeriesActorsNodeAggregationWhereInput!]
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

                input SeriesActorsUpdateConnectionInput {
                  node: ActorUpdateInput
                }

                input SeriesActorsUpdateFieldInput {
                  connect: [SeriesActorsConnectFieldInput!]
                  create: [SeriesActorsCreateFieldInput!]
                  delete: [ProductionActorsDeleteFieldInput!]
                  disconnect: [ProductionActorsDisconnectFieldInput!]
                  update: SeriesActorsUpdateConnectionInput
                  where: ProductionActorsConnectionWhere
                }

                type SeriesAggregateSelection {
                  count: Int!
                  description: StringAggregateSelection!
                  title: StringAggregateSelection!
                }

                input SeriesConnectInput {
                  actors: [SeriesActorsConnectFieldInput!]
                }

                type SeriesConnection {
                  edges: [SeriesEdge!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
                }

                input SeriesCreateInput {
                  actors: SeriesActorsFieldInput
                  description: String
                  title: String!
                }

                input SeriesDeleteInput {
                  actors: [ProductionActorsDeleteFieldInput!]
                }

                input SeriesDisconnectInput {
                  actors: [ProductionActorsDisconnectFieldInput!]
                }

                type SeriesEdge {
                  cursor: String!
                  node: Series!
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
                  actors: [SeriesActorsCreateFieldInput!]
                }

                \\"\\"\\"
                Fields to sort Series by. The order in which sorts are applied is not guaranteed when specifying many fields in one SeriesSort object.
                \\"\\"\\"
                input SeriesSort {
                  description: SortDirection
                  title: SortDirection
                }

                input SeriesUpdateInput {
                  actors: [SeriesActorsUpdateFieldInput!]
                  description: String
                  title: String
                }

                input SeriesWhere {
                  AND: [SeriesWhere!]
                  NOT: SeriesWhere
                  OR: [SeriesWhere!]
                  actors: ActorWhere @deprecated(reason: \\"Use \`actors_SOME\` instead.\\")
                  actorsAggregate: SeriesActorsAggregateInput
                  actorsConnection: ProductionActorsConnectionWhere @deprecated(reason: \\"Use \`actorsConnection_SOME\` instead.\\")
                  \\"\\"\\"
                  Return Series where all of the related ProductionActorsConnections match this filter
                  \\"\\"\\"
                  actorsConnection_ALL: ProductionActorsConnectionWhere
                  \\"\\"\\"
                  Return Series where none of the related ProductionActorsConnections match this filter
                  \\"\\"\\"
                  actorsConnection_NONE: ProductionActorsConnectionWhere
                  \\"\\"\\"
                  Return Series where one of the related ProductionActorsConnections match this filter
                  \\"\\"\\"
                  actorsConnection_SINGLE: ProductionActorsConnectionWhere
                  \\"\\"\\"
                  Return Series where some of the related ProductionActorsConnections match this filter
                  \\"\\"\\"
                  actorsConnection_SOME: ProductionActorsConnectionWhere
                  \\"\\"\\"Return Series where all of the related Actors match this filter\\"\\"\\"
                  actors_ALL: ActorWhere
                  \\"\\"\\"Return Series where none of the related Actors match this filter\\"\\"\\"
                  actors_NONE: ActorWhere
                  \\"\\"\\"Return Series where one of the related Actors match this filter\\"\\"\\"
                  actors_SINGLE: ActorWhere
                  \\"\\"\\"Return Series where some of the related Actors match this filter\\"\\"\\"
                  actors_SOME: ActorWhere
                  description: String @deprecated(reason: \\"Please use the explicit _EQ version\\")
                  description_CONTAINS: String
                  description_ENDS_WITH: String
                  description_EQ: String
                  description_IN: [String]
                  description_STARTS_WITH: String
                  title: String @deprecated(reason: \\"Please use the explicit _EQ version\\")
                  title_CONTAINS: String
                  title_ENDS_WITH: String
                  title_EQ: String
                  title_IN: [String!]
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
                }

                type UpdateSeriesMutationResponse {
                  info: UpdateInfo!
                  series: [Series!]!
                }"
            `);
        });
    });
});
