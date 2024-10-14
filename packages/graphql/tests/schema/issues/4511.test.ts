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

describe("https://github.com/neo4j/graphql/issues/4511", () => {
    test("EventPayload does not generate related nodes Connections", async () => {
        const typeDefs = gql`
            type Movie implements Production @subscription(events: []) @node {
                title: String!
                id: ID @unique
                director: Creature! @relationship(type: "DIRECTED", direction: IN)
            }
            type Series implements Production @node {
                title: String!
                episode: Int!
                id: ID @unique
                director: Creature! @relationship(type: "DIRECTED", direction: IN)
            }
            interface Production {
                id: ID
                director: Creature! @declareRelationship
            }
            type Person implements Creature @node {
                movies: Production! @relationship(type: "DIRECTED", direction: OUT)
            }
            interface Creature {
                movies: Production! @declareRelationship
            }
        `;

        const neoSchema = new Neo4jGraphQL({
            typeDefs,
            features: {
                subscriptions: true,
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
              movies(limit: Int, offset: Int, options: ProductionOptions @deprecated(reason: \\"Query options argument is deprecated, please use pagination arguments like limit, offset and sort instead.\\"), sort: [ProductionSort!], where: ProductionWhere): Production!
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
              count: Int @deprecated(reason: \\"Please use the explicit _EQ version\\")
              count_EQ: Int
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
              id_MAX_EQUAL: ID
              id_MAX_GT: ID
              id_MAX_GTE: ID
              id_MAX_LT: ID
              id_MAX_LTE: ID
              id_MIN_EQUAL: ID
              id_MIN_GT: ID
              id_MIN_GTE: ID
              id_MIN_LT: ID
              id_MIN_LTE: ID
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
              director(directed: Boolean = true @deprecated(reason: \\"The directed argument is deprecated, and the direction of the field will be configured in the GraphQL server\\"), limit: Int, offset: Int, options: CreatureOptions @deprecated(reason: \\"Query options argument is deprecated, please use pagination arguments like limit, offset and sort instead.\\"), where: CreatureWhere): Creature!
              directorAggregate(directed: Boolean = true @deprecated(reason: \\"The directed argument is deprecated, and the direction of the field will be configured in the GraphQL server\\"), where: CreatureWhere): MovieCreatureDirectorAggregationSelection
              directorConnection(after: String, directed: Boolean = true @deprecated(reason: \\"The directed argument is deprecated, and the direction of the field will be configured in the GraphQL server\\"), first: Int, where: ProductionDirectorConnectionWhere): ProductionDirectorConnection!
              id: ID
              title: String!
            }

            type MovieAggregateSelection {
              count: Int!
              id: IDAggregateSelection!
              title: StringAggregateSelection!
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
              count: Int @deprecated(reason: \\"Please use the explicit _EQ version\\")
              count_EQ: Int
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
              id: ID @deprecated(reason: \\"Please use the explicit _EQ version\\")
              id_CONTAINS: ID
              id_ENDS_WITH: ID
              id_EQ: ID
              id_IN: [ID]
              id_STARTS_WITH: ID
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
              createPeople(input: [PersonCreateInput!]!): CreatePeopleMutationResponse!
              createSeries(input: [SeriesCreateInput!]!): CreateSeriesMutationResponse!
              deleteMovies(delete: MovieDeleteInput, where: MovieWhere): DeleteInfo!
              deletePeople(delete: PersonDeleteInput, where: PersonWhere): DeleteInfo!
              deleteSeries(delete: SeriesDeleteInput, where: SeriesWhere): DeleteInfo!
              updateMovies(update: MovieUpdateInput, where: MovieWhere): UpdateMoviesMutationResponse!
              updatePeople(update: PersonUpdateInput, where: PersonWhere): UpdatePeopleMutationResponse!
              updateSeries(update: SeriesUpdateInput, where: SeriesWhere): UpdateSeriesMutationResponse!
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
              movies(directed: Boolean = true @deprecated(reason: \\"The directed argument is deprecated, and the direction of the field will be configured in the GraphQL server\\"), limit: Int, offset: Int, options: ProductionOptions @deprecated(reason: \\"Query options argument is deprecated, please use pagination arguments like limit, offset and sort instead.\\"), sort: [ProductionSort!], where: ProductionWhere): Production!
              moviesAggregate(directed: Boolean = true @deprecated(reason: \\"The directed argument is deprecated, and the direction of the field will be configured in the GraphQL server\\"), where: ProductionWhere): PersonProductionMoviesAggregationSelection
              moviesConnection(after: String, directed: Boolean = true @deprecated(reason: \\"The directed argument is deprecated, and the direction of the field will be configured in the GraphQL server\\"), first: Int, sort: [CreatureMoviesConnectionSort!], where: CreatureMoviesConnectionWhere): CreatureMoviesConnection!
            }

            type PersonAggregateSelection {
              count: Int!
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

            type PersonEdge {
              cursor: String!
              node: Person!
            }

            input PersonMoviesAggregateInput {
              AND: [PersonMoviesAggregateInput!]
              NOT: PersonMoviesAggregateInput
              OR: [PersonMoviesAggregateInput!]
              count: Int @deprecated(reason: \\"Please use the explicit _EQ version\\")
              count_EQ: Int
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
              id_MAX_EQUAL: ID
              id_MAX_GT: ID
              id_MAX_GTE: ID
              id_MAX_LT: ID
              id_MAX_LTE: ID
              id_MIN_EQUAL: ID
              id_MIN_GT: ID
              id_MIN_GTE: ID
              id_MIN_LT: ID
              id_MIN_LTE: ID
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
            }

            interface Production {
              director(limit: Int, offset: Int, options: CreatureOptions @deprecated(reason: \\"Query options argument is deprecated, please use pagination arguments like limit, offset and sort instead.\\"), where: CreatureWhere): Creature!
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
              count: Int @deprecated(reason: \\"Please use the explicit _EQ version\\")
              count_EQ: Int
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
              sort: [ProductionSort!]
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
              id: ID @deprecated(reason: \\"Please use the explicit _EQ version\\")
              id_CONTAINS: ID
              id_ENDS_WITH: ID
              id_EQ: ID
              id_IN: [ID]
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
              id: ID @deprecated(reason: \\"Please use the explicit _EQ version\\")
              id_CONTAINS: ID
              id_ENDS_WITH: ID
              id_EQ: ID
              id_IN: [ID]
              id_STARTS_WITH: ID
              typename_IN: [ProductionImplementation!]
            }

            type ProductionsConnection {
              edges: [ProductionEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            type Query {
              creatures(limit: Int, offset: Int, options: CreatureOptions @deprecated(reason: \\"Query options argument is deprecated, please use pagination arguments like limit, offset and sort instead.\\"), where: CreatureWhere): [Creature!]!
              creaturesAggregate(where: CreatureWhere): CreatureAggregateSelection!
              creaturesConnection(after: String, first: Int, where: CreatureWhere): CreaturesConnection!
              movies(limit: Int, offset: Int, options: MovieOptions @deprecated(reason: \\"Query options argument is deprecated, please use pagination arguments like limit, offset and sort instead.\\"), sort: [MovieSort!], where: MovieWhere): [Movie!]!
              moviesAggregate(where: MovieWhere): MovieAggregateSelection!
              moviesConnection(after: String, first: Int, sort: [MovieSort!], where: MovieWhere): MoviesConnection!
              people(limit: Int, offset: Int, options: PersonOptions @deprecated(reason: \\"Query options argument is deprecated, please use pagination arguments like limit, offset and sort instead.\\"), where: PersonWhere): [Person!]!
              peopleAggregate(where: PersonWhere): PersonAggregateSelection!
              peopleConnection(after: String, first: Int, where: PersonWhere): PeopleConnection!
              productions(limit: Int, offset: Int, options: ProductionOptions @deprecated(reason: \\"Query options argument is deprecated, please use pagination arguments like limit, offset and sort instead.\\"), sort: [ProductionSort!], where: ProductionWhere): [Production!]!
              productionsAggregate(where: ProductionWhere): ProductionAggregateSelection!
              productionsConnection(after: String, first: Int, sort: [ProductionSort!], where: ProductionWhere): ProductionsConnection!
              series(limit: Int, offset: Int, options: SeriesOptions @deprecated(reason: \\"Query options argument is deprecated, please use pagination arguments like limit, offset and sort instead.\\"), sort: [SeriesSort!], where: SeriesWhere): [Series!]!
              seriesAggregate(where: SeriesWhere): SeriesAggregateSelection!
              seriesConnection(after: String, first: Int, sort: [SeriesSort!], where: SeriesWhere): SeriesConnection!
            }

            type Series implements Production {
              director(directed: Boolean = true @deprecated(reason: \\"The directed argument is deprecated, and the direction of the field will be configured in the GraphQL server\\"), limit: Int, offset: Int, options: CreatureOptions @deprecated(reason: \\"Query options argument is deprecated, please use pagination arguments like limit, offset and sort instead.\\"), where: CreatureWhere): Creature!
              directorAggregate(directed: Boolean = true @deprecated(reason: \\"The directed argument is deprecated, and the direction of the field will be configured in the GraphQL server\\"), where: CreatureWhere): SeriesCreatureDirectorAggregationSelection
              directorConnection(after: String, directed: Boolean = true @deprecated(reason: \\"The directed argument is deprecated, and the direction of the field will be configured in the GraphQL server\\"), first: Int, where: ProductionDirectorConnectionWhere): ProductionDirectorConnection!
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
              count: Int @deprecated(reason: \\"Please use the explicit _EQ version\\")
              count_EQ: Int
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
              episode: Int @deprecated(reason: \\"Please use the explicit _EQ version\\")
              episode_EQ: Int
              episode_GT: Int
              episode_GTE: Int
              episode_IN: [Int!]
              episode_LT: Int
              episode_LTE: Int
              id: ID @deprecated(reason: \\"Please use the explicit _EQ version\\")
              id_CONTAINS: ID
              id_ENDS_WITH: ID
              id_EQ: ID
              id_IN: [ID]
              id_STARTS_WITH: ID
              title: String @deprecated(reason: \\"Please use the explicit _EQ version\\")
              title_CONTAINS: String
              title_ENDS_WITH: String
              title_EQ: String
              title_IN: [String!]
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
              episode: Int @deprecated(reason: \\"Please use the explicit _EQ version\\")
              episode_EQ: Int
              episode_GT: Int
              episode_GTE: Int
              episode_IN: [Int!]
              episode_LT: Int
              episode_LTE: Int
              id: ID @deprecated(reason: \\"Please use the explicit _EQ version\\")
              id_CONTAINS: ID
              id_ENDS_WITH: ID
              id_EQ: ID
              id_IN: [ID]
              id_STARTS_WITH: ID
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
