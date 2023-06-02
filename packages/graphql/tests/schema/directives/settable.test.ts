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
import { Neo4jGraphQL } from "../../../src";
import { TestSubscriptionsPlugin } from "../../utils/TestSubscriptionPlugin";

describe("@settable", () => {
    let subscriptionPlugin: TestSubscriptionsPlugin;

    beforeAll(() => {
        subscriptionPlugin = new TestSubscriptionsPlugin();
    });

    test("Disable create fields", async () => {
        const typeDefs = gql`
            type Movie @query(aggregate: true) {
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

            type Movie {
              description: String
              title: String!
            }

            type MovieAggregateSelection {
              count: Int!
              description: StringAggregateSelectionNullable!
              title: StringAggregateSelectionNonNullable!
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
              description: String
              description_CONTAINS: String
              description_ENDS_WITH: String
              description_IN: [String]
              description_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              description_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              description_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              description_NOT_IN: [String] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              description_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              description_STARTS_WITH: String
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

    test("Disable update fields", async () => {
        const typeDefs = gql`
            type Movie @query(aggregate: true) {
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

            type Movie {
              description: String
              title: String!
            }

            type MovieAggregateSelection {
              count: Int!
              description: StringAggregateSelectionNullable!
              title: StringAggregateSelectionNonNullable!
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
              description: String
              description_CONTAINS: String
              description_ENDS_WITH: String
              description_IN: [String]
              description_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              description_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              description_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              description_NOT_IN: [String] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              description_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              description_STARTS_WITH: String
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

    test("Disable create and update fields", async () => {
        const typeDefs = gql`
            type Movie @query(aggregate: true) {
                title: String!
                description: String @settable(onCreate: false, onUpdate: false)
            }
        `;
        const neoSchema = new Neo4jGraphQL({ typeDefs, plugins: { subscriptions: subscriptionPlugin } });
        const printedSchema = printSchemaWithDirectives(lexicographicSortSchema(await neoSchema.getSchema()));
        expect(printedSchema).toMatchInlineSnapshot(`
            "schema {
              query: Query
              mutation: Mutation
              subscription: Subscription
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
              description: String
              title: String!
            }

            type MovieAggregateSelection {
              count: Int!
              description: StringAggregateSelectionNullable!
              title: StringAggregateSelectionNonNullable!
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
              description: String
              description_CONTAINS: String
              description_ENDS_WITH: String
              description_IN: [String]
              description_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              description_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              description_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              description_NOT_IN: [String] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              description_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              description_STARTS_WITH: String
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
              description: String
              description_CONTAINS: String
              description_ENDS_WITH: String
              description_IN: [String]
              description_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              description_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              description_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              description_NOT_IN: [String] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              description_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              description_STARTS_WITH: String
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
              movieCreated(where: MovieSubscriptionWhere): MovieCreatedEvent!
              movieDeleted(where: MovieSubscriptionWhere): MovieDeletedEvent!
              movieUpdated(where: MovieSubscriptionWhere): MovieUpdatedEvent!
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

    describe("Relationships", () => {
        test("Prevent relationship field creation", async () => {
            const typeDefs = gql`
                type Movie @query(aggregate: true) {
                    title: String!
                    description: String
                }

                type Actor @query(aggregate: true) {
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
                  actedIn(directed: Boolean = true, options: MovieOptions, where: MovieWhere): [Movie!]!
                  actedInAggregate(directed: Boolean = true, where: MovieWhere): ActorMovieActedInAggregationSelection
                  actedInConnection(after: String, directed: Boolean = true, first: Int, sort: [ActorActedInConnectionSort!], where: ActorActedInConnectionWhere): ActorActedInConnection!
                  name: String!
                }

                input ActorActedInAggregateInput {
                  AND: [ActorActedInAggregateInput!]
                  NOT: ActorActedInAggregateInput
                  OR: [ActorActedInAggregateInput!]
                  count: Int
                  count_GT: Int
                  count_GTE: Int
                  count_LT: Int
                  count_LTE: Int
                  node: ActorActedInNodeAggregationWhereInput
                }

                input ActorActedInConnectFieldInput {
                  \\"\\"\\"
                  Whether or not to overwrite any matching relationship with the new properties. Will default to \`false\` in 4.0.0.
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
                  node_NOT: MovieWhere @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
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
                  name: StringAggregateSelectionNonNullable!
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
                  description: StringAggregateSelectionNullable!
                  title: StringAggregateSelectionNonNullable!
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
                  actedInConnection_NOT: ActorActedInConnectionWhere @deprecated(reason: \\"Use \`actedInConnection_NONE\` instead.\\")
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
                  actedIn_NOT: MovieWhere @deprecated(reason: \\"Use \`actedIn_NONE\` instead.\\")
                  \\"\\"\\"Return Actors where one of the related Movies match this filter\\"\\"\\"
                  actedIn_SINGLE: MovieWhere
                  \\"\\"\\"Return Actors where some of the related Movies match this filter\\"\\"\\"
                  actedIn_SOME: MovieWhere
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

                type Movie {
                  description: String
                  title: String!
                }

                type MovieAggregateSelection {
                  count: Int!
                  description: StringAggregateSelectionNullable!
                  title: StringAggregateSelectionNonNullable!
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
                  description: String
                  description_CONTAINS: String
                  description_ENDS_WITH: String
                  description_IN: [String]
                  description_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  description_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  description_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  description_NOT_IN: [String] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  description_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  description_STARTS_WITH: String
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
                  updateActors(connect: ActorConnectInput, create: ActorRelationInput, delete: ActorDeleteInput, disconnect: ActorDisconnectInput, update: ActorUpdateInput, where: ActorWhere): UpdateActorsMutationResponse!
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

        test("Prevent relationship field update", async () => {
            const typeDefs = gql`
                type Movie @query(aggregate: true) {
                    title: String!
                    description: String
                }

                type Actor @query(aggregate: true) {
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
                  actedIn(directed: Boolean = true, options: MovieOptions, where: MovieWhere): [Movie!]!
                  actedInAggregate(directed: Boolean = true, where: MovieWhere): ActorMovieActedInAggregationSelection
                  actedInConnection(after: String, directed: Boolean = true, first: Int, sort: [ActorActedInConnectionSort!], where: ActorActedInConnectionWhere): ActorActedInConnection!
                  name: String!
                }

                input ActorActedInAggregateInput {
                  AND: [ActorActedInAggregateInput!]
                  NOT: ActorActedInAggregateInput
                  OR: [ActorActedInAggregateInput!]
                  count: Int
                  count_GT: Int
                  count_GTE: Int
                  count_LT: Int
                  count_LTE: Int
                  node: ActorActedInNodeAggregationWhereInput
                }

                input ActorActedInConnectFieldInput {
                  \\"\\"\\"
                  Whether or not to overwrite any matching relationship with the new properties. Will default to \`false\` in 4.0.0.
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
                  node_NOT: MovieWhere @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
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
                  name: StringAggregateSelectionNonNullable!
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
                  description: StringAggregateSelectionNullable!
                  title: StringAggregateSelectionNonNullable!
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
                  actedInConnection_NOT: ActorActedInConnectionWhere @deprecated(reason: \\"Use \`actedInConnection_NONE\` instead.\\")
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
                  actedIn_NOT: MovieWhere @deprecated(reason: \\"Use \`actedIn_NONE\` instead.\\")
                  \\"\\"\\"Return Actors where one of the related Movies match this filter\\"\\"\\"
                  actedIn_SINGLE: MovieWhere
                  \\"\\"\\"Return Actors where some of the related Movies match this filter\\"\\"\\"
                  actedIn_SOME: MovieWhere
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

                type Movie {
                  description: String
                  title: String!
                }

                type MovieAggregateSelection {
                  count: Int!
                  description: StringAggregateSelectionNullable!
                  title: StringAggregateSelectionNonNullable!
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
                  description: String
                  description_CONTAINS: String
                  description_ENDS_WITH: String
                  description_IN: [String]
                  description_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  description_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  description_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  description_NOT_IN: [String] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  description_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  description_STARTS_WITH: String
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
                  updateActors(connect: ActorConnectInput, create: ActorRelationInput, delete: ActorDeleteInput, disconnect: ActorDisconnectInput, update: ActorUpdateInput, where: ActorWhere): UpdateActorsMutationResponse!
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
