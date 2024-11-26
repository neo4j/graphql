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

describe("https://github.com/neo4j/graphql/issues/4511", () => {
    test("EventPayload does not generate related nodes Connections", async () => {
        const typeDefs = gql`
            type Movie implements Production @subscription(events: []) @node {
                title: String!
                id: ID
                director: [Creature!]! @relationship(type: "DIRECTED", direction: IN)
            }
            type Series implements Production @node {
                title: String!
                episode: Int!
                id: ID
                director: [Creature!]! @relationship(type: "DIRECTED", direction: IN)
            }
            interface Production {
                id: ID
                director: [Creature!]! @declareRelationship
            }
            type Person implements Creature @node {
                movies: [Production!]! @relationship(type: "DIRECTED", direction: OUT)
            }
            interface Creature {
                movies: [Production!]! @declareRelationship
            }
        `;

        const neoSchema = new Neo4jGraphQL({
            typeDefs,
            features: {
                subscriptions: new TestCDCEngine(),
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
              movies(limit: Int, offset: Int, sort: [ProductionSort!], where: ProductionWhere): [Production!]!
              moviesConnection(after: String, first: Int, sort: [CreatureMoviesConnectionSort!], where: CreatureMoviesConnectionWhere): CreatureMoviesConnection!
            }

            type CreatureAggregateSelection {
              count: Int!
            }

            input CreatureConnectInput {
              movies: [CreatureMoviesConnectFieldInput!]
            }

            input CreatureConnectWhere {
              node: CreatureWhere!
            }

            input CreatureCreateInput {
              Person: PersonCreateInput
            }

            input CreatureDeleteInput {
              movies: [CreatureMoviesDeleteFieldInput!]
            }

            input CreatureDisconnectInput {
              movies: [CreatureMoviesDisconnectFieldInput!]
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
              connect: [CreatureMoviesConnectFieldInput!]
              create: [CreatureMoviesCreateFieldInput!]
              delete: [CreatureMoviesDeleteFieldInput!]
              disconnect: [CreatureMoviesDisconnectFieldInput!]
              update: CreatureMoviesUpdateConnectionInput
              where: CreatureMoviesConnectionWhere
            }

            input CreatureUpdateInput {
              movies: [CreatureMoviesUpdateFieldInput!]
            }

            input CreatureWhere {
              AND: [CreatureWhere!]
              NOT: CreatureWhere
              OR: [CreatureWhere!]
              moviesAggregate: CreatureMoviesAggregateInput
              \\"\\"\\"
              Return Creatures where all of the related CreatureMoviesConnections match this filter
              \\"\\"\\"
              moviesConnection_ALL: CreatureMoviesConnectionWhere
              \\"\\"\\"
              Return Creatures where none of the related CreatureMoviesConnections match this filter
              \\"\\"\\"
              moviesConnection_NONE: CreatureMoviesConnectionWhere
              \\"\\"\\"
              Return Creatures where one of the related CreatureMoviesConnections match this filter
              \\"\\"\\"
              moviesConnection_SINGLE: CreatureMoviesConnectionWhere
              \\"\\"\\"
              Return Creatures where some of the related CreatureMoviesConnections match this filter
              \\"\\"\\"
              moviesConnection_SOME: CreatureMoviesConnectionWhere
              \\"\\"\\"
              Return Creatures where all of the related Productions match this filter
              \\"\\"\\"
              movies_ALL: ProductionWhere
              \\"\\"\\"
              Return Creatures where none of the related Productions match this filter
              \\"\\"\\"
              movies_NONE: ProductionWhere
              \\"\\"\\"
              Return Creatures where one of the related Productions match this filter
              \\"\\"\\"
              movies_SINGLE: ProductionWhere
              \\"\\"\\"
              Return Creatures where some of the related Productions match this filter
              \\"\\"\\"
              movies_SOME: ProductionWhere
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

            \\"\\"\\"ID filters\\"\\"\\"
            input IDScalarFilters {
              contains: ID
              endsWith: ID
              equals: ID
              greaterThan: ID
              greaterThanEquals: ID
              in: [ID!]
              lessThan: ID
              lessThanEquals: ID
              matches: ID
              startsWith: ID
            }

            type IntAggregateSelection {
              average: Float
              max: Int
              min: Int
              sum: Int
            }

            \\"\\"\\"Int filters\\"\\"\\"
            input IntScalarFilters {
              equals: Int
              greaterThan: Int
              greaterThanEquals: Int
              in: [Int!]
              lessThan: Int
              lessThanEquals: Int
            }

            type Movie implements Production {
              director(limit: Int, offset: Int, where: CreatureWhere): [Creature!]!
              directorAggregate(where: CreatureWhere): MovieCreatureDirectorAggregationSelection
              directorConnection(after: String, first: Int, where: ProductionDirectorConnectionWhere): ProductionDirectorConnection!
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
              director: [MovieDirectorDeleteFieldInput!]
            }

            input MovieDirectorAggregateInput {
              AND: [MovieDirectorAggregateInput!]
              NOT: MovieDirectorAggregateInput
              OR: [MovieDirectorAggregateInput!]
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
              connect: [MovieDirectorConnectFieldInput!]
              create: [MovieDirectorCreateFieldInput!]
            }

            input MovieDirectorUpdateConnectionInput {
              node: CreatureUpdateInput
            }

            input MovieDirectorUpdateFieldInput {
              connect: [MovieDirectorConnectFieldInput!]
              create: [MovieDirectorCreateFieldInput!]
              delete: [MovieDirectorDeleteFieldInput!]
              disconnect: [MovieDirectorDisconnectFieldInput!]
              update: MovieDirectorUpdateConnectionInput
              where: ProductionDirectorConnectionWhere
            }

            type MovieEdge {
              cursor: String!
              node: Movie!
            }

            \\"\\"\\"
            Fields to sort Movies by. The order in which sorts are applied is not guaranteed when specifying many fields in one MovieSort object.
            \\"\\"\\"
            input MovieSort {
              id: SortDirection
              title: SortDirection
            }

            input MovieUpdateInput {
              director: [MovieDirectorUpdateFieldInput!]
              id_SET: ID
              title_SET: String
            }

            input MovieWhere {
              AND: [MovieWhere!]
              NOT: MovieWhere
              OR: [MovieWhere!]
              directorAggregate: MovieDirectorAggregateInput
              \\"\\"\\"
              Return Movies where all of the related ProductionDirectorConnections match this filter
              \\"\\"\\"
              directorConnection_ALL: ProductionDirectorConnectionWhere
              \\"\\"\\"
              Return Movies where none of the related ProductionDirectorConnections match this filter
              \\"\\"\\"
              directorConnection_NONE: ProductionDirectorConnectionWhere
              \\"\\"\\"
              Return Movies where one of the related ProductionDirectorConnections match this filter
              \\"\\"\\"
              directorConnection_SINGLE: ProductionDirectorConnectionWhere
              \\"\\"\\"
              Return Movies where some of the related ProductionDirectorConnections match this filter
              \\"\\"\\"
              directorConnection_SOME: ProductionDirectorConnectionWhere
              \\"\\"\\"Return Movies where all of the related Creatures match this filter\\"\\"\\"
              director_ALL: CreatureWhere
              \\"\\"\\"Return Movies where none of the related Creatures match this filter\\"\\"\\"
              director_NONE: CreatureWhere
              \\"\\"\\"Return Movies where one of the related Creatures match this filter\\"\\"\\"
              director_SINGLE: CreatureWhere
              \\"\\"\\"Return Movies where some of the related Creatures match this filter\\"\\"\\"
              director_SOME: CreatureWhere
              id: IDScalarFilters
              id_CONTAINS: ID
              id_ENDS_WITH: ID
              id_EQ: ID
              id_IN: [ID]
              id_STARTS_WITH: ID
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
              movies(limit: Int, offset: Int, sort: [ProductionSort!], where: ProductionWhere): [Production!]!
              moviesAggregate(where: ProductionWhere): PersonProductionMoviesAggregationSelection
              moviesConnection(after: String, first: Int, sort: [CreatureMoviesConnectionSort!], where: CreatureMoviesConnectionWhere): CreatureMoviesConnection!
            }

            type PersonAggregateSelection {
              count: Int!
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

            type PersonEdge {
              cursor: String!
              node: Person!
            }

            input PersonMoviesAggregateInput {
              AND: [PersonMoviesAggregateInput!]
              NOT: PersonMoviesAggregateInput
              OR: [PersonMoviesAggregateInput!]
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
              connect: [PersonMoviesConnectFieldInput!]
              create: [PersonMoviesCreateFieldInput!]
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

            input PersonMoviesUpdateConnectionInput {
              node: ProductionUpdateInput
            }

            input PersonMoviesUpdateFieldInput {
              connect: [PersonMoviesConnectFieldInput!]
              create: [PersonMoviesCreateFieldInput!]
              delete: [PersonMoviesDeleteFieldInput!]
              disconnect: [PersonMoviesDisconnectFieldInput!]
              update: PersonMoviesUpdateConnectionInput
              where: CreatureMoviesConnectionWhere
            }

            type PersonProductionMoviesAggregationSelection {
              count: Int!
              node: PersonProductionMoviesNodeAggregateSelection
            }

            type PersonProductionMoviesNodeAggregateSelection {
              id: IDAggregateSelection!
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
              moviesAggregate: PersonMoviesAggregateInput
              \\"\\"\\"
              Return People where all of the related CreatureMoviesConnections match this filter
              \\"\\"\\"
              moviesConnection_ALL: CreatureMoviesConnectionWhere
              \\"\\"\\"
              Return People where none of the related CreatureMoviesConnections match this filter
              \\"\\"\\"
              moviesConnection_NONE: CreatureMoviesConnectionWhere
              \\"\\"\\"
              Return People where one of the related CreatureMoviesConnections match this filter
              \\"\\"\\"
              moviesConnection_SINGLE: CreatureMoviesConnectionWhere
              \\"\\"\\"
              Return People where some of the related CreatureMoviesConnections match this filter
              \\"\\"\\"
              moviesConnection_SOME: CreatureMoviesConnectionWhere
              \\"\\"\\"Return People where all of the related Productions match this filter\\"\\"\\"
              movies_ALL: ProductionWhere
              \\"\\"\\"Return People where none of the related Productions match this filter\\"\\"\\"
              movies_NONE: ProductionWhere
              \\"\\"\\"Return People where one of the related Productions match this filter\\"\\"\\"
              movies_SINGLE: ProductionWhere
              \\"\\"\\"Return People where some of the related Productions match this filter\\"\\"\\"
              movies_SOME: ProductionWhere
            }

            interface Production {
              director(limit: Int, offset: Int, where: CreatureWhere): [Creature!]!
              directorConnection(after: String, first: Int, where: ProductionDirectorConnectionWhere): ProductionDirectorConnection!
              id: ID
            }

            type ProductionAggregateSelection {
              count: Int!
              id: IDAggregateSelection!
            }

            input ProductionConnectInput {
              director: [ProductionDirectorConnectFieldInput!]
            }

            input ProductionConnectWhere {
              node: ProductionWhere!
            }

            input ProductionCreateInput {
              Movie: MovieCreateInput
              Series: SeriesCreateInput
            }

            input ProductionDeleteInput {
              director: [ProductionDirectorDeleteFieldInput!]
            }

            input ProductionDirectorAggregateInput {
              AND: [ProductionDirectorAggregateInput!]
              NOT: ProductionDirectorAggregateInput
              OR: [ProductionDirectorAggregateInput!]
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
              connect: [ProductionDirectorConnectFieldInput!]
              create: [ProductionDirectorCreateFieldInput!]
              delete: [ProductionDirectorDeleteFieldInput!]
              disconnect: [ProductionDirectorDisconnectFieldInput!]
              update: ProductionDirectorUpdateConnectionInput
              where: ProductionDirectorConnectionWhere
            }

            input ProductionDisconnectInput {
              director: [ProductionDirectorDisconnectFieldInput!]
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
              id: SortDirection
            }

            input ProductionUpdateInput {
              director: [ProductionDirectorUpdateFieldInput!]
              id_SET: ID
            }

            input ProductionWhere {
              AND: [ProductionWhere!]
              NOT: ProductionWhere
              OR: [ProductionWhere!]
              directorAggregate: ProductionDirectorAggregateInput
              \\"\\"\\"
              Return Productions where all of the related ProductionDirectorConnections match this filter
              \\"\\"\\"
              directorConnection_ALL: ProductionDirectorConnectionWhere
              \\"\\"\\"
              Return Productions where none of the related ProductionDirectorConnections match this filter
              \\"\\"\\"
              directorConnection_NONE: ProductionDirectorConnectionWhere
              \\"\\"\\"
              Return Productions where one of the related ProductionDirectorConnections match this filter
              \\"\\"\\"
              directorConnection_SINGLE: ProductionDirectorConnectionWhere
              \\"\\"\\"
              Return Productions where some of the related ProductionDirectorConnections match this filter
              \\"\\"\\"
              directorConnection_SOME: ProductionDirectorConnectionWhere
              \\"\\"\\"
              Return Productions where all of the related Creatures match this filter
              \\"\\"\\"
              director_ALL: CreatureWhere
              \\"\\"\\"
              Return Productions where none of the related Creatures match this filter
              \\"\\"\\"
              director_NONE: CreatureWhere
              \\"\\"\\"
              Return Productions where one of the related Creatures match this filter
              \\"\\"\\"
              director_SINGLE: CreatureWhere
              \\"\\"\\"
              Return Productions where some of the related Creatures match this filter
              \\"\\"\\"
              director_SOME: CreatureWhere
              id: IDScalarFilters
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
              creatures(limit: Int, offset: Int, where: CreatureWhere): [Creature!]!
              creaturesAggregate(where: CreatureWhere): CreatureAggregateSelection!
              creaturesConnection(after: String, first: Int, where: CreatureWhere): CreaturesConnection!
              movies(limit: Int, offset: Int, sort: [MovieSort!], where: MovieWhere): [Movie!]!
              moviesAggregate(where: MovieWhere): MovieAggregateSelection!
              moviesConnection(after: String, first: Int, sort: [MovieSort!], where: MovieWhere): MoviesConnection!
              people(limit: Int, offset: Int, where: PersonWhere): [Person!]!
              peopleAggregate(where: PersonWhere): PersonAggregateSelection!
              peopleConnection(after: String, first: Int, where: PersonWhere): PeopleConnection!
              productions(limit: Int, offset: Int, sort: [ProductionSort!], where: ProductionWhere): [Production!]!
              productionsAggregate(where: ProductionWhere): ProductionAggregateSelection!
              productionsConnection(after: String, first: Int, sort: [ProductionSort!], where: ProductionWhere): ProductionsConnection!
              series(limit: Int, offset: Int, sort: [SeriesSort!], where: SeriesWhere): [Series!]!
              seriesAggregate(where: SeriesWhere): SeriesAggregateSelection!
              seriesConnection(after: String, first: Int, sort: [SeriesSort!], where: SeriesWhere): SeriesConnection!
            }

            type Series implements Production {
              director(limit: Int, offset: Int, where: CreatureWhere): [Creature!]!
              directorAggregate(where: CreatureWhere): SeriesCreatureDirectorAggregationSelection
              directorConnection(after: String, first: Int, where: ProductionDirectorConnectionWhere): ProductionDirectorConnection!
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
              director: [SeriesDirectorDeleteFieldInput!]
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
              connect: [SeriesDirectorConnectFieldInput!]
              create: [SeriesDirectorCreateFieldInput!]
            }

            input SeriesDirectorUpdateConnectionInput {
              node: CreatureUpdateInput
            }

            input SeriesDirectorUpdateFieldInput {
              connect: [SeriesDirectorConnectFieldInput!]
              create: [SeriesDirectorCreateFieldInput!]
              delete: [SeriesDirectorDeleteFieldInput!]
              disconnect: [SeriesDirectorDisconnectFieldInput!]
              update: SeriesDirectorUpdateConnectionInput
              where: ProductionDirectorConnectionWhere
            }

            type SeriesEdge {
              cursor: String!
              node: Series!
            }

            type SeriesEventPayload {
              episode: Int!
              id: ID
              title: String!
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
              episode: IntScalarFilters
              episode_EQ: Int
              episode_GT: Int
              episode_GTE: Int
              episode_IN: [Int!]
              episode_LT: Int
              episode_LTE: Int
              id: IDScalarFilters
              id_CONTAINS: ID
              id_ENDS_WITH: ID
              id_EQ: ID
              id_IN: [ID]
              id_STARTS_WITH: ID
              title: StringScalarFilters
              title_CONTAINS: String
              title_ENDS_WITH: String
              title_EQ: String
              title_IN: [String!]
              title_STARTS_WITH: String
            }

            input SeriesUpdateInput {
              director: [SeriesDirectorUpdateFieldInput!]
              episode_DECREMENT: Int
              episode_INCREMENT: Int
              episode_SET: Int
              id_SET: ID
              title_SET: String
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
              directorAggregate: SeriesDirectorAggregateInput
              \\"\\"\\"
              Return Series where all of the related ProductionDirectorConnections match this filter
              \\"\\"\\"
              directorConnection_ALL: ProductionDirectorConnectionWhere
              \\"\\"\\"
              Return Series where none of the related ProductionDirectorConnections match this filter
              \\"\\"\\"
              directorConnection_NONE: ProductionDirectorConnectionWhere
              \\"\\"\\"
              Return Series where one of the related ProductionDirectorConnections match this filter
              \\"\\"\\"
              directorConnection_SINGLE: ProductionDirectorConnectionWhere
              \\"\\"\\"
              Return Series where some of the related ProductionDirectorConnections match this filter
              \\"\\"\\"
              directorConnection_SOME: ProductionDirectorConnectionWhere
              \\"\\"\\"Return Series where all of the related Creatures match this filter\\"\\"\\"
              director_ALL: CreatureWhere
              \\"\\"\\"Return Series where none of the related Creatures match this filter\\"\\"\\"
              director_NONE: CreatureWhere
              \\"\\"\\"Return Series where one of the related Creatures match this filter\\"\\"\\"
              director_SINGLE: CreatureWhere
              \\"\\"\\"Return Series where some of the related Creatures match this filter\\"\\"\\"
              director_SOME: CreatureWhere
              episode: IntScalarFilters
              episode_EQ: Int
              episode_GT: Int
              episode_GTE: Int
              episode_IN: [Int!]
              episode_LT: Int
              episode_LTE: Int
              id: IDScalarFilters
              id_CONTAINS: ID
              id_ENDS_WITH: ID
              id_EQ: ID
              id_IN: [ID]
              id_STARTS_WITH: ID
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

            type Subscription {
              personCreated: PersonCreatedEvent!
              personDeleted: PersonDeletedEvent!
              personUpdated: PersonUpdatedEvent!
              seriesCreated(where: SeriesSubscriptionWhere): SeriesCreatedEvent!
              seriesDeleted(where: SeriesSubscriptionWhere): SeriesDeletedEvent!
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
