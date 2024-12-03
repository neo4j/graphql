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
import { TestCDCEngine } from "../../utils/builders/TestCDCEngine";

describe("@selectable", () => {
    test("Disable read fields", async () => {
        const typeDefs = gql`
            type Movie @query(aggregate: true) @node {
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

            \\"\\"\\"
            Fields to sort Movies by. The order in which sorts are applied is not guaranteed when specifying many fields in one MovieSort object.
            \\"\\"\\"
            input MovieSort {
              description: SortDirection
              title: SortDirection
            }

            input MovieUpdateInput {
              description: StringScalarMutations
              description_SET: String
              title: StringScalarMutations
              title_SET: String
            }

            input MovieWhere {
              AND: [MovieWhere!]
              NOT: MovieWhere
              OR: [MovieWhere!]
              description: StringScalarFilters
              description_CONTAINS: String
              description_ENDS_WITH: String
              description_EQ: String
              description_IN: [String]
              description_STARTS_WITH: String
              title: StringScalarFilters
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
              movies(limit: Int, offset: Int, sort: [MovieSort!], where: MovieWhere): [Movie!]!
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

            \\"\\"\\"String filters\\"\\"\\"
            input StringScalarFilters {
              contains: String
              endsWith: String
              equals: String
              greaterThan: String
              greaterThanEquals: String
              in: [String!]
              lessThan: String
              lessThanEquals: String
              matches: String
              startsWith: String
            }

            \\"\\"\\"String mutations\\"\\"\\"
            input StringScalarMutations {
              set: String
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

    test("Disable aggregation fields", async () => {
        const typeDefs = gql`
            type Movie @query(aggregate: true) @node {
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

            \\"\\"\\"
            Fields to sort Movies by. The order in which sorts are applied is not guaranteed when specifying many fields in one MovieSort object.
            \\"\\"\\"
            input MovieSort {
              description: SortDirection
              title: SortDirection
            }

            input MovieUpdateInput {
              description: StringScalarMutations
              description_SET: String
              title: StringScalarMutations
              title_SET: String
            }

            input MovieWhere {
              AND: [MovieWhere!]
              NOT: MovieWhere
              OR: [MovieWhere!]
              description: StringScalarFilters
              description_CONTAINS: String
              description_ENDS_WITH: String
              description_EQ: String
              description_IN: [String]
              description_STARTS_WITH: String
              title: StringScalarFilters
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
              movies(limit: Int, offset: Int, sort: [MovieSort!], where: MovieWhere): [Movie!]!
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

            \\"\\"\\"String filters\\"\\"\\"
            input StringScalarFilters {
              contains: String
              endsWith: String
              equals: String
              greaterThan: String
              greaterThanEquals: String
              in: [String!]
              lessThan: String
              lessThanEquals: String
              matches: String
              startsWith: String
            }

            \\"\\"\\"String mutations\\"\\"\\"
            input StringScalarMutations {
              set: String
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

    test("Disable read and aggregate fields", async () => {
        const typeDefs = gql`
            type Movie @query(aggregate: true) @node {
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

            \\"\\"\\"
            Fields to sort Movies by. The order in which sorts are applied is not guaranteed when specifying many fields in one MovieSort object.
            \\"\\"\\"
            input MovieSort {
              description: SortDirection
              title: SortDirection
            }

            input MovieUpdateInput {
              description: StringScalarMutations
              description_SET: String
              title: StringScalarMutations
              title_SET: String
            }

            input MovieWhere {
              AND: [MovieWhere!]
              NOT: MovieWhere
              OR: [MovieWhere!]
              description: StringScalarFilters
              description_CONTAINS: String
              description_ENDS_WITH: String
              description_EQ: String
              description_IN: [String]
              description_STARTS_WITH: String
              title: StringScalarFilters
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
              movies(limit: Int, offset: Int, sort: [MovieSort!], where: MovieWhere): [Movie!]!
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

            \\"\\"\\"String filters\\"\\"\\"
            input StringScalarFilters {
              contains: String
              endsWith: String
              equals: String
              greaterThan: String
              greaterThanEquals: String
              in: [String!]
              lessThan: String
              lessThanEquals: String
              matches: String
              startsWith: String
            }

            \\"\\"\\"String mutations\\"\\"\\"
            input StringScalarMutations {
              set: String
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

    test("Disable read fields on subscriptions", async () => {
        const typeDefs = gql`
            type Movie @query(aggregate: true) @node {
                title: String!
                description: String @selectable(onRead: false, onAggregate: true)
            }
        `;
        const neoSchema = new Neo4jGraphQL({ typeDefs, features: { subscriptions: new TestCDCEngine() } });
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
              description: StringScalarFilters
              description_CONTAINS: String
              description_ENDS_WITH: String
              description_EQ: String
              description_IN: [String]
              description_STARTS_WITH: String
              title: StringScalarFilters
              title_CONTAINS: String
              title_ENDS_WITH: String
              title_EQ: String
              title_IN: [String!]
              title_STARTS_WITH: String
            }

            input MovieUpdateInput {
              description: StringScalarMutations
              description_SET: String
              title: StringScalarMutations
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
              description: StringScalarFilters
              description_CONTAINS: String
              description_ENDS_WITH: String
              description_EQ: String
              description_IN: [String]
              description_STARTS_WITH: String
              title: StringScalarFilters
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
              movies(limit: Int, offset: Int, sort: [MovieSort!], where: MovieWhere): [Movie!]!
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

            \\"\\"\\"String filters\\"\\"\\"
            input StringScalarFilters {
              contains: String
              endsWith: String
              equals: String
              greaterThan: String
              greaterThanEquals: String
              in: [String!]
              lessThan: String
              lessThanEquals: String
              matches: String
              startsWith: String
            }

            \\"\\"\\"String mutations\\"\\"\\"
            input StringScalarMutations {
              set: String
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

    describe("relationships fields to a concrete type", () => {
        test("Disable read on relationship field", async () => {
            const typeDefs = gql`
                type Movie @query(aggregate: true) @node {
                    title: String!
                    description: String
                }

                type Actor @query(aggregate: true) @node {
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
                  actedInAggregate(where: MovieWhere): ActorMovieActedInAggregationSelection
                  name: String!
                }

                input ActorActedInAggregateInput {
                  AND: [ActorActedInAggregateInput!]
                  NOT: ActorActedInAggregateInput
                  OR: [ActorActedInAggregateInput!]
                  count_EQ: Int
                  count_GT: Int
                  count_GTE: Int
                  count_LT: Int
                  count_LTE: Int
                  node: ActorActedInNodeAggregationWhereInput
                }

                input ActorActedInConnectFieldInput {
                  where: MovieConnectWhere
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
                  description_AVERAGE_LENGTH_EQUAL: Float
                  description_AVERAGE_LENGTH_GT: Float
                  description_AVERAGE_LENGTH_GTE: Float
                  description_AVERAGE_LENGTH_LT: Float
                  description_AVERAGE_LENGTH_LTE: Float
                  description_LONGEST_LENGTH_EQUAL: Int
                  description_LONGEST_LENGTH_GT: Int
                  description_LONGEST_LENGTH_GTE: Int
                  description_LONGEST_LENGTH_LT: Int
                  description_LONGEST_LENGTH_LTE: Int
                  description_SHORTEST_LENGTH_EQUAL: Int
                  description_SHORTEST_LENGTH_GT: Int
                  description_SHORTEST_LENGTH_GTE: Int
                  description_SHORTEST_LENGTH_LT: Int
                  description_SHORTEST_LENGTH_LTE: Int
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

                input ActorCreateInput {
                  actedIn: ActorActedInFieldInput
                  name: String!
                }

                input ActorDeleteInput {
                  actedIn: [ActorActedInDeleteFieldInput!]
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

                \\"\\"\\"
                Fields to sort Actors by. The order in which sorts are applied is not guaranteed when specifying many fields in one ActorSort object.
                \\"\\"\\"
                input ActorSort {
                  name: SortDirection
                }

                input ActorUpdateInput {
                  actedIn: [ActorActedInUpdateFieldInput!]
                  name: StringScalarMutations
                  name_SET: String
                }

                input ActorWhere {
                  AND: [ActorWhere!]
                  NOT: ActorWhere
                  OR: [ActorWhere!]
                  actedInAggregate: ActorActedInAggregateInput
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
                  name: StringScalarFilters
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

                \\"\\"\\"
                Fields to sort Movies by. The order in which sorts are applied is not guaranteed when specifying many fields in one MovieSort object.
                \\"\\"\\"
                input MovieSort {
                  description: SortDirection
                  title: SortDirection
                }

                input MovieUpdateInput {
                  description: StringScalarMutations
                  description_SET: String
                  title: StringScalarMutations
                  title_SET: String
                }

                input MovieWhere {
                  AND: [MovieWhere!]
                  NOT: MovieWhere
                  OR: [MovieWhere!]
                  description: StringScalarFilters
                  description_CONTAINS: String
                  description_ENDS_WITH: String
                  description_EQ: String
                  description_IN: [String]
                  description_STARTS_WITH: String
                  title: StringScalarFilters
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
                  actors(limit: Int, offset: Int, sort: [ActorSort!], where: ActorWhere): [Actor!]!
                  actorsAggregate(where: ActorWhere): ActorAggregateSelection!
                  actorsConnection(after: String, first: Int, sort: [ActorSort!], where: ActorWhere): ActorsConnection!
                  movies(limit: Int, offset: Int, sort: [MovieSort!], where: MovieWhere): [Movie!]!
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

                \\"\\"\\"String filters\\"\\"\\"
                input StringScalarFilters {
                  contains: String
                  endsWith: String
                  equals: String
                  greaterThan: String
                  greaterThanEquals: String
                  in: [String!]
                  lessThan: String
                  lessThanEquals: String
                  matches: String
                  startsWith: String
                }

                \\"\\"\\"String mutations\\"\\"\\"
                input StringScalarMutations {
                  set: String
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
        test("Disable aggregation on relationship field (no-op as controlled by @relationship(aggregate: false))", async () => {
            const typeDefs = gql`
                type Movie @query(aggregate: true) @node {
                    title: String!
                    description: String
                }

                type Actor @query(aggregate: true) @node {
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
                  actedIn(limit: Int, offset: Int, sort: [MovieSort!], where: MovieWhere): [Movie!]!
                  actedInAggregate(where: MovieWhere): ActorMovieActedInAggregationSelection
                  actedInConnection(after: String, first: Int, sort: [ActorActedInConnectionSort!], where: ActorActedInConnectionWhere): ActorActedInConnection!
                  name: String!
                }

                input ActorActedInAggregateInput {
                  AND: [ActorActedInAggregateInput!]
                  NOT: ActorActedInAggregateInput
                  OR: [ActorActedInAggregateInput!]
                  count_EQ: Int
                  count_GT: Int
                  count_GTE: Int
                  count_LT: Int
                  count_LTE: Int
                  node: ActorActedInNodeAggregationWhereInput
                }

                input ActorActedInConnectFieldInput {
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
                  description_AVERAGE_LENGTH_EQUAL: Float
                  description_AVERAGE_LENGTH_GT: Float
                  description_AVERAGE_LENGTH_GTE: Float
                  description_AVERAGE_LENGTH_LT: Float
                  description_AVERAGE_LENGTH_LTE: Float
                  description_LONGEST_LENGTH_EQUAL: Int
                  description_LONGEST_LENGTH_GT: Int
                  description_LONGEST_LENGTH_GTE: Int
                  description_LONGEST_LENGTH_LT: Int
                  description_LONGEST_LENGTH_LTE: Int
                  description_SHORTEST_LENGTH_EQUAL: Int
                  description_SHORTEST_LENGTH_GT: Int
                  description_SHORTEST_LENGTH_GTE: Int
                  description_SHORTEST_LENGTH_LT: Int
                  description_SHORTEST_LENGTH_LTE: Int
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

                input ActorCreateInput {
                  actedIn: ActorActedInFieldInput
                  name: String!
                }

                input ActorDeleteInput {
                  actedIn: [ActorActedInDeleteFieldInput!]
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

                \\"\\"\\"
                Fields to sort Actors by. The order in which sorts are applied is not guaranteed when specifying many fields in one ActorSort object.
                \\"\\"\\"
                input ActorSort {
                  name: SortDirection
                }

                input ActorUpdateInput {
                  actedIn: [ActorActedInUpdateFieldInput!]
                  name: StringScalarMutations
                  name_SET: String
                }

                input ActorWhere {
                  AND: [ActorWhere!]
                  NOT: ActorWhere
                  OR: [ActorWhere!]
                  actedInAggregate: ActorActedInAggregateInput
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
                  name: StringScalarFilters
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

                \\"\\"\\"
                Fields to sort Movies by. The order in which sorts are applied is not guaranteed when specifying many fields in one MovieSort object.
                \\"\\"\\"
                input MovieSort {
                  description: SortDirection
                  title: SortDirection
                }

                input MovieUpdateInput {
                  description: StringScalarMutations
                  description_SET: String
                  title: StringScalarMutations
                  title_SET: String
                }

                input MovieWhere {
                  AND: [MovieWhere!]
                  NOT: MovieWhere
                  OR: [MovieWhere!]
                  description: StringScalarFilters
                  description_CONTAINS: String
                  description_ENDS_WITH: String
                  description_EQ: String
                  description_IN: [String]
                  description_STARTS_WITH: String
                  title: StringScalarFilters
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
                  actors(limit: Int, offset: Int, sort: [ActorSort!], where: ActorWhere): [Actor!]!
                  actorsAggregate(where: ActorWhere): ActorAggregateSelection!
                  actorsConnection(after: String, first: Int, sort: [ActorSort!], where: ActorWhere): ActorsConnection!
                  movies(limit: Int, offset: Int, sort: [MovieSort!], where: MovieWhere): [Movie!]!
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

                \\"\\"\\"String filters\\"\\"\\"
                input StringScalarFilters {
                  contains: String
                  endsWith: String
                  equals: String
                  greaterThan: String
                  greaterThanEquals: String
                  in: [String!]
                  lessThan: String
                  lessThanEquals: String
                  matches: String
                  startsWith: String
                }

                \\"\\"\\"String mutations\\"\\"\\"
                input StringScalarMutations {
                  set: String
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

    describe("relationships fields to a union type", () => {
        test("Disable read on relationship field", async () => {
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

                input ActorActedInConnectionWhere {
                  Movie: ActorActedInMovieConnectionWhere
                  Series: ActorActedInSeriesConnectionWhere
                }

                input ActorActedInCreateInput {
                  Movie: ActorActedInMovieFieldInput
                  Series: ActorActedInSeriesFieldInput
                }

                input ActorActedInDeleteInput {
                  Movie: [ActorActedInMovieDeleteFieldInput!]
                  Series: [ActorActedInSeriesDeleteFieldInput!]
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

                input ActorCreateInput {
                  actedIn: ActorActedInCreateInput
                  name: String!
                }

                input ActorDeleteInput {
                  actedIn: ActorActedInDeleteInput
                }

                type ActorEdge {
                  cursor: String!
                  node: Actor!
                }

                \\"\\"\\"
                Fields to sort Actors by. The order in which sorts are applied is not guaranteed when specifying many fields in one ActorSort object.
                \\"\\"\\"
                input ActorSort {
                  name: SortDirection
                }

                input ActorUpdateInput {
                  actedIn: ActorActedInUpdateInput
                  name: StringScalarMutations
                  name_SET: String
                }

                input ActorWhere {
                  AND: [ActorWhere!]
                  NOT: ActorWhere
                  OR: [ActorWhere!]
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
                  name: StringScalarFilters
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

                \\"\\"\\"
                Fields to sort Movies by. The order in which sorts are applied is not guaranteed when specifying many fields in one MovieSort object.
                \\"\\"\\"
                input MovieSort {
                  description: SortDirection
                  title: SortDirection
                }

                input MovieUpdateInput {
                  description: StringScalarMutations
                  description_SET: String
                  title: StringScalarMutations
                  title_SET: String
                }

                input MovieWhere {
                  AND: [MovieWhere!]
                  NOT: MovieWhere
                  OR: [MovieWhere!]
                  description: StringScalarFilters
                  description_CONTAINS: String
                  description_ENDS_WITH: String
                  description_EQ: String
                  description_IN: [String]
                  description_STARTS_WITH: String
                  title: StringScalarFilters
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
                  updateActors(update: ActorUpdateInput, where: ActorWhere): UpdateActorsMutationResponse!
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
                  actors(limit: Int, offset: Int, sort: [ActorSort!], where: ActorWhere): [Actor!]!
                  actorsAggregate(where: ActorWhere): ActorAggregateSelection!
                  actorsConnection(after: String, first: Int, sort: [ActorSort!], where: ActorWhere): ActorsConnection!
                  movies(limit: Int, offset: Int, sort: [MovieSort!], where: MovieWhere): [Movie!]!
                  moviesAggregate(where: MovieWhere): MovieAggregateSelection!
                  moviesConnection(after: String, first: Int, sort: [MovieSort!], where: MovieWhere): MoviesConnection!
                  productions(limit: Int, offset: Int, where: ProductionWhere): [Production!]!
                  series(limit: Int, offset: Int, sort: [SeriesSort!], where: SeriesWhere): [Series!]!
                  seriesAggregate(where: SeriesWhere): SeriesAggregateSelection!
                  seriesConnection(after: String, first: Int, sort: [SeriesSort!], where: SeriesWhere): SeriesConnection!
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

                \\"\\"\\"
                Fields to sort Series by. The order in which sorts are applied is not guaranteed when specifying many fields in one SeriesSort object.
                \\"\\"\\"
                input SeriesSort {
                  description: SortDirection
                  name: SortDirection
                }

                input SeriesUpdateInput {
                  description: StringScalarMutations
                  description_SET: String
                  name: StringScalarMutations
                  name_SET: String
                }

                input SeriesWhere {
                  AND: [SeriesWhere!]
                  NOT: SeriesWhere
                  OR: [SeriesWhere!]
                  description: StringScalarFilters
                  description_CONTAINS: String
                  description_ENDS_WITH: String
                  description_EQ: String
                  description_IN: [String]
                  description_STARTS_WITH: String
                  name: StringScalarFilters
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

                \\"\\"\\"String filters\\"\\"\\"
                input StringScalarFilters {
                  contains: String
                  endsWith: String
                  equals: String
                  greaterThan: String
                  greaterThanEquals: String
                  in: [String!]
                  lessThan: String
                  lessThanEquals: String
                  matches: String
                  startsWith: String
                }

                \\"\\"\\"String mutations\\"\\"\\"
                input StringScalarMutations {
                  set: String
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
        test("Disable aggregation on relationship field (no-op as controlled by @relationship(aggregate: false))", async () => {
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
                  actedIn(limit: Int, offset: Int, where: ProductionWhere): [Production!]!
                  actedInConnection(after: String, first: Int, where: ActorActedInConnectionWhere): ActorActedInConnection!
                  name: String!
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

                input ActorActedInCreateInput {
                  Movie: ActorActedInMovieFieldInput
                  Series: ActorActedInSeriesFieldInput
                }

                input ActorActedInDeleteInput {
                  Movie: [ActorActedInMovieDeleteFieldInput!]
                  Series: [ActorActedInSeriesDeleteFieldInput!]
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

                input ActorCreateInput {
                  actedIn: ActorActedInCreateInput
                  name: String!
                }

                input ActorDeleteInput {
                  actedIn: ActorActedInDeleteInput
                }

                type ActorEdge {
                  cursor: String!
                  node: Actor!
                }

                \\"\\"\\"
                Fields to sort Actors by. The order in which sorts are applied is not guaranteed when specifying many fields in one ActorSort object.
                \\"\\"\\"
                input ActorSort {
                  name: SortDirection
                }

                input ActorUpdateInput {
                  actedIn: ActorActedInUpdateInput
                  name: StringScalarMutations
                  name_SET: String
                }

                input ActorWhere {
                  AND: [ActorWhere!]
                  NOT: ActorWhere
                  OR: [ActorWhere!]
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
                  name: StringScalarFilters
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

                \\"\\"\\"
                Fields to sort Movies by. The order in which sorts are applied is not guaranteed when specifying many fields in one MovieSort object.
                \\"\\"\\"
                input MovieSort {
                  description: SortDirection
                  title: SortDirection
                }

                input MovieUpdateInput {
                  description: StringScalarMutations
                  description_SET: String
                  title: StringScalarMutations
                  title_SET: String
                }

                input MovieWhere {
                  AND: [MovieWhere!]
                  NOT: MovieWhere
                  OR: [MovieWhere!]
                  description: StringScalarFilters
                  description_CONTAINS: String
                  description_ENDS_WITH: String
                  description_EQ: String
                  description_IN: [String]
                  description_STARTS_WITH: String
                  title: StringScalarFilters
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
                  updateActors(update: ActorUpdateInput, where: ActorWhere): UpdateActorsMutationResponse!
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
                  actors(limit: Int, offset: Int, sort: [ActorSort!], where: ActorWhere): [Actor!]!
                  actorsAggregate(where: ActorWhere): ActorAggregateSelection!
                  actorsConnection(after: String, first: Int, sort: [ActorSort!], where: ActorWhere): ActorsConnection!
                  movies(limit: Int, offset: Int, sort: [MovieSort!], where: MovieWhere): [Movie!]!
                  moviesAggregate(where: MovieWhere): MovieAggregateSelection!
                  moviesConnection(after: String, first: Int, sort: [MovieSort!], where: MovieWhere): MoviesConnection!
                  productions(limit: Int, offset: Int, where: ProductionWhere): [Production!]!
                  series(limit: Int, offset: Int, sort: [SeriesSort!], where: SeriesWhere): [Series!]!
                  seriesAggregate(where: SeriesWhere): SeriesAggregateSelection!
                  seriesConnection(after: String, first: Int, sort: [SeriesSort!], where: SeriesWhere): SeriesConnection!
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

                \\"\\"\\"
                Fields to sort Series by. The order in which sorts are applied is not guaranteed when specifying many fields in one SeriesSort object.
                \\"\\"\\"
                input SeriesSort {
                  description: SortDirection
                  name: SortDirection
                }

                input SeriesUpdateInput {
                  description: StringScalarMutations
                  description_SET: String
                  name: StringScalarMutations
                  name_SET: String
                }

                input SeriesWhere {
                  AND: [SeriesWhere!]
                  NOT: SeriesWhere
                  OR: [SeriesWhere!]
                  description: StringScalarFilters
                  description_CONTAINS: String
                  description_ENDS_WITH: String
                  description_EQ: String
                  description_IN: [String]
                  description_STARTS_WITH: String
                  name: StringScalarFilters
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

                \\"\\"\\"String filters\\"\\"\\"
                input StringScalarFilters {
                  contains: String
                  endsWith: String
                  equals: String
                  greaterThan: String
                  greaterThanEquals: String
                  in: [String!]
                  lessThan: String
                  lessThanEquals: String
                  matches: String
                  startsWith: String
                }

                \\"\\"\\"String mutations\\"\\"\\"
                input StringScalarMutations {
                  set: String
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

    describe("relationships fields to an interface type", () => {
        test("Disable read on relationship field", async () => {
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
                  actedInAggregate(where: ProductionWhere): ActorProductionActedInAggregationSelection
                  name: String!
                }

                input ActorActedInAggregateInput {
                  AND: [ActorActedInAggregateInput!]
                  NOT: ActorActedInAggregateInput
                  OR: [ActorActedInAggregateInput!]
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
                  description_AVERAGE_LENGTH_EQUAL: Float
                  description_AVERAGE_LENGTH_GT: Float
                  description_AVERAGE_LENGTH_GTE: Float
                  description_AVERAGE_LENGTH_LT: Float
                  description_AVERAGE_LENGTH_LTE: Float
                  description_LONGEST_LENGTH_EQUAL: Int
                  description_LONGEST_LENGTH_GT: Int
                  description_LONGEST_LENGTH_GTE: Int
                  description_LONGEST_LENGTH_LT: Int
                  description_LONGEST_LENGTH_LTE: Int
                  description_SHORTEST_LENGTH_EQUAL: Int
                  description_SHORTEST_LENGTH_GT: Int
                  description_SHORTEST_LENGTH_GTE: Int
                  description_SHORTEST_LENGTH_LT: Int
                  description_SHORTEST_LENGTH_LTE: Int
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

                input ActorCreateInput {
                  actedIn: ActorActedInFieldInput
                  name: String!
                }

                input ActorDeleteInput {
                  actedIn: [ActorActedInDeleteFieldInput!]
                }

                type ActorEdge {
                  cursor: String!
                  node: Actor!
                }

                type ActorProductionActedInAggregationSelection {
                  count: Int!
                  node: ActorProductionActedInNodeAggregateSelection
                }

                type ActorProductionActedInNodeAggregateSelection {
                  description: StringAggregateSelection!
                  title: StringAggregateSelection!
                }

                \\"\\"\\"
                Fields to sort Actors by. The order in which sorts are applied is not guaranteed when specifying many fields in one ActorSort object.
                \\"\\"\\"
                input ActorSort {
                  name: SortDirection
                }

                input ActorUpdateInput {
                  actedIn: [ActorActedInUpdateFieldInput!]
                  name: StringScalarMutations
                  name_SET: String
                }

                input ActorWhere {
                  AND: [ActorWhere!]
                  NOT: ActorWhere
                  OR: [ActorWhere!]
                  actedInAggregate: ActorActedInAggregateInput
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
                  name: StringScalarFilters
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

                \\"\\"\\"
                Fields to sort Movies by. The order in which sorts are applied is not guaranteed when specifying many fields in one MovieSort object.
                \\"\\"\\"
                input MovieSort {
                  description: SortDirection
                  title: SortDirection
                }

                input MovieUpdateInput {
                  description: StringScalarMutations
                  description_SET: String
                  title: StringScalarMutations
                  title_SET: String
                }

                input MovieWhere {
                  AND: [MovieWhere!]
                  NOT: MovieWhere
                  OR: [MovieWhere!]
                  description: StringScalarFilters
                  description_CONTAINS: String
                  description_ENDS_WITH: String
                  description_EQ: String
                  description_IN: [String]
                  description_STARTS_WITH: String
                  title: StringScalarFilters
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
                  updateActors(update: ActorUpdateInput, where: ActorWhere): UpdateActorsMutationResponse!
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

                \\"\\"\\"
                Fields to sort Productions by. The order in which sorts are applied is not guaranteed when specifying many fields in one ProductionSort object.
                \\"\\"\\"
                input ProductionSort {
                  description: SortDirection
                  title: SortDirection
                }

                input ProductionUpdateInput {
                  description: StringScalarMutations
                  description_SET: String
                  title: StringScalarMutations
                  title_SET: String
                }

                input ProductionWhere {
                  AND: [ProductionWhere!]
                  NOT: ProductionWhere
                  OR: [ProductionWhere!]
                  description: StringScalarFilters
                  description_CONTAINS: String
                  description_ENDS_WITH: String
                  description_EQ: String
                  description_IN: [String]
                  description_STARTS_WITH: String
                  title: StringScalarFilters
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
                  actors(limit: Int, offset: Int, sort: [ActorSort!], where: ActorWhere): [Actor!]!
                  actorsAggregate(where: ActorWhere): ActorAggregateSelection!
                  actorsConnection(after: String, first: Int, sort: [ActorSort!], where: ActorWhere): ActorsConnection!
                  movies(limit: Int, offset: Int, sort: [MovieSort!], where: MovieWhere): [Movie!]!
                  moviesAggregate(where: MovieWhere): MovieAggregateSelection!
                  moviesConnection(after: String, first: Int, sort: [MovieSort!], where: MovieWhere): MoviesConnection!
                  productions(limit: Int, offset: Int, sort: [ProductionSort!], where: ProductionWhere): [Production!]!
                  productionsAggregate(where: ProductionWhere): ProductionAggregateSelection!
                  productionsConnection(after: String, first: Int, sort: [ProductionSort!], where: ProductionWhere): ProductionsConnection!
                  series(limit: Int, offset: Int, sort: [SeriesSort!], where: SeriesWhere): [Series!]!
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

                \\"\\"\\"
                Fields to sort Series by. The order in which sorts are applied is not guaranteed when specifying many fields in one SeriesSort object.
                \\"\\"\\"
                input SeriesSort {
                  description: SortDirection
                  title: SortDirection
                }

                input SeriesUpdateInput {
                  description: StringScalarMutations
                  description_SET: String
                  title: StringScalarMutations
                  title_SET: String
                }

                input SeriesWhere {
                  AND: [SeriesWhere!]
                  NOT: SeriesWhere
                  OR: [SeriesWhere!]
                  description: StringScalarFilters
                  description_CONTAINS: String
                  description_ENDS_WITH: String
                  description_EQ: String
                  description_IN: [String]
                  description_STARTS_WITH: String
                  title: StringScalarFilters
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

                \\"\\"\\"String filters\\"\\"\\"
                input StringScalarFilters {
                  contains: String
                  endsWith: String
                  equals: String
                  greaterThan: String
                  greaterThanEquals: String
                  in: [String!]
                  lessThan: String
                  lessThanEquals: String
                  matches: String
                  startsWith: String
                }

                \\"\\"\\"String mutations\\"\\"\\"
                input StringScalarMutations {
                  set: String
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
        test("Disable aggregation on relationship field (no-op as controlled by @relationship(aggregate: false))", async () => {
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
                  actedIn(limit: Int, offset: Int, sort: [ProductionSort!], where: ProductionWhere): [Production!]!
                  actedInAggregate(where: ProductionWhere): ActorProductionActedInAggregationSelection
                  actedInConnection(after: String, first: Int, sort: [ActorActedInConnectionSort!], where: ActorActedInConnectionWhere): ActorActedInConnection!
                  name: String!
                }

                input ActorActedInAggregateInput {
                  AND: [ActorActedInAggregateInput!]
                  NOT: ActorActedInAggregateInput
                  OR: [ActorActedInAggregateInput!]
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
                  description_AVERAGE_LENGTH_EQUAL: Float
                  description_AVERAGE_LENGTH_GT: Float
                  description_AVERAGE_LENGTH_GTE: Float
                  description_AVERAGE_LENGTH_LT: Float
                  description_AVERAGE_LENGTH_LTE: Float
                  description_LONGEST_LENGTH_EQUAL: Int
                  description_LONGEST_LENGTH_GT: Int
                  description_LONGEST_LENGTH_GTE: Int
                  description_LONGEST_LENGTH_LT: Int
                  description_LONGEST_LENGTH_LTE: Int
                  description_SHORTEST_LENGTH_EQUAL: Int
                  description_SHORTEST_LENGTH_GT: Int
                  description_SHORTEST_LENGTH_GTE: Int
                  description_SHORTEST_LENGTH_LT: Int
                  description_SHORTEST_LENGTH_LTE: Int
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

                input ActorCreateInput {
                  actedIn: ActorActedInFieldInput
                  name: String!
                }

                input ActorDeleteInput {
                  actedIn: [ActorActedInDeleteFieldInput!]
                }

                type ActorEdge {
                  cursor: String!
                  node: Actor!
                }

                type ActorProductionActedInAggregationSelection {
                  count: Int!
                  node: ActorProductionActedInNodeAggregateSelection
                }

                type ActorProductionActedInNodeAggregateSelection {
                  description: StringAggregateSelection!
                  title: StringAggregateSelection!
                }

                \\"\\"\\"
                Fields to sort Actors by. The order in which sorts are applied is not guaranteed when specifying many fields in one ActorSort object.
                \\"\\"\\"
                input ActorSort {
                  name: SortDirection
                }

                input ActorUpdateInput {
                  actedIn: [ActorActedInUpdateFieldInput!]
                  name: StringScalarMutations
                  name_SET: String
                }

                input ActorWhere {
                  AND: [ActorWhere!]
                  NOT: ActorWhere
                  OR: [ActorWhere!]
                  actedInAggregate: ActorActedInAggregateInput
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
                  name: StringScalarFilters
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

                \\"\\"\\"
                Fields to sort Movies by. The order in which sorts are applied is not guaranteed when specifying many fields in one MovieSort object.
                \\"\\"\\"
                input MovieSort {
                  description: SortDirection
                  title: SortDirection
                }

                input MovieUpdateInput {
                  description: StringScalarMutations
                  description_SET: String
                  title: StringScalarMutations
                  title_SET: String
                }

                input MovieWhere {
                  AND: [MovieWhere!]
                  NOT: MovieWhere
                  OR: [MovieWhere!]
                  description: StringScalarFilters
                  description_CONTAINS: String
                  description_ENDS_WITH: String
                  description_EQ: String
                  description_IN: [String]
                  description_STARTS_WITH: String
                  title: StringScalarFilters
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
                  updateActors(update: ActorUpdateInput, where: ActorWhere): UpdateActorsMutationResponse!
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

                \\"\\"\\"
                Fields to sort Productions by. The order in which sorts are applied is not guaranteed when specifying many fields in one ProductionSort object.
                \\"\\"\\"
                input ProductionSort {
                  description: SortDirection
                  title: SortDirection
                }

                input ProductionUpdateInput {
                  description: StringScalarMutations
                  description_SET: String
                  title: StringScalarMutations
                  title_SET: String
                }

                input ProductionWhere {
                  AND: [ProductionWhere!]
                  NOT: ProductionWhere
                  OR: [ProductionWhere!]
                  description: StringScalarFilters
                  description_CONTAINS: String
                  description_ENDS_WITH: String
                  description_EQ: String
                  description_IN: [String]
                  description_STARTS_WITH: String
                  title: StringScalarFilters
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
                  actors(limit: Int, offset: Int, sort: [ActorSort!], where: ActorWhere): [Actor!]!
                  actorsAggregate(where: ActorWhere): ActorAggregateSelection!
                  actorsConnection(after: String, first: Int, sort: [ActorSort!], where: ActorWhere): ActorsConnection!
                  movies(limit: Int, offset: Int, sort: [MovieSort!], where: MovieWhere): [Movie!]!
                  moviesAggregate(where: MovieWhere): MovieAggregateSelection!
                  moviesConnection(after: String, first: Int, sort: [MovieSort!], where: MovieWhere): MoviesConnection!
                  productions(limit: Int, offset: Int, sort: [ProductionSort!], where: ProductionWhere): [Production!]!
                  productionsAggregate(where: ProductionWhere): ProductionAggregateSelection!
                  productionsConnection(after: String, first: Int, sort: [ProductionSort!], where: ProductionWhere): ProductionsConnection!
                  series(limit: Int, offset: Int, sort: [SeriesSort!], where: SeriesWhere): [Series!]!
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

                \\"\\"\\"
                Fields to sort Series by. The order in which sorts are applied is not guaranteed when specifying many fields in one SeriesSort object.
                \\"\\"\\"
                input SeriesSort {
                  description: SortDirection
                  title: SortDirection
                }

                input SeriesUpdateInput {
                  description: StringScalarMutations
                  description_SET: String
                  title: StringScalarMutations
                  title_SET: String
                }

                input SeriesWhere {
                  AND: [SeriesWhere!]
                  NOT: SeriesWhere
                  OR: [SeriesWhere!]
                  description: StringScalarFilters
                  description_CONTAINS: String
                  description_ENDS_WITH: String
                  description_EQ: String
                  description_IN: [String]
                  description_STARTS_WITH: String
                  title: StringScalarFilters
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

                \\"\\"\\"String filters\\"\\"\\"
                input StringScalarFilters {
                  contains: String
                  endsWith: String
                  equals: String
                  greaterThan: String
                  greaterThanEquals: String
                  in: [String!]
                  lessThan: String
                  lessThanEquals: String
                  matches: String
                  startsWith: String
                }

                \\"\\"\\"String mutations\\"\\"\\"
                input StringScalarMutations {
                  set: String
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
