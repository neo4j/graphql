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
import { Neo4jGraphQL } from "../../../../src";
import { TestSubscriptionsEngine } from "../../../utils/TestSubscriptionsEngine";

describe("@selectable", () => {
    let subscriptionMechanism: TestSubscriptionsEngine;

    beforeAll(() => {
        subscriptionMechanism = new TestSubscriptionsEngine();
    });

    test("Disable read fields", async () => {
        const typeDefs = gql`
            type Movie @query(aggregate: true) {
                title: String!
                description: String @selectable(onRead: false, onAggregate: true)
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

    test("Disable aggregation fields", async () => {
        const typeDefs = gql`
            type Movie @query(aggregate: true) {
                title: String!
                description: String @selectable(onRead: true, onAggregate: false)
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
              description: String
              title: String!
            }

            type MovieAggregateSelection {
              count: Int!
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

    test("Disable read and aggregate fields", async () => {
        const typeDefs = gql`
            type Movie @query(aggregate: true) {
                title: String!
                description: String @selectable(onRead: false, onAggregate: false)
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
              title: String!
            }

            type MovieAggregateSelection {
              count: Int!
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

    test("Disable read fields on subscriptions", async () => {
        const typeDefs = gql`
            type Movie @query(aggregate: true) {
                title: String!
                description: String @selectable(onRead: false, onAggregate: true)
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

            type Movie {
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
              title_IN: [String!]
              title_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              title_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              title_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              title_NOT_IN: [String!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              title_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              title_STARTS_WITH: String
            }

            input MovieUpdateInput {
              description: String
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

    describe("relationships fields to a concrete type", () => {
        test("Disable read on relationship field", async () => {
            const typeDefs = gql`
                type Movie @query(aggregate: true) {
                    title: String!
                    description: String
                }

                type Actor @query(aggregate: true) {
                    name: String!
                    actedIn: [Movie!]!
                        @relationship(type: "ACTED_IN", direction: OUT)
                        @selectable(onRead: false, onAggregate: true)
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
                  actedInAggregate(directed: Boolean = true, where: MovieWhere): ActorMovieActedInAggregationSelection
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
                  Whether or not to overwrite any matching relationship with the new properties.
                  \\"\\"\\"
                  overwrite: Boolean! = true
                  where: MovieConnectWhere
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
        test("Disable aggregation on relationship field (no-op as controlled by @relationship(aggregate: false))", async () => {
            const typeDefs = gql`
                type Movie @query(aggregate: true) {
                    title: String!
                    description: String
                }

                type Actor @query(aggregate: true) {
                    name: String!
                    actedIn: [Movie!]!
                        @relationship(type: "ACTED_IN", direction: OUT)
                        @selectable(onRead: true, onAggregate: true)
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

    describe("relationships fields to a union type", () => {
        test("Disable read on relationship field", async () => {
            const typeDefs = gql`
                type Movie @query(aggregate: true) {
                    title: String!
                    description: String
                }

                type Series @query(aggregate: true) {
                    name: String!
                    description: String
                }

                union Production = Movie | Series

                type Actor @query(aggregate: true) {
                    name: String!
                    actedIn: [Production!]!
                        @relationship(type: "ACTED_IN", direction: OUT)
                        @selectable(onRead: false, onAggregate: true)
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
                  name: String!
                }

                input ActorActedInConnectInput {
                  Movie: [ActorActedInMovieConnectFieldInput!]
                  Series: [ActorActedInSeriesConnectFieldInput!]
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
                  node_NOT: MovieWhere @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
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

                input ActorActedInSeriesConnectFieldInput {
                  where: SeriesConnectWhere
                }

                input ActorActedInSeriesConnectionWhere {
                  AND: [ActorActedInSeriesConnectionWhere!]
                  NOT: ActorActedInSeriesConnectionWhere
                  OR: [ActorActedInSeriesConnectionWhere!]
                  node: SeriesWhere
                  node_NOT: SeriesWhere @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
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
                  actedInConnection_NOT: ActorActedInConnectionWhere @deprecated(reason: \\"Use \`actedInConnection_NONE\` instead.\\")
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
                  actedIn_NOT: ProductionWhere @deprecated(reason: \\"Use \`actedIn_NONE\` instead.\\")
                  \\"\\"\\"Return Actors where one of the related Productions match this filter\\"\\"\\"
                  actedIn_SINGLE: ProductionWhere
                  \\"\\"\\"Return Actors where some of the related Productions match this filter\\"\\"\\"
                  actedIn_SOME: ProductionWhere
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

                type CreateSeriesMutationResponse {
                  info: CreateInfo!
                  series: [Series!]!
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
                  createSeries(input: [SeriesCreateInput!]!): CreateSeriesMutationResponse!
                  deleteActors(delete: ActorDeleteInput, where: ActorWhere): DeleteInfo!
                  deleteMovies(where: MovieWhere): DeleteInfo!
                  deleteSeries(where: SeriesWhere): DeleteInfo!
                  updateActors(connect: ActorConnectInput, create: ActorRelationInput, delete: ActorDeleteInput, disconnect: ActorDisconnectInput, update: ActorUpdateInput, where: ActorWhere): UpdateActorsMutationResponse!
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
                  actors(options: ActorOptions, where: ActorWhere): [Actor!]!
                  actorsAggregate(where: ActorWhere): ActorAggregateSelection!
                  actorsConnection(after: String, first: Int, sort: [ActorSort], where: ActorWhere): ActorsConnection!
                  movies(options: MovieOptions, where: MovieWhere): [Movie!]!
                  moviesAggregate(where: MovieWhere): MovieAggregateSelection!
                  moviesConnection(after: String, first: Int, sort: [MovieSort], where: MovieWhere): MoviesConnection!
                  productions(options: QueryOptions, where: ProductionWhere): [Production!]!
                  series(options: SeriesOptions, where: SeriesWhere): [Series!]!
                  seriesAggregate(where: SeriesWhere): SeriesAggregateSelection!
                  seriesConnection(after: String, first: Int, sort: [SeriesSort], where: SeriesWhere): SeriesConnection!
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
                }

                type UpdateSeriesMutationResponse {
                  info: UpdateInfo!
                  series: [Series!]!
                }"
            `);
        });
        test("Disable aggregation on relationship field (no-op as controlled by @relationship(aggregate: false))", async () => {
            const typeDefs = gql`
                type Movie @query(aggregate: true) {
                    title: String!
                    description: String
                }

                type Series @query(aggregate: true) {
                    name: String!
                    description: String
                }

                union Production = Movie | Series

                type Actor @query(aggregate: true) {
                    name: String!
                    actedIn: [Production!]!
                        @relationship(type: "ACTED_IN", direction: OUT)
                        @selectable(onRead: true, onAggregate: false)
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
                  actedIn(directed: Boolean = true, options: QueryOptions, where: ProductionWhere): [Production!]!
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
                  node_NOT: MovieWhere @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
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
                  node_NOT: SeriesWhere @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
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
                  actedInConnection_NOT: ActorActedInConnectionWhere @deprecated(reason: \\"Use \`actedInConnection_NONE\` instead.\\")
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
                  actedIn_NOT: ProductionWhere @deprecated(reason: \\"Use \`actedIn_NONE\` instead.\\")
                  \\"\\"\\"Return Actors where one of the related Productions match this filter\\"\\"\\"
                  actedIn_SINGLE: ProductionWhere
                  \\"\\"\\"Return Actors where some of the related Productions match this filter\\"\\"\\"
                  actedIn_SOME: ProductionWhere
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

                type CreateSeriesMutationResponse {
                  info: CreateInfo!
                  series: [Series!]!
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
                  createSeries(input: [SeriesCreateInput!]!): CreateSeriesMutationResponse!
                  deleteActors(delete: ActorDeleteInput, where: ActorWhere): DeleteInfo!
                  deleteMovies(where: MovieWhere): DeleteInfo!
                  deleteSeries(where: SeriesWhere): DeleteInfo!
                  updateActors(connect: ActorConnectInput, create: ActorRelationInput, delete: ActorDeleteInput, disconnect: ActorDisconnectInput, update: ActorUpdateInput, where: ActorWhere): UpdateActorsMutationResponse!
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
                  actors(options: ActorOptions, where: ActorWhere): [Actor!]!
                  actorsAggregate(where: ActorWhere): ActorAggregateSelection!
                  actorsConnection(after: String, first: Int, sort: [ActorSort], where: ActorWhere): ActorsConnection!
                  movies(options: MovieOptions, where: MovieWhere): [Movie!]!
                  moviesAggregate(where: MovieWhere): MovieAggregateSelection!
                  moviesConnection(after: String, first: Int, sort: [MovieSort], where: MovieWhere): MoviesConnection!
                  productions(options: QueryOptions, where: ProductionWhere): [Production!]!
                  series(options: SeriesOptions, where: SeriesWhere): [Series!]!
                  seriesAggregate(where: SeriesWhere): SeriesAggregateSelection!
                  seriesConnection(after: String, first: Int, sort: [SeriesSort], where: SeriesWhere): SeriesConnection!
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
                }

                type UpdateSeriesMutationResponse {
                  info: UpdateInfo!
                  series: [Series!]!
                }"
            `);
        });
    });

    describe("relationships fields to an interface type", () => {
        test("Disable read on relationship field", async () => {
            const typeDefs = gql`
                interface Production {
                    title: String!
                    description: String
                }

                type Movie implements Production @query(aggregate: true) {
                    title: String!
                    description: String
                }

                type Series implements Production @query(aggregate: true) {
                    title: String!
                    description: String
                }

                type Actor @query(aggregate: true) {
                    name: String!
                    actedIn: [Production!]!
                        @relationship(type: "ACTED_IN", direction: OUT)
                        @selectable(onRead: false, onAggregate: true)
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
                  actedInAggregate(directed: Boolean = true, where: ProductionWhere): ActorProductionActedInAggregationSelection
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
                  where: ProductionConnectWhere
                }

                input ActorActedInConnectionWhere {
                  AND: [ActorActedInConnectionWhere!]
                  NOT: ActorActedInConnectionWhere
                  OR: [ActorActedInConnectionWhere!]
                  node: ProductionWhere
                  node_NOT: ProductionWhere @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
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
                  actedInConnection_NOT: ActorActedInConnectionWhere @deprecated(reason: \\"Use \`actedInConnection_NONE\` instead.\\")
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
                  actedIn_NOT: ProductionWhere @deprecated(reason: \\"Use \`actedIn_NONE\` instead.\\")
                  \\"\\"\\"Return Actors where one of the related Productions match this filter\\"\\"\\"
                  actedIn_SINGLE: ProductionWhere
                  \\"\\"\\"Return Actors where some of the related Productions match this filter\\"\\"\\"
                  actedIn_SOME: ProductionWhere
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

                type CreateSeriesMutationResponse {
                  info: CreateInfo!
                  series: [Series!]!
                }

                \\"\\"\\"
                Information about the number of nodes and relationships deleted during a delete mutation
                \\"\\"\\"
                type DeleteInfo {
                  bookmark: String @deprecated(reason: \\"This field has been deprecated because bookmarks are now handled by the driver.\\")
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
                  createSeries(input: [SeriesCreateInput!]!): CreateSeriesMutationResponse!
                  deleteActors(delete: ActorDeleteInput, where: ActorWhere): DeleteInfo!
                  deleteMovies(where: MovieWhere): DeleteInfo!
                  deleteSeries(where: SeriesWhere): DeleteInfo!
                  updateActors(connect: ActorConnectInput, create: ActorRelationInput, delete: ActorDeleteInput, disconnect: ActorDisconnectInput, update: ActorUpdateInput, where: ActorWhere): UpdateActorsMutationResponse!
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
                  sort: [ProductionSort]
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
                  typename_IN: [ProductionImplementation!]
                }

                type ProductionsConnection {
                  edges: [ProductionEdge!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
                }

                type Query {
                  actors(options: ActorOptions, where: ActorWhere): [Actor!]!
                  actorsAggregate(where: ActorWhere): ActorAggregateSelection!
                  actorsConnection(after: String, first: Int, sort: [ActorSort], where: ActorWhere): ActorsConnection!
                  movies(options: MovieOptions, where: MovieWhere): [Movie!]!
                  moviesAggregate(where: MovieWhere): MovieAggregateSelection!
                  moviesConnection(after: String, first: Int, sort: [MovieSort], where: MovieWhere): MoviesConnection!
                  productions(options: ProductionOptions, where: ProductionWhere): [Production!]!
                  productionsAggregate(where: ProductionWhere): ProductionAggregateSelection!
                  productionsConnection(after: String, first: Int, sort: [ProductionSort], where: ProductionWhere): ProductionsConnection!
                  series(options: SeriesOptions, where: SeriesWhere): [Series!]!
                  seriesAggregate(where: SeriesWhere): SeriesAggregateSelection!
                  seriesConnection(after: String, first: Int, sort: [SeriesSort], where: SeriesWhere): SeriesConnection!
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
                }

                type UpdateSeriesMutationResponse {
                  info: UpdateInfo!
                  series: [Series!]!
                }"
            `);
        });
        test("Disable aggregation on relationship field (no-op as controlled by @relationship(aggregate: false))", async () => {
            const typeDefs = gql`
                interface Production {
                    title: String!
                    description: String
                }

                type Movie implements Production @query(aggregate: true) {
                    title: String!
                    description: String
                }

                type Series implements Production @query(aggregate: true) {
                    title: String!
                    description: String
                }

                type Actor @query(aggregate: true) {
                    name: String!
                    actedIn: [Production!]!
                        @relationship(type: "ACTED_IN", direction: OUT)
                        @selectable(onRead: true, onAggregate: false)
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
                  actedIn(directed: Boolean = true, options: ProductionOptions, where: ProductionWhere): [Production!]!
                  actedInAggregate(directed: Boolean = true, where: ProductionWhere): ActorProductionActedInAggregationSelection
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
                  node_NOT: ProductionWhere @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
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
                  actedInConnection_NOT: ActorActedInConnectionWhere @deprecated(reason: \\"Use \`actedInConnection_NONE\` instead.\\")
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
                  actedIn_NOT: ProductionWhere @deprecated(reason: \\"Use \`actedIn_NONE\` instead.\\")
                  \\"\\"\\"Return Actors where one of the related Productions match this filter\\"\\"\\"
                  actedIn_SINGLE: ProductionWhere
                  \\"\\"\\"Return Actors where some of the related Productions match this filter\\"\\"\\"
                  actedIn_SOME: ProductionWhere
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

                type CreateSeriesMutationResponse {
                  info: CreateInfo!
                  series: [Series!]!
                }

                \\"\\"\\"
                Information about the number of nodes and relationships deleted during a delete mutation
                \\"\\"\\"
                type DeleteInfo {
                  bookmark: String @deprecated(reason: \\"This field has been deprecated because bookmarks are now handled by the driver.\\")
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
                  createSeries(input: [SeriesCreateInput!]!): CreateSeriesMutationResponse!
                  deleteActors(delete: ActorDeleteInput, where: ActorWhere): DeleteInfo!
                  deleteMovies(where: MovieWhere): DeleteInfo!
                  deleteSeries(where: SeriesWhere): DeleteInfo!
                  updateActors(connect: ActorConnectInput, create: ActorRelationInput, delete: ActorDeleteInput, disconnect: ActorDisconnectInput, update: ActorUpdateInput, where: ActorWhere): UpdateActorsMutationResponse!
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
                  sort: [ProductionSort]
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
                  typename_IN: [ProductionImplementation!]
                }

                type ProductionsConnection {
                  edges: [ProductionEdge!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
                }

                type Query {
                  actors(options: ActorOptions, where: ActorWhere): [Actor!]!
                  actorsAggregate(where: ActorWhere): ActorAggregateSelection!
                  actorsConnection(after: String, first: Int, sort: [ActorSort], where: ActorWhere): ActorsConnection!
                  movies(options: MovieOptions, where: MovieWhere): [Movie!]!
                  moviesAggregate(where: MovieWhere): MovieAggregateSelection!
                  moviesConnection(after: String, first: Int, sort: [MovieSort], where: MovieWhere): MoviesConnection!
                  productions(options: ProductionOptions, where: ProductionWhere): [Production!]!
                  productionsAggregate(where: ProductionWhere): ProductionAggregateSelection!
                  productionsConnection(after: String, first: Int, sort: [ProductionSort], where: ProductionWhere): ProductionsConnection!
                  series(options: SeriesOptions, where: SeriesWhere): [Series!]!
                  seriesAggregate(where: SeriesWhere): SeriesAggregateSelection!
                  seriesConnection(after: String, first: Int, sort: [SeriesSort], where: SeriesWhere): SeriesConnection!
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
                }

                type UpdateSeriesMutationResponse {
                  info: UpdateInfo!
                  series: [Series!]!
                }"
            `);
        });
    });
});
