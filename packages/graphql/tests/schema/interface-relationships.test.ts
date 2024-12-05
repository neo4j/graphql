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

describe("Interface Relationships", () => {
    test("Interface Relationships - single", async () => {
        const typeDefs = gql`
            interface Production {
                title: String!
            }

            type Movie implements Production @node {
                title: String!
                runtime: Int!
            }

            type Series implements Production @node {
                title: String!
                episodes: Int!
            }

            type ActedIn @relationshipProperties {
                screenTime: Int!
            }

            type Actor @node {
                name: String!
                actedIn: [Production!]! @relationship(type: "ACTED_IN", direction: OUT, properties: "ActedIn")
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
            The edge properties for the following fields:
            * Actor.actedIn
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

            input ActedInUpdateInput {
              screenTime_DECREMENT: Int
              screenTime_INCREMENT: Int
              screenTime_SET: Int
            }

            input ActedInWhere {
              AND: [ActedInWhere!]
              NOT: ActedInWhere
              OR: [ActedInWhere!]
              screenTime: IntScalarFilters
              screenTime_EQ: Int
              screenTime_GT: Int
              screenTime_GTE: Int
              screenTime_IN: [Int!]
              screenTime_LT: Int
              screenTime_LTE: Int
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
              edge: ActedInAggregationWhereInput
              node: ActorActedInNodeAggregationWhereInput
            }

            input ActorActedInConnectFieldInput {
              edge: ActedInCreateInput!
              where: ProductionConnectWhere
            }

            type ActorActedInConnection {
              edges: [ActorActedInRelationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input ActorActedInConnectionFilters {
              \\"\\"\\"
              Return Actors where all of the related ActorActedInConnections match this filter
              \\"\\"\\"
              all: ActorActedInConnectionWhere
              \\"\\"\\"
              Return Actors where none of the related ActorActedInConnections match this filter
              \\"\\"\\"
              none: ActorActedInConnectionWhere
              \\"\\"\\"
              Return Actors where one of the related ActorActedInConnections match this filter
              \\"\\"\\"
              single: ActorActedInConnectionWhere
              \\"\\"\\"
              Return Actors where some of the related ActorActedInConnections match this filter
              \\"\\"\\"
              some: ActorActedInConnectionWhere
            }

            input ActorActedInConnectionSort {
              edge: ActedInSort
              node: ProductionSort
            }

            input ActorActedInConnectionWhere {
              AND: [ActorActedInConnectionWhere!]
              NOT: ActorActedInConnectionWhere
              OR: [ActorActedInConnectionWhere!]
              edge: ActedInWhere
              node: ProductionWhere
            }

            input ActorActedInCreateFieldInput {
              edge: ActedInCreateInput!
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
              properties: ActedIn!
            }

            input ActorActedInRelationshipFilters {
              \\"\\"\\"Return Actors where all of the related Productions match this filter\\"\\"\\"
              all: ProductionWhere
              \\"\\"\\"Return Actors where none of the related Productions match this filter\\"\\"\\"
              none: ProductionWhere
              \\"\\"\\"Return Actors where one of the related Productions match this filter\\"\\"\\"
              single: ProductionWhere
              \\"\\"\\"Return Actors where some of the related Productions match this filter\\"\\"\\"
              some: ProductionWhere
            }

            input ActorActedInUpdateConnectionInput {
              edge: ActedInUpdateInput
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
              edge: ActorProductionActedInEdgeAggregateSelection
              node: ActorProductionActedInNodeAggregateSelection
            }

            type ActorProductionActedInEdgeAggregateSelection {
              screenTime: IntAggregateSelection!
            }

            type ActorProductionActedInNodeAggregateSelection {
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
              name_SET: String
            }

            input ActorWhere {
              AND: [ActorWhere!]
              NOT: ActorWhere
              OR: [ActorWhere!]
              actedIn: ActorActedInRelationshipFilters
              actedInAggregate: ActorActedInAggregateInput
              actedInConnection: ActorActedInConnectionFilters
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
              runtime: Int!
              title: String!
            }

            type MovieAggregateSelection {
              count: Int!
              runtime: IntAggregateSelection!
              title: StringAggregateSelection!
            }

            input MovieCreateInput {
              runtime: Int!
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
              runtime: SortDirection
              title: SortDirection
            }

            input MovieUpdateInput {
              runtime_DECREMENT: Int
              runtime_INCREMENT: Int
              runtime_SET: Int
              title_SET: String
            }

            input MovieWhere {
              AND: [MovieWhere!]
              NOT: MovieWhere
              OR: [MovieWhere!]
              runtime: IntScalarFilters
              runtime_EQ: Int
              runtime_GT: Int
              runtime_GTE: Int
              runtime_IN: [Int!]
              runtime_LT: Int
              runtime_LTE: Int
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
              title: String!
            }

            type ProductionAggregateSelection {
              count: Int!
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
              title: SortDirection
            }

            input ProductionUpdateInput {
              title_SET: String
            }

            input ProductionWhere {
              AND: [ProductionWhere!]
              NOT: ProductionWhere
              OR: [ProductionWhere!]
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
              episodes: Int!
              title: String!
            }

            type SeriesAggregateSelection {
              count: Int!
              episodes: IntAggregateSelection!
              title: StringAggregateSelection!
            }

            type SeriesConnection {
              edges: [SeriesEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input SeriesCreateInput {
              episodes: Int!
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
              episodes: SortDirection
              title: SortDirection
            }

            input SeriesUpdateInput {
              episodes_DECREMENT: Int
              episodes_INCREMENT: Int
              episodes_SET: Int
              title_SET: String
            }

            input SeriesWhere {
              AND: [SeriesWhere!]
              NOT: SeriesWhere
              OR: [SeriesWhere!]
              episodes: IntScalarFilters
              episodes_EQ: Int
              episodes_GT: Int
              episodes_GTE: Int
              episodes_IN: [Int!]
              episodes_LT: Int
              episodes_LTE: Int
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

    test("Interface Relationships - multiple - same relationship implementation", async () => {
        const typeDefs = gql`
            type Episode @node {
                runtime: Int!
                series: [Series!]! @relationship(type: "HAS_EPISODE", direction: IN)
            }

            interface Production {
                title: String!
                actors: [Actor!]! @declareRelationship
            }

            type Movie implements Production @node {
                title: String!
                runtime: Int!
                actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN, properties: "ActedIn")
            }

            type Series implements Production @node {
                title: String!
                episodeCount: Int!
                episodes: [Episode!]! @relationship(type: "HAS_EPISODE", direction: OUT)
                actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN, properties: "ActedIn")
            }

            type ActedIn @relationshipProperties {
                screenTime: Int!
            }

            type Actor @node {
                name: String!
                actedIn: [Production!]! @relationship(type: "ACTED_IN", direction: OUT, properties: "ActedIn")
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
            The edge properties for the following fields:
            * Movie.actors
            * Series.actors
            * Actor.actedIn
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

            input ActedInUpdateInput {
              screenTime_DECREMENT: Int
              screenTime_INCREMENT: Int
              screenTime_SET: Int
            }

            input ActedInWhere {
              AND: [ActedInWhere!]
              NOT: ActedInWhere
              OR: [ActedInWhere!]
              screenTime: IntScalarFilters
              screenTime_EQ: Int
              screenTime_GT: Int
              screenTime_GTE: Int
              screenTime_IN: [Int!]
              screenTime_LT: Int
              screenTime_LTE: Int
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
              edge: ActedInAggregationWhereInput
              node: ActorActedInNodeAggregationWhereInput
            }

            input ActorActedInConnectFieldInput {
              connect: ProductionConnectInput
              edge: ActedInCreateInput!
              where: ProductionConnectWhere
            }

            type ActorActedInConnection {
              edges: [ActorActedInRelationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input ActorActedInConnectionFilters {
              \\"\\"\\"
              Return Actors where all of the related ActorActedInConnections match this filter
              \\"\\"\\"
              all: ActorActedInConnectionWhere
              \\"\\"\\"
              Return Actors where none of the related ActorActedInConnections match this filter
              \\"\\"\\"
              none: ActorActedInConnectionWhere
              \\"\\"\\"
              Return Actors where one of the related ActorActedInConnections match this filter
              \\"\\"\\"
              single: ActorActedInConnectionWhere
              \\"\\"\\"
              Return Actors where some of the related ActorActedInConnections match this filter
              \\"\\"\\"
              some: ActorActedInConnectionWhere
            }

            input ActorActedInConnectionSort {
              edge: ActedInSort
              node: ProductionSort
            }

            input ActorActedInConnectionWhere {
              AND: [ActorActedInConnectionWhere!]
              NOT: ActorActedInConnectionWhere
              OR: [ActorActedInConnectionWhere!]
              edge: ActedInWhere
              node: ProductionWhere
            }

            input ActorActedInCreateFieldInput {
              edge: ActedInCreateInput!
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
              properties: ActedIn!
            }

            input ActorActedInRelationshipFilters {
              \\"\\"\\"Return Actors where all of the related Productions match this filter\\"\\"\\"
              all: ProductionWhere
              \\"\\"\\"Return Actors where none of the related Productions match this filter\\"\\"\\"
              none: ProductionWhere
              \\"\\"\\"Return Actors where one of the related Productions match this filter\\"\\"\\"
              single: ProductionWhere
              \\"\\"\\"Return Actors where some of the related Productions match this filter\\"\\"\\"
              some: ProductionWhere
            }

            input ActorActedInUpdateConnectionInput {
              edge: ActedInUpdateInput
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

            type ActorProductionActedInAggregationSelection {
              count: Int!
              edge: ActorProductionActedInEdgeAggregateSelection
              node: ActorProductionActedInNodeAggregateSelection
            }

            type ActorProductionActedInEdgeAggregateSelection {
              screenTime: IntAggregateSelection!
            }

            type ActorProductionActedInNodeAggregateSelection {
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
              name_SET: String
            }

            input ActorWhere {
              AND: [ActorWhere!]
              NOT: ActorWhere
              OR: [ActorWhere!]
              actedIn: ActorActedInRelationshipFilters
              actedInAggregate: ActorActedInAggregateInput
              actedInConnection: ActorActedInConnectionFilters
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

            type CreateEpisodesMutationResponse {
              episodes: [Episode!]!
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

            type Episode {
              runtime: Int!
              series(limit: Int, offset: Int, sort: [SeriesSort!], where: SeriesWhere): [Series!]!
              seriesAggregate(where: SeriesWhere): EpisodeSeriesSeriesAggregationSelection
              seriesConnection(after: String, first: Int, sort: [EpisodeSeriesConnectionSort!], where: EpisodeSeriesConnectionWhere): EpisodeSeriesConnection!
            }

            type EpisodeAggregateSelection {
              count: Int!
              runtime: IntAggregateSelection!
            }

            input EpisodeConnectInput {
              series: [EpisodeSeriesConnectFieldInput!]
            }

            input EpisodeConnectWhere {
              node: EpisodeWhere!
            }

            input EpisodeCreateInput {
              runtime: Int!
              series: EpisodeSeriesFieldInput
            }

            input EpisodeDeleteInput {
              series: [EpisodeSeriesDeleteFieldInput!]
            }

            input EpisodeDisconnectInput {
              series: [EpisodeSeriesDisconnectFieldInput!]
            }

            type EpisodeEdge {
              cursor: String!
              node: Episode!
            }

            input EpisodeSeriesAggregateInput {
              AND: [EpisodeSeriesAggregateInput!]
              NOT: EpisodeSeriesAggregateInput
              OR: [EpisodeSeriesAggregateInput!]
              count_EQ: Int
              count_GT: Int
              count_GTE: Int
              count_LT: Int
              count_LTE: Int
              node: EpisodeSeriesNodeAggregationWhereInput
            }

            input EpisodeSeriesConnectFieldInput {
              connect: [SeriesConnectInput!]
              where: SeriesConnectWhere
            }

            type EpisodeSeriesConnection {
              edges: [EpisodeSeriesRelationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input EpisodeSeriesConnectionFilters {
              \\"\\"\\"
              Return Episodes where all of the related EpisodeSeriesConnections match this filter
              \\"\\"\\"
              all: EpisodeSeriesConnectionWhere
              \\"\\"\\"
              Return Episodes where none of the related EpisodeSeriesConnections match this filter
              \\"\\"\\"
              none: EpisodeSeriesConnectionWhere
              \\"\\"\\"
              Return Episodes where one of the related EpisodeSeriesConnections match this filter
              \\"\\"\\"
              single: EpisodeSeriesConnectionWhere
              \\"\\"\\"
              Return Episodes where some of the related EpisodeSeriesConnections match this filter
              \\"\\"\\"
              some: EpisodeSeriesConnectionWhere
            }

            input EpisodeSeriesConnectionSort {
              node: SeriesSort
            }

            input EpisodeSeriesConnectionWhere {
              AND: [EpisodeSeriesConnectionWhere!]
              NOT: EpisodeSeriesConnectionWhere
              OR: [EpisodeSeriesConnectionWhere!]
              node: SeriesWhere
            }

            input EpisodeSeriesCreateFieldInput {
              node: SeriesCreateInput!
            }

            input EpisodeSeriesDeleteFieldInput {
              delete: SeriesDeleteInput
              where: EpisodeSeriesConnectionWhere
            }

            input EpisodeSeriesDisconnectFieldInput {
              disconnect: SeriesDisconnectInput
              where: EpisodeSeriesConnectionWhere
            }

            input EpisodeSeriesFieldInput {
              connect: [EpisodeSeriesConnectFieldInput!]
              create: [EpisodeSeriesCreateFieldInput!]
            }

            input EpisodeSeriesNodeAggregationWhereInput {
              AND: [EpisodeSeriesNodeAggregationWhereInput!]
              NOT: EpisodeSeriesNodeAggregationWhereInput
              OR: [EpisodeSeriesNodeAggregationWhereInput!]
              episodeCount_AVERAGE_EQUAL: Float
              episodeCount_AVERAGE_GT: Float
              episodeCount_AVERAGE_GTE: Float
              episodeCount_AVERAGE_LT: Float
              episodeCount_AVERAGE_LTE: Float
              episodeCount_MAX_EQUAL: Int
              episodeCount_MAX_GT: Int
              episodeCount_MAX_GTE: Int
              episodeCount_MAX_LT: Int
              episodeCount_MAX_LTE: Int
              episodeCount_MIN_EQUAL: Int
              episodeCount_MIN_GT: Int
              episodeCount_MIN_GTE: Int
              episodeCount_MIN_LT: Int
              episodeCount_MIN_LTE: Int
              episodeCount_SUM_EQUAL: Int
              episodeCount_SUM_GT: Int
              episodeCount_SUM_GTE: Int
              episodeCount_SUM_LT: Int
              episodeCount_SUM_LTE: Int
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

            type EpisodeSeriesRelationship {
              cursor: String!
              node: Series!
            }

            input EpisodeSeriesRelationshipFilters {
              \\"\\"\\"Return Episodes where all of the related Series match this filter\\"\\"\\"
              all: SeriesWhere
              \\"\\"\\"Return Episodes where none of the related Series match this filter\\"\\"\\"
              none: SeriesWhere
              \\"\\"\\"Return Episodes where one of the related Series match this filter\\"\\"\\"
              single: SeriesWhere
              \\"\\"\\"Return Episodes where some of the related Series match this filter\\"\\"\\"
              some: SeriesWhere
            }

            type EpisodeSeriesSeriesAggregationSelection {
              count: Int!
              node: EpisodeSeriesSeriesNodeAggregateSelection
            }

            type EpisodeSeriesSeriesNodeAggregateSelection {
              episodeCount: IntAggregateSelection!
              title: StringAggregateSelection!
            }

            input EpisodeSeriesUpdateConnectionInput {
              node: SeriesUpdateInput
            }

            input EpisodeSeriesUpdateFieldInput {
              connect: [EpisodeSeriesConnectFieldInput!]
              create: [EpisodeSeriesCreateFieldInput!]
              delete: [EpisodeSeriesDeleteFieldInput!]
              disconnect: [EpisodeSeriesDisconnectFieldInput!]
              update: EpisodeSeriesUpdateConnectionInput
              where: EpisodeSeriesConnectionWhere
            }

            \\"\\"\\"
            Fields to sort Episodes by. The order in which sorts are applied is not guaranteed when specifying many fields in one EpisodeSort object.
            \\"\\"\\"
            input EpisodeSort {
              runtime: SortDirection
            }

            input EpisodeUpdateInput {
              runtime_DECREMENT: Int
              runtime_INCREMENT: Int
              runtime_SET: Int
              series: [EpisodeSeriesUpdateFieldInput!]
            }

            input EpisodeWhere {
              AND: [EpisodeWhere!]
              NOT: EpisodeWhere
              OR: [EpisodeWhere!]
              runtime: IntScalarFilters
              runtime_EQ: Int
              runtime_GT: Int
              runtime_GTE: Int
              runtime_IN: [Int!]
              runtime_LT: Int
              runtime_LTE: Int
              series: EpisodeSeriesRelationshipFilters
              seriesAggregate: EpisodeSeriesAggregateInput
              seriesConnection: EpisodeSeriesConnectionFilters
              \\"\\"\\"
              Return Episodes where all of the related EpisodeSeriesConnections match this filter
              \\"\\"\\"
              seriesConnection_ALL: EpisodeSeriesConnectionWhere
              \\"\\"\\"
              Return Episodes where none of the related EpisodeSeriesConnections match this filter
              \\"\\"\\"
              seriesConnection_NONE: EpisodeSeriesConnectionWhere
              \\"\\"\\"
              Return Episodes where one of the related EpisodeSeriesConnections match this filter
              \\"\\"\\"
              seriesConnection_SINGLE: EpisodeSeriesConnectionWhere
              \\"\\"\\"
              Return Episodes where some of the related EpisodeSeriesConnections match this filter
              \\"\\"\\"
              seriesConnection_SOME: EpisodeSeriesConnectionWhere
              \\"\\"\\"Return Episodes where all of the related Series match this filter\\"\\"\\"
              series_ALL: SeriesWhere
              \\"\\"\\"Return Episodes where none of the related Series match this filter\\"\\"\\"
              series_NONE: SeriesWhere
              \\"\\"\\"Return Episodes where one of the related Series match this filter\\"\\"\\"
              series_SINGLE: SeriesWhere
              \\"\\"\\"Return Episodes where some of the related Series match this filter\\"\\"\\"
              series_SOME: SeriesWhere
            }

            type EpisodesConnection {
              edges: [EpisodeEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
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
              actors(limit: Int, offset: Int, sort: [ActorSort!], where: ActorWhere): [Actor!]!
              actorsAggregate(where: ActorWhere): MovieActorActorsAggregationSelection
              actorsConnection(after: String, first: Int, sort: [ProductionActorsConnectionSort!], where: ProductionActorsConnectionWhere): ProductionActorsConnection!
              runtime: Int!
              title: String!
            }

            type MovieActorActorsAggregationSelection {
              count: Int!
              edge: MovieActorActorsEdgeAggregateSelection
              node: MovieActorActorsNodeAggregateSelection
            }

            type MovieActorActorsEdgeAggregateSelection {
              screenTime: IntAggregateSelection!
            }

            type MovieActorActorsNodeAggregateSelection {
              name: StringAggregateSelection!
            }

            input MovieActorsAggregateInput {
              AND: [MovieActorsAggregateInput!]
              NOT: MovieActorsAggregateInput
              OR: [MovieActorsAggregateInput!]
              count_EQ: Int
              count_GT: Int
              count_GTE: Int
              count_LT: Int
              count_LTE: Int
              edge: ActedInAggregationWhereInput
              node: MovieActorsNodeAggregationWhereInput
            }

            input MovieActorsConnectFieldInput {
              connect: [ActorConnectInput!]
              edge: ActedInCreateInput!
              where: ActorConnectWhere
            }

            input MovieActorsConnectionFilters {
              \\"\\"\\"
              Return Movies where all of the related ProductionActorsConnections match this filter
              \\"\\"\\"
              all: ProductionActorsConnectionWhere
              \\"\\"\\"
              Return Movies where none of the related ProductionActorsConnections match this filter
              \\"\\"\\"
              none: ProductionActorsConnectionWhere
              \\"\\"\\"
              Return Movies where one of the related ProductionActorsConnections match this filter
              \\"\\"\\"
              single: ProductionActorsConnectionWhere
              \\"\\"\\"
              Return Movies where some of the related ProductionActorsConnections match this filter
              \\"\\"\\"
              some: ProductionActorsConnectionWhere
            }

            input MovieActorsCreateFieldInput {
              edge: ActedInCreateInput!
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
              name_AVERAGE_LENGTH_EQUAL: Float
              name_AVERAGE_LENGTH_GT: Float
              name_AVERAGE_LENGTH_GTE: Float
              name_AVERAGE_LENGTH_LT: Float
              name_AVERAGE_LENGTH_LTE: Float
              name_LONGEST_LENGTH_EQUAL: Int
              name_LONGEST_LENGTH_GT: Int
              name_LONGEST_LENGTH_GTE: Int
              name_LONGEST_LENGTH_LT: Int
              name_LONGEST_LENGTH_LTE: Int
              name_SHORTEST_LENGTH_EQUAL: Int
              name_SHORTEST_LENGTH_GT: Int
              name_SHORTEST_LENGTH_GTE: Int
              name_SHORTEST_LENGTH_LT: Int
              name_SHORTEST_LENGTH_LTE: Int
            }

            input MovieActorsRelationshipFilters {
              \\"\\"\\"Return Movies where all of the related Actors match this filter\\"\\"\\"
              all: ActorWhere
              \\"\\"\\"Return Movies where none of the related Actors match this filter\\"\\"\\"
              none: ActorWhere
              \\"\\"\\"Return Movies where one of the related Actors match this filter\\"\\"\\"
              single: ActorWhere
              \\"\\"\\"Return Movies where some of the related Actors match this filter\\"\\"\\"
              some: ActorWhere
            }

            input MovieActorsUpdateConnectionInput {
              edge: ActedInUpdateInput
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
              runtime: IntAggregateSelection!
              title: StringAggregateSelection!
            }

            input MovieCreateInput {
              actors: MovieActorsFieldInput
              runtime: Int!
              title: String!
            }

            input MovieDeleteInput {
              actors: [ProductionActorsDeleteFieldInput!]
            }

            type MovieEdge {
              cursor: String!
              node: Movie!
            }

            \\"\\"\\"
            Fields to sort Movies by. The order in which sorts are applied is not guaranteed when specifying many fields in one MovieSort object.
            \\"\\"\\"
            input MovieSort {
              runtime: SortDirection
              title: SortDirection
            }

            input MovieUpdateInput {
              actors: [MovieActorsUpdateFieldInput!]
              runtime_DECREMENT: Int
              runtime_INCREMENT: Int
              runtime_SET: Int
              title_SET: String
            }

            input MovieWhere {
              AND: [MovieWhere!]
              NOT: MovieWhere
              OR: [MovieWhere!]
              actors: MovieActorsRelationshipFilters
              actorsAggregate: MovieActorsAggregateInput
              actorsConnection: MovieActorsConnectionFilters
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
              runtime: IntScalarFilters
              runtime_EQ: Int
              runtime_GT: Int
              runtime_GTE: Int
              runtime_IN: [Int!]
              runtime_LT: Int
              runtime_LTE: Int
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
              createEpisodes(input: [EpisodeCreateInput!]!): CreateEpisodesMutationResponse!
              createMovies(input: [MovieCreateInput!]!): CreateMoviesMutationResponse!
              createSeries(input: [SeriesCreateInput!]!): CreateSeriesMutationResponse!
              deleteActors(delete: ActorDeleteInput, where: ActorWhere): DeleteInfo!
              deleteEpisodes(delete: EpisodeDeleteInput, where: EpisodeWhere): DeleteInfo!
              deleteMovies(delete: MovieDeleteInput, where: MovieWhere): DeleteInfo!
              deleteSeries(delete: SeriesDeleteInput, where: SeriesWhere): DeleteInfo!
              updateActors(update: ActorUpdateInput, where: ActorWhere): UpdateActorsMutationResponse!
              updateEpisodes(update: EpisodeUpdateInput, where: EpisodeWhere): UpdateEpisodesMutationResponse!
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
              actors(limit: Int, offset: Int, sort: [ActorSort!], where: ActorWhere): [Actor!]!
              actorsConnection(after: String, first: Int, sort: [ProductionActorsConnectionSort!], where: ProductionActorsConnectionWhere): ProductionActorsConnection!
              title: String!
            }

            input ProductionActorsAggregateInput {
              AND: [ProductionActorsAggregateInput!]
              NOT: ProductionActorsAggregateInput
              OR: [ProductionActorsAggregateInput!]
              count_EQ: Int
              count_GT: Int
              count_GTE: Int
              count_LT: Int
              count_LTE: Int
              edge: ProductionActorsEdgeAggregationWhereInput
              node: ProductionActorsNodeAggregationWhereInput
            }

            input ProductionActorsConnectFieldInput {
              connect: [ActorConnectInput!]
              edge: ProductionActorsEdgeCreateInput!
              where: ActorConnectWhere
            }

            type ProductionActorsConnection {
              edges: [ProductionActorsRelationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input ProductionActorsConnectionFilters {
              \\"\\"\\"
              Return Productions where all of the related ProductionActorsConnections match this filter
              \\"\\"\\"
              all: ProductionActorsConnectionWhere
              \\"\\"\\"
              Return Productions where none of the related ProductionActorsConnections match this filter
              \\"\\"\\"
              none: ProductionActorsConnectionWhere
              \\"\\"\\"
              Return Productions where one of the related ProductionActorsConnections match this filter
              \\"\\"\\"
              single: ProductionActorsConnectionWhere
              \\"\\"\\"
              Return Productions where some of the related ProductionActorsConnections match this filter
              \\"\\"\\"
              some: ProductionActorsConnectionWhere
            }

            input ProductionActorsConnectionSort {
              edge: ProductionActorsEdgeSort
              node: ActorSort
            }

            input ProductionActorsConnectionWhere {
              AND: [ProductionActorsConnectionWhere!]
              NOT: ProductionActorsConnectionWhere
              OR: [ProductionActorsConnectionWhere!]
              edge: ProductionActorsEdgeWhere
              node: ActorWhere
            }

            input ProductionActorsCreateFieldInput {
              edge: ProductionActorsEdgeCreateInput!
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

            input ProductionActorsEdgeAggregationWhereInput {
              \\"\\"\\"
              Relationship properties when source node is of type:
              * Movie
              * Series
              \\"\\"\\"
              ActedIn: ActedInAggregationWhereInput
            }

            input ProductionActorsEdgeCreateInput {
              \\"\\"\\"
              Relationship properties when source node is of type:
              * Movie
              * Series
              \\"\\"\\"
              ActedIn: ActedInCreateInput!
            }

            input ProductionActorsEdgeSort {
              \\"\\"\\"
              Relationship properties when source node is of type:
              * Movie
              * Series
              \\"\\"\\"
              ActedIn: ActedInSort
            }

            input ProductionActorsEdgeUpdateInput {
              \\"\\"\\"
              Relationship properties when source node is of type:
              * Movie
              * Series
              \\"\\"\\"
              ActedIn: ActedInUpdateInput
            }

            input ProductionActorsEdgeWhere {
              \\"\\"\\"
              Relationship properties when source node is of type:
              * Movie
              * Series
              \\"\\"\\"
              ActedIn: ActedInWhere
            }

            input ProductionActorsNodeAggregationWhereInput {
              AND: [ProductionActorsNodeAggregationWhereInput!]
              NOT: ProductionActorsNodeAggregationWhereInput
              OR: [ProductionActorsNodeAggregationWhereInput!]
              name_AVERAGE_LENGTH_EQUAL: Float
              name_AVERAGE_LENGTH_GT: Float
              name_AVERAGE_LENGTH_GTE: Float
              name_AVERAGE_LENGTH_LT: Float
              name_AVERAGE_LENGTH_LTE: Float
              name_LONGEST_LENGTH_EQUAL: Int
              name_LONGEST_LENGTH_GT: Int
              name_LONGEST_LENGTH_GTE: Int
              name_LONGEST_LENGTH_LT: Int
              name_LONGEST_LENGTH_LTE: Int
              name_SHORTEST_LENGTH_EQUAL: Int
              name_SHORTEST_LENGTH_GT: Int
              name_SHORTEST_LENGTH_GTE: Int
              name_SHORTEST_LENGTH_LT: Int
              name_SHORTEST_LENGTH_LTE: Int
            }

            type ProductionActorsRelationship {
              cursor: String!
              node: Actor!
              properties: ProductionActorsRelationshipProperties!
            }

            input ProductionActorsRelationshipFilters {
              \\"\\"\\"Return Productions where all of the related Actors match this filter\\"\\"\\"
              all: ActorWhere
              \\"\\"\\"Return Productions where none of the related Actors match this filter\\"\\"\\"
              none: ActorWhere
              \\"\\"\\"Return Productions where one of the related Actors match this filter\\"\\"\\"
              single: ActorWhere
              \\"\\"\\"Return Productions where some of the related Actors match this filter\\"\\"\\"
              some: ActorWhere
            }

            union ProductionActorsRelationshipProperties = ActedIn

            input ProductionActorsUpdateConnectionInput {
              edge: ProductionActorsEdgeUpdateInput
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

            \\"\\"\\"
            Fields to sort Productions by. The order in which sorts are applied is not guaranteed when specifying many fields in one ProductionSort object.
            \\"\\"\\"
            input ProductionSort {
              title: SortDirection
            }

            input ProductionUpdateInput {
              actors: [ProductionActorsUpdateFieldInput!]
              title_SET: String
            }

            input ProductionWhere {
              AND: [ProductionWhere!]
              NOT: ProductionWhere
              OR: [ProductionWhere!]
              actors: ProductionActorsRelationshipFilters
              actorsAggregate: ProductionActorsAggregateInput
              actorsConnection: ProductionActorsConnectionFilters
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
              episodes(limit: Int, offset: Int, sort: [EpisodeSort!], where: EpisodeWhere): [Episode!]!
              episodesAggregate(where: EpisodeWhere): EpisodeAggregateSelection!
              episodesConnection(after: String, first: Int, sort: [EpisodeSort!], where: EpisodeWhere): EpisodesConnection!
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
              actors(limit: Int, offset: Int, sort: [ActorSort!], where: ActorWhere): [Actor!]!
              actorsAggregate(where: ActorWhere): SeriesActorActorsAggregationSelection
              actorsConnection(after: String, first: Int, sort: [ProductionActorsConnectionSort!], where: ProductionActorsConnectionWhere): ProductionActorsConnection!
              episodeCount: Int!
              episodes(limit: Int, offset: Int, sort: [EpisodeSort!], where: EpisodeWhere): [Episode!]!
              episodesAggregate(where: EpisodeWhere): SeriesEpisodeEpisodesAggregationSelection
              episodesConnection(after: String, first: Int, sort: [SeriesEpisodesConnectionSort!], where: SeriesEpisodesConnectionWhere): SeriesEpisodesConnection!
              title: String!
            }

            type SeriesActorActorsAggregationSelection {
              count: Int!
              edge: SeriesActorActorsEdgeAggregateSelection
              node: SeriesActorActorsNodeAggregateSelection
            }

            type SeriesActorActorsEdgeAggregateSelection {
              screenTime: IntAggregateSelection!
            }

            type SeriesActorActorsNodeAggregateSelection {
              name: StringAggregateSelection!
            }

            input SeriesActorsAggregateInput {
              AND: [SeriesActorsAggregateInput!]
              NOT: SeriesActorsAggregateInput
              OR: [SeriesActorsAggregateInput!]
              count_EQ: Int
              count_GT: Int
              count_GTE: Int
              count_LT: Int
              count_LTE: Int
              edge: ActedInAggregationWhereInput
              node: SeriesActorsNodeAggregationWhereInput
            }

            input SeriesActorsConnectFieldInput {
              connect: [ActorConnectInput!]
              edge: ActedInCreateInput!
              where: ActorConnectWhere
            }

            input SeriesActorsConnectionFilters {
              \\"\\"\\"
              Return Series where all of the related ProductionActorsConnections match this filter
              \\"\\"\\"
              all: ProductionActorsConnectionWhere
              \\"\\"\\"
              Return Series where none of the related ProductionActorsConnections match this filter
              \\"\\"\\"
              none: ProductionActorsConnectionWhere
              \\"\\"\\"
              Return Series where one of the related ProductionActorsConnections match this filter
              \\"\\"\\"
              single: ProductionActorsConnectionWhere
              \\"\\"\\"
              Return Series where some of the related ProductionActorsConnections match this filter
              \\"\\"\\"
              some: ProductionActorsConnectionWhere
            }

            input SeriesActorsCreateFieldInput {
              edge: ActedInCreateInput!
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
              name_AVERAGE_LENGTH_EQUAL: Float
              name_AVERAGE_LENGTH_GT: Float
              name_AVERAGE_LENGTH_GTE: Float
              name_AVERAGE_LENGTH_LT: Float
              name_AVERAGE_LENGTH_LTE: Float
              name_LONGEST_LENGTH_EQUAL: Int
              name_LONGEST_LENGTH_GT: Int
              name_LONGEST_LENGTH_GTE: Int
              name_LONGEST_LENGTH_LT: Int
              name_LONGEST_LENGTH_LTE: Int
              name_SHORTEST_LENGTH_EQUAL: Int
              name_SHORTEST_LENGTH_GT: Int
              name_SHORTEST_LENGTH_GTE: Int
              name_SHORTEST_LENGTH_LT: Int
              name_SHORTEST_LENGTH_LTE: Int
            }

            input SeriesActorsRelationshipFilters {
              \\"\\"\\"Return Series where all of the related Actors match this filter\\"\\"\\"
              all: ActorWhere
              \\"\\"\\"Return Series where none of the related Actors match this filter\\"\\"\\"
              none: ActorWhere
              \\"\\"\\"Return Series where one of the related Actors match this filter\\"\\"\\"
              single: ActorWhere
              \\"\\"\\"Return Series where some of the related Actors match this filter\\"\\"\\"
              some: ActorWhere
            }

            input SeriesActorsUpdateConnectionInput {
              edge: ActedInUpdateInput
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
              episodeCount: IntAggregateSelection!
              title: StringAggregateSelection!
            }

            input SeriesConnectInput {
              actors: [SeriesActorsConnectFieldInput!]
              episodes: [SeriesEpisodesConnectFieldInput!]
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
              actors: SeriesActorsFieldInput
              episodeCount: Int!
              episodes: SeriesEpisodesFieldInput
              title: String!
            }

            input SeriesDeleteInput {
              actors: [ProductionActorsDeleteFieldInput!]
              episodes: [SeriesEpisodesDeleteFieldInput!]
            }

            input SeriesDisconnectInput {
              actors: [ProductionActorsDisconnectFieldInput!]
              episodes: [SeriesEpisodesDisconnectFieldInput!]
            }

            type SeriesEdge {
              cursor: String!
              node: Series!
            }

            type SeriesEpisodeEpisodesAggregationSelection {
              count: Int!
              node: SeriesEpisodeEpisodesNodeAggregateSelection
            }

            type SeriesEpisodeEpisodesNodeAggregateSelection {
              runtime: IntAggregateSelection!
            }

            input SeriesEpisodesAggregateInput {
              AND: [SeriesEpisodesAggregateInput!]
              NOT: SeriesEpisodesAggregateInput
              OR: [SeriesEpisodesAggregateInput!]
              count_EQ: Int
              count_GT: Int
              count_GTE: Int
              count_LT: Int
              count_LTE: Int
              node: SeriesEpisodesNodeAggregationWhereInput
            }

            input SeriesEpisodesConnectFieldInput {
              connect: [EpisodeConnectInput!]
              where: EpisodeConnectWhere
            }

            type SeriesEpisodesConnection {
              edges: [SeriesEpisodesRelationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input SeriesEpisodesConnectionFilters {
              \\"\\"\\"
              Return Series where all of the related SeriesEpisodesConnections match this filter
              \\"\\"\\"
              all: SeriesEpisodesConnectionWhere
              \\"\\"\\"
              Return Series where none of the related SeriesEpisodesConnections match this filter
              \\"\\"\\"
              none: SeriesEpisodesConnectionWhere
              \\"\\"\\"
              Return Series where one of the related SeriesEpisodesConnections match this filter
              \\"\\"\\"
              single: SeriesEpisodesConnectionWhere
              \\"\\"\\"
              Return Series where some of the related SeriesEpisodesConnections match this filter
              \\"\\"\\"
              some: SeriesEpisodesConnectionWhere
            }

            input SeriesEpisodesConnectionSort {
              node: EpisodeSort
            }

            input SeriesEpisodesConnectionWhere {
              AND: [SeriesEpisodesConnectionWhere!]
              NOT: SeriesEpisodesConnectionWhere
              OR: [SeriesEpisodesConnectionWhere!]
              node: EpisodeWhere
            }

            input SeriesEpisodesCreateFieldInput {
              node: EpisodeCreateInput!
            }

            input SeriesEpisodesDeleteFieldInput {
              delete: EpisodeDeleteInput
              where: SeriesEpisodesConnectionWhere
            }

            input SeriesEpisodesDisconnectFieldInput {
              disconnect: EpisodeDisconnectInput
              where: SeriesEpisodesConnectionWhere
            }

            input SeriesEpisodesFieldInput {
              connect: [SeriesEpisodesConnectFieldInput!]
              create: [SeriesEpisodesCreateFieldInput!]
            }

            input SeriesEpisodesNodeAggregationWhereInput {
              AND: [SeriesEpisodesNodeAggregationWhereInput!]
              NOT: SeriesEpisodesNodeAggregationWhereInput
              OR: [SeriesEpisodesNodeAggregationWhereInput!]
              runtime_AVERAGE_EQUAL: Float
              runtime_AVERAGE_GT: Float
              runtime_AVERAGE_GTE: Float
              runtime_AVERAGE_LT: Float
              runtime_AVERAGE_LTE: Float
              runtime_MAX_EQUAL: Int
              runtime_MAX_GT: Int
              runtime_MAX_GTE: Int
              runtime_MAX_LT: Int
              runtime_MAX_LTE: Int
              runtime_MIN_EQUAL: Int
              runtime_MIN_GT: Int
              runtime_MIN_GTE: Int
              runtime_MIN_LT: Int
              runtime_MIN_LTE: Int
              runtime_SUM_EQUAL: Int
              runtime_SUM_GT: Int
              runtime_SUM_GTE: Int
              runtime_SUM_LT: Int
              runtime_SUM_LTE: Int
            }

            type SeriesEpisodesRelationship {
              cursor: String!
              node: Episode!
            }

            input SeriesEpisodesRelationshipFilters {
              \\"\\"\\"Return Series where all of the related Episodes match this filter\\"\\"\\"
              all: EpisodeWhere
              \\"\\"\\"Return Series where none of the related Episodes match this filter\\"\\"\\"
              none: EpisodeWhere
              \\"\\"\\"Return Series where one of the related Episodes match this filter\\"\\"\\"
              single: EpisodeWhere
              \\"\\"\\"Return Series where some of the related Episodes match this filter\\"\\"\\"
              some: EpisodeWhere
            }

            input SeriesEpisodesUpdateConnectionInput {
              node: EpisodeUpdateInput
            }

            input SeriesEpisodesUpdateFieldInput {
              connect: [SeriesEpisodesConnectFieldInput!]
              create: [SeriesEpisodesCreateFieldInput!]
              delete: [SeriesEpisodesDeleteFieldInput!]
              disconnect: [SeriesEpisodesDisconnectFieldInput!]
              update: SeriesEpisodesUpdateConnectionInput
              where: SeriesEpisodesConnectionWhere
            }

            \\"\\"\\"
            Fields to sort Series by. The order in which sorts are applied is not guaranteed when specifying many fields in one SeriesSort object.
            \\"\\"\\"
            input SeriesSort {
              episodeCount: SortDirection
              title: SortDirection
            }

            input SeriesUpdateInput {
              actors: [SeriesActorsUpdateFieldInput!]
              episodeCount_DECREMENT: Int
              episodeCount_INCREMENT: Int
              episodeCount_SET: Int
              episodes: [SeriesEpisodesUpdateFieldInput!]
              title_SET: String
            }

            input SeriesWhere {
              AND: [SeriesWhere!]
              NOT: SeriesWhere
              OR: [SeriesWhere!]
              actors: SeriesActorsRelationshipFilters
              actorsAggregate: SeriesActorsAggregateInput
              actorsConnection: SeriesActorsConnectionFilters
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
              episodeCount: IntScalarFilters
              episodeCount_EQ: Int
              episodeCount_GT: Int
              episodeCount_GTE: Int
              episodeCount_IN: [Int!]
              episodeCount_LT: Int
              episodeCount_LTE: Int
              episodes: SeriesEpisodesRelationshipFilters
              episodesAggregate: SeriesEpisodesAggregateInput
              episodesConnection: SeriesEpisodesConnectionFilters
              \\"\\"\\"
              Return Series where all of the related SeriesEpisodesConnections match this filter
              \\"\\"\\"
              episodesConnection_ALL: SeriesEpisodesConnectionWhere
              \\"\\"\\"
              Return Series where none of the related SeriesEpisodesConnections match this filter
              \\"\\"\\"
              episodesConnection_NONE: SeriesEpisodesConnectionWhere
              \\"\\"\\"
              Return Series where one of the related SeriesEpisodesConnections match this filter
              \\"\\"\\"
              episodesConnection_SINGLE: SeriesEpisodesConnectionWhere
              \\"\\"\\"
              Return Series where some of the related SeriesEpisodesConnections match this filter
              \\"\\"\\"
              episodesConnection_SOME: SeriesEpisodesConnectionWhere
              \\"\\"\\"Return Series where all of the related Episodes match this filter\\"\\"\\"
              episodes_ALL: EpisodeWhere
              \\"\\"\\"Return Series where none of the related Episodes match this filter\\"\\"\\"
              episodes_NONE: EpisodeWhere
              \\"\\"\\"Return Series where one of the related Episodes match this filter\\"\\"\\"
              episodes_SINGLE: EpisodeWhere
              \\"\\"\\"Return Series where some of the related Episodes match this filter\\"\\"\\"
              episodes_SOME: EpisodeWhere
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

            type UpdateActorsMutationResponse {
              actors: [Actor!]!
              info: UpdateInfo!
            }

            type UpdateEpisodesMutationResponse {
              episodes: [Episode!]!
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

    test("Interface Relationships - multiple - different relationship implementations", async () => {
        const typeDefs = gql`
            type Episode @node {
                runtime: Int!
                series: [Series!]! @relationship(type: "HAS_EPISODE", direction: IN)
            }

            interface Production {
                title: String!
                actors: [Actor!]! @declareRelationship
            }

            type Movie implements Production @node {
                title: String!
                runtime: Int!
                actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN, properties: "ActedIn")
            }

            type Series implements Production @node {
                title: String!
                episodeCount: Int!
                episodes: [Episode!]! @relationship(type: "HAS_EPISODE", direction: OUT)
                actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN, properties: "StarredIn")
            }

            type ActedIn @relationshipProperties {
                screenTime: Int!
            }

            type StarredIn @relationshipProperties {
                seasons: Int!
            }

            type Actor @node {
                name: String!
                actedIn: [Production!]! @relationship(type: "ACTED_IN", direction: OUT, properties: "ActedIn")
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
            The edge properties for the following fields:
            * Movie.actors
            * Actor.actedIn
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

            input ActedInUpdateInput {
              screenTime_DECREMENT: Int
              screenTime_INCREMENT: Int
              screenTime_SET: Int
            }

            input ActedInWhere {
              AND: [ActedInWhere!]
              NOT: ActedInWhere
              OR: [ActedInWhere!]
              screenTime: IntScalarFilters
              screenTime_EQ: Int
              screenTime_GT: Int
              screenTime_GTE: Int
              screenTime_IN: [Int!]
              screenTime_LT: Int
              screenTime_LTE: Int
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
              edge: ActedInAggregationWhereInput
              node: ActorActedInNodeAggregationWhereInput
            }

            input ActorActedInConnectFieldInput {
              connect: ProductionConnectInput
              edge: ActedInCreateInput!
              where: ProductionConnectWhere
            }

            type ActorActedInConnection {
              edges: [ActorActedInRelationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input ActorActedInConnectionFilters {
              \\"\\"\\"
              Return Actors where all of the related ActorActedInConnections match this filter
              \\"\\"\\"
              all: ActorActedInConnectionWhere
              \\"\\"\\"
              Return Actors where none of the related ActorActedInConnections match this filter
              \\"\\"\\"
              none: ActorActedInConnectionWhere
              \\"\\"\\"
              Return Actors where one of the related ActorActedInConnections match this filter
              \\"\\"\\"
              single: ActorActedInConnectionWhere
              \\"\\"\\"
              Return Actors where some of the related ActorActedInConnections match this filter
              \\"\\"\\"
              some: ActorActedInConnectionWhere
            }

            input ActorActedInConnectionSort {
              edge: ActedInSort
              node: ProductionSort
            }

            input ActorActedInConnectionWhere {
              AND: [ActorActedInConnectionWhere!]
              NOT: ActorActedInConnectionWhere
              OR: [ActorActedInConnectionWhere!]
              edge: ActedInWhere
              node: ProductionWhere
            }

            input ActorActedInCreateFieldInput {
              edge: ActedInCreateInput!
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
              properties: ActedIn!
            }

            input ActorActedInRelationshipFilters {
              \\"\\"\\"Return Actors where all of the related Productions match this filter\\"\\"\\"
              all: ProductionWhere
              \\"\\"\\"Return Actors where none of the related Productions match this filter\\"\\"\\"
              none: ProductionWhere
              \\"\\"\\"Return Actors where one of the related Productions match this filter\\"\\"\\"
              single: ProductionWhere
              \\"\\"\\"Return Actors where some of the related Productions match this filter\\"\\"\\"
              some: ProductionWhere
            }

            input ActorActedInUpdateConnectionInput {
              edge: ActedInUpdateInput
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

            type ActorProductionActedInAggregationSelection {
              count: Int!
              edge: ActorProductionActedInEdgeAggregateSelection
              node: ActorProductionActedInNodeAggregateSelection
            }

            type ActorProductionActedInEdgeAggregateSelection {
              screenTime: IntAggregateSelection!
            }

            type ActorProductionActedInNodeAggregateSelection {
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
              name_SET: String
            }

            input ActorWhere {
              AND: [ActorWhere!]
              NOT: ActorWhere
              OR: [ActorWhere!]
              actedIn: ActorActedInRelationshipFilters
              actedInAggregate: ActorActedInAggregateInput
              actedInConnection: ActorActedInConnectionFilters
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

            type CreateEpisodesMutationResponse {
              episodes: [Episode!]!
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

            type Episode {
              runtime: Int!
              series(limit: Int, offset: Int, sort: [SeriesSort!], where: SeriesWhere): [Series!]!
              seriesAggregate(where: SeriesWhere): EpisodeSeriesSeriesAggregationSelection
              seriesConnection(after: String, first: Int, sort: [EpisodeSeriesConnectionSort!], where: EpisodeSeriesConnectionWhere): EpisodeSeriesConnection!
            }

            type EpisodeAggregateSelection {
              count: Int!
              runtime: IntAggregateSelection!
            }

            input EpisodeConnectInput {
              series: [EpisodeSeriesConnectFieldInput!]
            }

            input EpisodeConnectWhere {
              node: EpisodeWhere!
            }

            input EpisodeCreateInput {
              runtime: Int!
              series: EpisodeSeriesFieldInput
            }

            input EpisodeDeleteInput {
              series: [EpisodeSeriesDeleteFieldInput!]
            }

            input EpisodeDisconnectInput {
              series: [EpisodeSeriesDisconnectFieldInput!]
            }

            type EpisodeEdge {
              cursor: String!
              node: Episode!
            }

            input EpisodeSeriesAggregateInput {
              AND: [EpisodeSeriesAggregateInput!]
              NOT: EpisodeSeriesAggregateInput
              OR: [EpisodeSeriesAggregateInput!]
              count_EQ: Int
              count_GT: Int
              count_GTE: Int
              count_LT: Int
              count_LTE: Int
              node: EpisodeSeriesNodeAggregationWhereInput
            }

            input EpisodeSeriesConnectFieldInput {
              connect: [SeriesConnectInput!]
              where: SeriesConnectWhere
            }

            type EpisodeSeriesConnection {
              edges: [EpisodeSeriesRelationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input EpisodeSeriesConnectionFilters {
              \\"\\"\\"
              Return Episodes where all of the related EpisodeSeriesConnections match this filter
              \\"\\"\\"
              all: EpisodeSeriesConnectionWhere
              \\"\\"\\"
              Return Episodes where none of the related EpisodeSeriesConnections match this filter
              \\"\\"\\"
              none: EpisodeSeriesConnectionWhere
              \\"\\"\\"
              Return Episodes where one of the related EpisodeSeriesConnections match this filter
              \\"\\"\\"
              single: EpisodeSeriesConnectionWhere
              \\"\\"\\"
              Return Episodes where some of the related EpisodeSeriesConnections match this filter
              \\"\\"\\"
              some: EpisodeSeriesConnectionWhere
            }

            input EpisodeSeriesConnectionSort {
              node: SeriesSort
            }

            input EpisodeSeriesConnectionWhere {
              AND: [EpisodeSeriesConnectionWhere!]
              NOT: EpisodeSeriesConnectionWhere
              OR: [EpisodeSeriesConnectionWhere!]
              node: SeriesWhere
            }

            input EpisodeSeriesCreateFieldInput {
              node: SeriesCreateInput!
            }

            input EpisodeSeriesDeleteFieldInput {
              delete: SeriesDeleteInput
              where: EpisodeSeriesConnectionWhere
            }

            input EpisodeSeriesDisconnectFieldInput {
              disconnect: SeriesDisconnectInput
              where: EpisodeSeriesConnectionWhere
            }

            input EpisodeSeriesFieldInput {
              connect: [EpisodeSeriesConnectFieldInput!]
              create: [EpisodeSeriesCreateFieldInput!]
            }

            input EpisodeSeriesNodeAggregationWhereInput {
              AND: [EpisodeSeriesNodeAggregationWhereInput!]
              NOT: EpisodeSeriesNodeAggregationWhereInput
              OR: [EpisodeSeriesNodeAggregationWhereInput!]
              episodeCount_AVERAGE_EQUAL: Float
              episodeCount_AVERAGE_GT: Float
              episodeCount_AVERAGE_GTE: Float
              episodeCount_AVERAGE_LT: Float
              episodeCount_AVERAGE_LTE: Float
              episodeCount_MAX_EQUAL: Int
              episodeCount_MAX_GT: Int
              episodeCount_MAX_GTE: Int
              episodeCount_MAX_LT: Int
              episodeCount_MAX_LTE: Int
              episodeCount_MIN_EQUAL: Int
              episodeCount_MIN_GT: Int
              episodeCount_MIN_GTE: Int
              episodeCount_MIN_LT: Int
              episodeCount_MIN_LTE: Int
              episodeCount_SUM_EQUAL: Int
              episodeCount_SUM_GT: Int
              episodeCount_SUM_GTE: Int
              episodeCount_SUM_LT: Int
              episodeCount_SUM_LTE: Int
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

            type EpisodeSeriesRelationship {
              cursor: String!
              node: Series!
            }

            input EpisodeSeriesRelationshipFilters {
              \\"\\"\\"Return Episodes where all of the related Series match this filter\\"\\"\\"
              all: SeriesWhere
              \\"\\"\\"Return Episodes where none of the related Series match this filter\\"\\"\\"
              none: SeriesWhere
              \\"\\"\\"Return Episodes where one of the related Series match this filter\\"\\"\\"
              single: SeriesWhere
              \\"\\"\\"Return Episodes where some of the related Series match this filter\\"\\"\\"
              some: SeriesWhere
            }

            type EpisodeSeriesSeriesAggregationSelection {
              count: Int!
              node: EpisodeSeriesSeriesNodeAggregateSelection
            }

            type EpisodeSeriesSeriesNodeAggregateSelection {
              episodeCount: IntAggregateSelection!
              title: StringAggregateSelection!
            }

            input EpisodeSeriesUpdateConnectionInput {
              node: SeriesUpdateInput
            }

            input EpisodeSeriesUpdateFieldInput {
              connect: [EpisodeSeriesConnectFieldInput!]
              create: [EpisodeSeriesCreateFieldInput!]
              delete: [EpisodeSeriesDeleteFieldInput!]
              disconnect: [EpisodeSeriesDisconnectFieldInput!]
              update: EpisodeSeriesUpdateConnectionInput
              where: EpisodeSeriesConnectionWhere
            }

            \\"\\"\\"
            Fields to sort Episodes by. The order in which sorts are applied is not guaranteed when specifying many fields in one EpisodeSort object.
            \\"\\"\\"
            input EpisodeSort {
              runtime: SortDirection
            }

            input EpisodeUpdateInput {
              runtime_DECREMENT: Int
              runtime_INCREMENT: Int
              runtime_SET: Int
              series: [EpisodeSeriesUpdateFieldInput!]
            }

            input EpisodeWhere {
              AND: [EpisodeWhere!]
              NOT: EpisodeWhere
              OR: [EpisodeWhere!]
              runtime: IntScalarFilters
              runtime_EQ: Int
              runtime_GT: Int
              runtime_GTE: Int
              runtime_IN: [Int!]
              runtime_LT: Int
              runtime_LTE: Int
              series: EpisodeSeriesRelationshipFilters
              seriesAggregate: EpisodeSeriesAggregateInput
              seriesConnection: EpisodeSeriesConnectionFilters
              \\"\\"\\"
              Return Episodes where all of the related EpisodeSeriesConnections match this filter
              \\"\\"\\"
              seriesConnection_ALL: EpisodeSeriesConnectionWhere
              \\"\\"\\"
              Return Episodes where none of the related EpisodeSeriesConnections match this filter
              \\"\\"\\"
              seriesConnection_NONE: EpisodeSeriesConnectionWhere
              \\"\\"\\"
              Return Episodes where one of the related EpisodeSeriesConnections match this filter
              \\"\\"\\"
              seriesConnection_SINGLE: EpisodeSeriesConnectionWhere
              \\"\\"\\"
              Return Episodes where some of the related EpisodeSeriesConnections match this filter
              \\"\\"\\"
              seriesConnection_SOME: EpisodeSeriesConnectionWhere
              \\"\\"\\"Return Episodes where all of the related Series match this filter\\"\\"\\"
              series_ALL: SeriesWhere
              \\"\\"\\"Return Episodes where none of the related Series match this filter\\"\\"\\"
              series_NONE: SeriesWhere
              \\"\\"\\"Return Episodes where one of the related Series match this filter\\"\\"\\"
              series_SINGLE: SeriesWhere
              \\"\\"\\"Return Episodes where some of the related Series match this filter\\"\\"\\"
              series_SOME: SeriesWhere
            }

            type EpisodesConnection {
              edges: [EpisodeEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
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
              actors(limit: Int, offset: Int, sort: [ActorSort!], where: ActorWhere): [Actor!]!
              actorsAggregate(where: ActorWhere): MovieActorActorsAggregationSelection
              actorsConnection(after: String, first: Int, sort: [ProductionActorsConnectionSort!], where: ProductionActorsConnectionWhere): ProductionActorsConnection!
              runtime: Int!
              title: String!
            }

            type MovieActorActorsAggregationSelection {
              count: Int!
              edge: MovieActorActorsEdgeAggregateSelection
              node: MovieActorActorsNodeAggregateSelection
            }

            type MovieActorActorsEdgeAggregateSelection {
              screenTime: IntAggregateSelection!
            }

            type MovieActorActorsNodeAggregateSelection {
              name: StringAggregateSelection!
            }

            input MovieActorsAggregateInput {
              AND: [MovieActorsAggregateInput!]
              NOT: MovieActorsAggregateInput
              OR: [MovieActorsAggregateInput!]
              count_EQ: Int
              count_GT: Int
              count_GTE: Int
              count_LT: Int
              count_LTE: Int
              edge: ActedInAggregationWhereInput
              node: MovieActorsNodeAggregationWhereInput
            }

            input MovieActorsConnectFieldInput {
              connect: [ActorConnectInput!]
              edge: ActedInCreateInput!
              where: ActorConnectWhere
            }

            input MovieActorsConnectionFilters {
              \\"\\"\\"
              Return Movies where all of the related ProductionActorsConnections match this filter
              \\"\\"\\"
              all: ProductionActorsConnectionWhere
              \\"\\"\\"
              Return Movies where none of the related ProductionActorsConnections match this filter
              \\"\\"\\"
              none: ProductionActorsConnectionWhere
              \\"\\"\\"
              Return Movies where one of the related ProductionActorsConnections match this filter
              \\"\\"\\"
              single: ProductionActorsConnectionWhere
              \\"\\"\\"
              Return Movies where some of the related ProductionActorsConnections match this filter
              \\"\\"\\"
              some: ProductionActorsConnectionWhere
            }

            input MovieActorsCreateFieldInput {
              edge: ActedInCreateInput!
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
              name_AVERAGE_LENGTH_EQUAL: Float
              name_AVERAGE_LENGTH_GT: Float
              name_AVERAGE_LENGTH_GTE: Float
              name_AVERAGE_LENGTH_LT: Float
              name_AVERAGE_LENGTH_LTE: Float
              name_LONGEST_LENGTH_EQUAL: Int
              name_LONGEST_LENGTH_GT: Int
              name_LONGEST_LENGTH_GTE: Int
              name_LONGEST_LENGTH_LT: Int
              name_LONGEST_LENGTH_LTE: Int
              name_SHORTEST_LENGTH_EQUAL: Int
              name_SHORTEST_LENGTH_GT: Int
              name_SHORTEST_LENGTH_GTE: Int
              name_SHORTEST_LENGTH_LT: Int
              name_SHORTEST_LENGTH_LTE: Int
            }

            input MovieActorsRelationshipFilters {
              \\"\\"\\"Return Movies where all of the related Actors match this filter\\"\\"\\"
              all: ActorWhere
              \\"\\"\\"Return Movies where none of the related Actors match this filter\\"\\"\\"
              none: ActorWhere
              \\"\\"\\"Return Movies where one of the related Actors match this filter\\"\\"\\"
              single: ActorWhere
              \\"\\"\\"Return Movies where some of the related Actors match this filter\\"\\"\\"
              some: ActorWhere
            }

            input MovieActorsUpdateConnectionInput {
              edge: ActedInUpdateInput
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
              runtime: IntAggregateSelection!
              title: StringAggregateSelection!
            }

            input MovieCreateInput {
              actors: MovieActorsFieldInput
              runtime: Int!
              title: String!
            }

            input MovieDeleteInput {
              actors: [ProductionActorsDeleteFieldInput!]
            }

            type MovieEdge {
              cursor: String!
              node: Movie!
            }

            \\"\\"\\"
            Fields to sort Movies by. The order in which sorts are applied is not guaranteed when specifying many fields in one MovieSort object.
            \\"\\"\\"
            input MovieSort {
              runtime: SortDirection
              title: SortDirection
            }

            input MovieUpdateInput {
              actors: [MovieActorsUpdateFieldInput!]
              runtime_DECREMENT: Int
              runtime_INCREMENT: Int
              runtime_SET: Int
              title_SET: String
            }

            input MovieWhere {
              AND: [MovieWhere!]
              NOT: MovieWhere
              OR: [MovieWhere!]
              actors: MovieActorsRelationshipFilters
              actorsAggregate: MovieActorsAggregateInput
              actorsConnection: MovieActorsConnectionFilters
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
              runtime: IntScalarFilters
              runtime_EQ: Int
              runtime_GT: Int
              runtime_GTE: Int
              runtime_IN: [Int!]
              runtime_LT: Int
              runtime_LTE: Int
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
              createEpisodes(input: [EpisodeCreateInput!]!): CreateEpisodesMutationResponse!
              createMovies(input: [MovieCreateInput!]!): CreateMoviesMutationResponse!
              createSeries(input: [SeriesCreateInput!]!): CreateSeriesMutationResponse!
              deleteActors(delete: ActorDeleteInput, where: ActorWhere): DeleteInfo!
              deleteEpisodes(delete: EpisodeDeleteInput, where: EpisodeWhere): DeleteInfo!
              deleteMovies(delete: MovieDeleteInput, where: MovieWhere): DeleteInfo!
              deleteSeries(delete: SeriesDeleteInput, where: SeriesWhere): DeleteInfo!
              updateActors(update: ActorUpdateInput, where: ActorWhere): UpdateActorsMutationResponse!
              updateEpisodes(update: EpisodeUpdateInput, where: EpisodeWhere): UpdateEpisodesMutationResponse!
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
              actors(limit: Int, offset: Int, sort: [ActorSort!], where: ActorWhere): [Actor!]!
              actorsConnection(after: String, first: Int, sort: [ProductionActorsConnectionSort!], where: ProductionActorsConnectionWhere): ProductionActorsConnection!
              title: String!
            }

            input ProductionActorsAggregateInput {
              AND: [ProductionActorsAggregateInput!]
              NOT: ProductionActorsAggregateInput
              OR: [ProductionActorsAggregateInput!]
              count_EQ: Int
              count_GT: Int
              count_GTE: Int
              count_LT: Int
              count_LTE: Int
              edge: ProductionActorsEdgeAggregationWhereInput
              node: ProductionActorsNodeAggregationWhereInput
            }

            input ProductionActorsConnectFieldInput {
              connect: [ActorConnectInput!]
              edge: ProductionActorsEdgeCreateInput!
              where: ActorConnectWhere
            }

            type ProductionActorsConnection {
              edges: [ProductionActorsRelationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input ProductionActorsConnectionFilters {
              \\"\\"\\"
              Return Productions where all of the related ProductionActorsConnections match this filter
              \\"\\"\\"
              all: ProductionActorsConnectionWhere
              \\"\\"\\"
              Return Productions where none of the related ProductionActorsConnections match this filter
              \\"\\"\\"
              none: ProductionActorsConnectionWhere
              \\"\\"\\"
              Return Productions where one of the related ProductionActorsConnections match this filter
              \\"\\"\\"
              single: ProductionActorsConnectionWhere
              \\"\\"\\"
              Return Productions where some of the related ProductionActorsConnections match this filter
              \\"\\"\\"
              some: ProductionActorsConnectionWhere
            }

            input ProductionActorsConnectionSort {
              edge: ProductionActorsEdgeSort
              node: ActorSort
            }

            input ProductionActorsConnectionWhere {
              AND: [ProductionActorsConnectionWhere!]
              NOT: ProductionActorsConnectionWhere
              OR: [ProductionActorsConnectionWhere!]
              edge: ProductionActorsEdgeWhere
              node: ActorWhere
            }

            input ProductionActorsCreateFieldInput {
              edge: ProductionActorsEdgeCreateInput!
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

            input ProductionActorsEdgeAggregationWhereInput {
              \\"\\"\\"
              Relationship properties when source node is of type:
              * Movie
              \\"\\"\\"
              ActedIn: ActedInAggregationWhereInput
              \\"\\"\\"
              Relationship properties when source node is of type:
              * Series
              \\"\\"\\"
              StarredIn: StarredInAggregationWhereInput
            }

            input ProductionActorsEdgeCreateInput {
              \\"\\"\\"
              Relationship properties when source node is of type:
              * Movie
              \\"\\"\\"
              ActedIn: ActedInCreateInput!
              \\"\\"\\"
              Relationship properties when source node is of type:
              * Series
              \\"\\"\\"
              StarredIn: StarredInCreateInput!
            }

            input ProductionActorsEdgeSort {
              \\"\\"\\"
              Relationship properties when source node is of type:
              * Movie
              \\"\\"\\"
              ActedIn: ActedInSort
              \\"\\"\\"
              Relationship properties when source node is of type:
              * Series
              \\"\\"\\"
              StarredIn: StarredInSort
            }

            input ProductionActorsEdgeUpdateInput {
              \\"\\"\\"
              Relationship properties when source node is of type:
              * Movie
              \\"\\"\\"
              ActedIn: ActedInUpdateInput
              \\"\\"\\"
              Relationship properties when source node is of type:
              * Series
              \\"\\"\\"
              StarredIn: StarredInUpdateInput
            }

            input ProductionActorsEdgeWhere {
              \\"\\"\\"
              Relationship properties when source node is of type:
              * Movie
              \\"\\"\\"
              ActedIn: ActedInWhere
              \\"\\"\\"
              Relationship properties when source node is of type:
              * Series
              \\"\\"\\"
              StarredIn: StarredInWhere
            }

            input ProductionActorsNodeAggregationWhereInput {
              AND: [ProductionActorsNodeAggregationWhereInput!]
              NOT: ProductionActorsNodeAggregationWhereInput
              OR: [ProductionActorsNodeAggregationWhereInput!]
              name_AVERAGE_LENGTH_EQUAL: Float
              name_AVERAGE_LENGTH_GT: Float
              name_AVERAGE_LENGTH_GTE: Float
              name_AVERAGE_LENGTH_LT: Float
              name_AVERAGE_LENGTH_LTE: Float
              name_LONGEST_LENGTH_EQUAL: Int
              name_LONGEST_LENGTH_GT: Int
              name_LONGEST_LENGTH_GTE: Int
              name_LONGEST_LENGTH_LT: Int
              name_LONGEST_LENGTH_LTE: Int
              name_SHORTEST_LENGTH_EQUAL: Int
              name_SHORTEST_LENGTH_GT: Int
              name_SHORTEST_LENGTH_GTE: Int
              name_SHORTEST_LENGTH_LT: Int
              name_SHORTEST_LENGTH_LTE: Int
            }

            type ProductionActorsRelationship {
              cursor: String!
              node: Actor!
              properties: ProductionActorsRelationshipProperties!
            }

            input ProductionActorsRelationshipFilters {
              \\"\\"\\"Return Productions where all of the related Actors match this filter\\"\\"\\"
              all: ActorWhere
              \\"\\"\\"Return Productions where none of the related Actors match this filter\\"\\"\\"
              none: ActorWhere
              \\"\\"\\"Return Productions where one of the related Actors match this filter\\"\\"\\"
              single: ActorWhere
              \\"\\"\\"Return Productions where some of the related Actors match this filter\\"\\"\\"
              some: ActorWhere
            }

            union ProductionActorsRelationshipProperties = ActedIn | StarredIn

            input ProductionActorsUpdateConnectionInput {
              edge: ProductionActorsEdgeUpdateInput
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

            \\"\\"\\"
            Fields to sort Productions by. The order in which sorts are applied is not guaranteed when specifying many fields in one ProductionSort object.
            \\"\\"\\"
            input ProductionSort {
              title: SortDirection
            }

            input ProductionUpdateInput {
              actors: [ProductionActorsUpdateFieldInput!]
              title_SET: String
            }

            input ProductionWhere {
              AND: [ProductionWhere!]
              NOT: ProductionWhere
              OR: [ProductionWhere!]
              actors: ProductionActorsRelationshipFilters
              actorsAggregate: ProductionActorsAggregateInput
              actorsConnection: ProductionActorsConnectionFilters
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
              episodes(limit: Int, offset: Int, sort: [EpisodeSort!], where: EpisodeWhere): [Episode!]!
              episodesAggregate(where: EpisodeWhere): EpisodeAggregateSelection!
              episodesConnection(after: String, first: Int, sort: [EpisodeSort!], where: EpisodeWhere): EpisodesConnection!
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
              actors(limit: Int, offset: Int, sort: [ActorSort!], where: ActorWhere): [Actor!]!
              actorsAggregate(where: ActorWhere): SeriesActorActorsAggregationSelection
              actorsConnection(after: String, first: Int, sort: [ProductionActorsConnectionSort!], where: ProductionActorsConnectionWhere): ProductionActorsConnection!
              episodeCount: Int!
              episodes(limit: Int, offset: Int, sort: [EpisodeSort!], where: EpisodeWhere): [Episode!]!
              episodesAggregate(where: EpisodeWhere): SeriesEpisodeEpisodesAggregationSelection
              episodesConnection(after: String, first: Int, sort: [SeriesEpisodesConnectionSort!], where: SeriesEpisodesConnectionWhere): SeriesEpisodesConnection!
              title: String!
            }

            type SeriesActorActorsAggregationSelection {
              count: Int!
              edge: SeriesActorActorsEdgeAggregateSelection
              node: SeriesActorActorsNodeAggregateSelection
            }

            type SeriesActorActorsEdgeAggregateSelection {
              seasons: IntAggregateSelection!
            }

            type SeriesActorActorsNodeAggregateSelection {
              name: StringAggregateSelection!
            }

            input SeriesActorsAggregateInput {
              AND: [SeriesActorsAggregateInput!]
              NOT: SeriesActorsAggregateInput
              OR: [SeriesActorsAggregateInput!]
              count_EQ: Int
              count_GT: Int
              count_GTE: Int
              count_LT: Int
              count_LTE: Int
              edge: StarredInAggregationWhereInput
              node: SeriesActorsNodeAggregationWhereInput
            }

            input SeriesActorsConnectFieldInput {
              connect: [ActorConnectInput!]
              edge: StarredInCreateInput!
              where: ActorConnectWhere
            }

            input SeriesActorsConnectionFilters {
              \\"\\"\\"
              Return Series where all of the related ProductionActorsConnections match this filter
              \\"\\"\\"
              all: ProductionActorsConnectionWhere
              \\"\\"\\"
              Return Series where none of the related ProductionActorsConnections match this filter
              \\"\\"\\"
              none: ProductionActorsConnectionWhere
              \\"\\"\\"
              Return Series where one of the related ProductionActorsConnections match this filter
              \\"\\"\\"
              single: ProductionActorsConnectionWhere
              \\"\\"\\"
              Return Series where some of the related ProductionActorsConnections match this filter
              \\"\\"\\"
              some: ProductionActorsConnectionWhere
            }

            input SeriesActorsCreateFieldInput {
              edge: StarredInCreateInput!
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
              name_AVERAGE_LENGTH_EQUAL: Float
              name_AVERAGE_LENGTH_GT: Float
              name_AVERAGE_LENGTH_GTE: Float
              name_AVERAGE_LENGTH_LT: Float
              name_AVERAGE_LENGTH_LTE: Float
              name_LONGEST_LENGTH_EQUAL: Int
              name_LONGEST_LENGTH_GT: Int
              name_LONGEST_LENGTH_GTE: Int
              name_LONGEST_LENGTH_LT: Int
              name_LONGEST_LENGTH_LTE: Int
              name_SHORTEST_LENGTH_EQUAL: Int
              name_SHORTEST_LENGTH_GT: Int
              name_SHORTEST_LENGTH_GTE: Int
              name_SHORTEST_LENGTH_LT: Int
              name_SHORTEST_LENGTH_LTE: Int
            }

            input SeriesActorsRelationshipFilters {
              \\"\\"\\"Return Series where all of the related Actors match this filter\\"\\"\\"
              all: ActorWhere
              \\"\\"\\"Return Series where none of the related Actors match this filter\\"\\"\\"
              none: ActorWhere
              \\"\\"\\"Return Series where one of the related Actors match this filter\\"\\"\\"
              single: ActorWhere
              \\"\\"\\"Return Series where some of the related Actors match this filter\\"\\"\\"
              some: ActorWhere
            }

            input SeriesActorsUpdateConnectionInput {
              edge: StarredInUpdateInput
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
              episodeCount: IntAggregateSelection!
              title: StringAggregateSelection!
            }

            input SeriesConnectInput {
              actors: [SeriesActorsConnectFieldInput!]
              episodes: [SeriesEpisodesConnectFieldInput!]
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
              actors: SeriesActorsFieldInput
              episodeCount: Int!
              episodes: SeriesEpisodesFieldInput
              title: String!
            }

            input SeriesDeleteInput {
              actors: [ProductionActorsDeleteFieldInput!]
              episodes: [SeriesEpisodesDeleteFieldInput!]
            }

            input SeriesDisconnectInput {
              actors: [ProductionActorsDisconnectFieldInput!]
              episodes: [SeriesEpisodesDisconnectFieldInput!]
            }

            type SeriesEdge {
              cursor: String!
              node: Series!
            }

            type SeriesEpisodeEpisodesAggregationSelection {
              count: Int!
              node: SeriesEpisodeEpisodesNodeAggregateSelection
            }

            type SeriesEpisodeEpisodesNodeAggregateSelection {
              runtime: IntAggregateSelection!
            }

            input SeriesEpisodesAggregateInput {
              AND: [SeriesEpisodesAggregateInput!]
              NOT: SeriesEpisodesAggregateInput
              OR: [SeriesEpisodesAggregateInput!]
              count_EQ: Int
              count_GT: Int
              count_GTE: Int
              count_LT: Int
              count_LTE: Int
              node: SeriesEpisodesNodeAggregationWhereInput
            }

            input SeriesEpisodesConnectFieldInput {
              connect: [EpisodeConnectInput!]
              where: EpisodeConnectWhere
            }

            type SeriesEpisodesConnection {
              edges: [SeriesEpisodesRelationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input SeriesEpisodesConnectionFilters {
              \\"\\"\\"
              Return Series where all of the related SeriesEpisodesConnections match this filter
              \\"\\"\\"
              all: SeriesEpisodesConnectionWhere
              \\"\\"\\"
              Return Series where none of the related SeriesEpisodesConnections match this filter
              \\"\\"\\"
              none: SeriesEpisodesConnectionWhere
              \\"\\"\\"
              Return Series where one of the related SeriesEpisodesConnections match this filter
              \\"\\"\\"
              single: SeriesEpisodesConnectionWhere
              \\"\\"\\"
              Return Series where some of the related SeriesEpisodesConnections match this filter
              \\"\\"\\"
              some: SeriesEpisodesConnectionWhere
            }

            input SeriesEpisodesConnectionSort {
              node: EpisodeSort
            }

            input SeriesEpisodesConnectionWhere {
              AND: [SeriesEpisodesConnectionWhere!]
              NOT: SeriesEpisodesConnectionWhere
              OR: [SeriesEpisodesConnectionWhere!]
              node: EpisodeWhere
            }

            input SeriesEpisodesCreateFieldInput {
              node: EpisodeCreateInput!
            }

            input SeriesEpisodesDeleteFieldInput {
              delete: EpisodeDeleteInput
              where: SeriesEpisodesConnectionWhere
            }

            input SeriesEpisodesDisconnectFieldInput {
              disconnect: EpisodeDisconnectInput
              where: SeriesEpisodesConnectionWhere
            }

            input SeriesEpisodesFieldInput {
              connect: [SeriesEpisodesConnectFieldInput!]
              create: [SeriesEpisodesCreateFieldInput!]
            }

            input SeriesEpisodesNodeAggregationWhereInput {
              AND: [SeriesEpisodesNodeAggregationWhereInput!]
              NOT: SeriesEpisodesNodeAggregationWhereInput
              OR: [SeriesEpisodesNodeAggregationWhereInput!]
              runtime_AVERAGE_EQUAL: Float
              runtime_AVERAGE_GT: Float
              runtime_AVERAGE_GTE: Float
              runtime_AVERAGE_LT: Float
              runtime_AVERAGE_LTE: Float
              runtime_MAX_EQUAL: Int
              runtime_MAX_GT: Int
              runtime_MAX_GTE: Int
              runtime_MAX_LT: Int
              runtime_MAX_LTE: Int
              runtime_MIN_EQUAL: Int
              runtime_MIN_GT: Int
              runtime_MIN_GTE: Int
              runtime_MIN_LT: Int
              runtime_MIN_LTE: Int
              runtime_SUM_EQUAL: Int
              runtime_SUM_GT: Int
              runtime_SUM_GTE: Int
              runtime_SUM_LT: Int
              runtime_SUM_LTE: Int
            }

            type SeriesEpisodesRelationship {
              cursor: String!
              node: Episode!
            }

            input SeriesEpisodesRelationshipFilters {
              \\"\\"\\"Return Series where all of the related Episodes match this filter\\"\\"\\"
              all: EpisodeWhere
              \\"\\"\\"Return Series where none of the related Episodes match this filter\\"\\"\\"
              none: EpisodeWhere
              \\"\\"\\"Return Series where one of the related Episodes match this filter\\"\\"\\"
              single: EpisodeWhere
              \\"\\"\\"Return Series where some of the related Episodes match this filter\\"\\"\\"
              some: EpisodeWhere
            }

            input SeriesEpisodesUpdateConnectionInput {
              node: EpisodeUpdateInput
            }

            input SeriesEpisodesUpdateFieldInput {
              connect: [SeriesEpisodesConnectFieldInput!]
              create: [SeriesEpisodesCreateFieldInput!]
              delete: [SeriesEpisodesDeleteFieldInput!]
              disconnect: [SeriesEpisodesDisconnectFieldInput!]
              update: SeriesEpisodesUpdateConnectionInput
              where: SeriesEpisodesConnectionWhere
            }

            \\"\\"\\"
            Fields to sort Series by. The order in which sorts are applied is not guaranteed when specifying many fields in one SeriesSort object.
            \\"\\"\\"
            input SeriesSort {
              episodeCount: SortDirection
              title: SortDirection
            }

            input SeriesUpdateInput {
              actors: [SeriesActorsUpdateFieldInput!]
              episodeCount_DECREMENT: Int
              episodeCount_INCREMENT: Int
              episodeCount_SET: Int
              episodes: [SeriesEpisodesUpdateFieldInput!]
              title_SET: String
            }

            input SeriesWhere {
              AND: [SeriesWhere!]
              NOT: SeriesWhere
              OR: [SeriesWhere!]
              actors: SeriesActorsRelationshipFilters
              actorsAggregate: SeriesActorsAggregateInput
              actorsConnection: SeriesActorsConnectionFilters
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
              episodeCount: IntScalarFilters
              episodeCount_EQ: Int
              episodeCount_GT: Int
              episodeCount_GTE: Int
              episodeCount_IN: [Int!]
              episodeCount_LT: Int
              episodeCount_LTE: Int
              episodes: SeriesEpisodesRelationshipFilters
              episodesAggregate: SeriesEpisodesAggregateInput
              episodesConnection: SeriesEpisodesConnectionFilters
              \\"\\"\\"
              Return Series where all of the related SeriesEpisodesConnections match this filter
              \\"\\"\\"
              episodesConnection_ALL: SeriesEpisodesConnectionWhere
              \\"\\"\\"
              Return Series where none of the related SeriesEpisodesConnections match this filter
              \\"\\"\\"
              episodesConnection_NONE: SeriesEpisodesConnectionWhere
              \\"\\"\\"
              Return Series where one of the related SeriesEpisodesConnections match this filter
              \\"\\"\\"
              episodesConnection_SINGLE: SeriesEpisodesConnectionWhere
              \\"\\"\\"
              Return Series where some of the related SeriesEpisodesConnections match this filter
              \\"\\"\\"
              episodesConnection_SOME: SeriesEpisodesConnectionWhere
              \\"\\"\\"Return Series where all of the related Episodes match this filter\\"\\"\\"
              episodes_ALL: EpisodeWhere
              \\"\\"\\"Return Series where none of the related Episodes match this filter\\"\\"\\"
              episodes_NONE: EpisodeWhere
              \\"\\"\\"Return Series where one of the related Episodes match this filter\\"\\"\\"
              episodes_SINGLE: EpisodeWhere
              \\"\\"\\"Return Series where some of the related Episodes match this filter\\"\\"\\"
              episodes_SOME: EpisodeWhere
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

            \\"\\"\\"
            The edge properties for the following fields:
            * Series.actors
            \\"\\"\\"
            type StarredIn {
              seasons: Int!
            }

            input StarredInAggregationWhereInput {
              AND: [StarredInAggregationWhereInput!]
              NOT: StarredInAggregationWhereInput
              OR: [StarredInAggregationWhereInput!]
              seasons_AVERAGE_EQUAL: Float
              seasons_AVERAGE_GT: Float
              seasons_AVERAGE_GTE: Float
              seasons_AVERAGE_LT: Float
              seasons_AVERAGE_LTE: Float
              seasons_MAX_EQUAL: Int
              seasons_MAX_GT: Int
              seasons_MAX_GTE: Int
              seasons_MAX_LT: Int
              seasons_MAX_LTE: Int
              seasons_MIN_EQUAL: Int
              seasons_MIN_GT: Int
              seasons_MIN_GTE: Int
              seasons_MIN_LT: Int
              seasons_MIN_LTE: Int
              seasons_SUM_EQUAL: Int
              seasons_SUM_GT: Int
              seasons_SUM_GTE: Int
              seasons_SUM_LT: Int
              seasons_SUM_LTE: Int
            }

            input StarredInCreateInput {
              seasons: Int!
            }

            input StarredInSort {
              seasons: SortDirection
            }

            input StarredInUpdateInput {
              seasons_DECREMENT: Int
              seasons_INCREMENT: Int
              seasons_SET: Int
            }

            input StarredInWhere {
              AND: [StarredInWhere!]
              NOT: StarredInWhere
              OR: [StarredInWhere!]
              seasons: IntScalarFilters
              seasons_EQ: Int
              seasons_GT: Int
              seasons_GTE: Int
              seasons_IN: [Int!]
              seasons_LT: Int
              seasons_LTE: Int
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

            type UpdateActorsMutationResponse {
              actors: [Actor!]!
              info: UpdateInfo!
            }

            type UpdateEpisodesMutationResponse {
              episodes: [Episode!]!
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

    test("Interface Relationships - nested interface relationships", async () => {
        const typeDefs = gql`
            interface Interface1 {
                field1: String!
                interface2: [Interface2!]! @declareRelationship
            }

            interface Interface2 {
                field2: String
            }

            type Type1Interface1 implements Interface1 @node {
                field1: String!
                interface2: [Interface2!]! @relationship(type: "INTERFACE_TWO", direction: OUT)
            }

            type Type2Interface1 implements Interface1 @node {
                field1: String!
                interface2: [Interface2!]! @relationship(type: "INTERFACE_TWO", direction: OUT)
            }

            type Type1Interface2 implements Interface2 @node {
                field2: String!
            }

            type Type2Interface2 implements Interface2 @node {
                field2: String!
            }

            type Type1 @node {
                field1: String!
                interface1: [Interface1!]! @relationship(type: "INTERFACE_ONE", direction: OUT)
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

            type CreateType1Interface1sMutationResponse {
              info: CreateInfo!
              type1Interface1s: [Type1Interface1!]!
            }

            type CreateType1Interface2sMutationResponse {
              info: CreateInfo!
              type1Interface2s: [Type1Interface2!]!
            }

            type CreateType1sMutationResponse {
              info: CreateInfo!
              type1s: [Type1!]!
            }

            type CreateType2Interface1sMutationResponse {
              info: CreateInfo!
              type2Interface1s: [Type2Interface1!]!
            }

            type CreateType2Interface2sMutationResponse {
              info: CreateInfo!
              type2Interface2s: [Type2Interface2!]!
            }

            \\"\\"\\"
            Information about the number of nodes and relationships deleted during a delete mutation
            \\"\\"\\"
            type DeleteInfo {
              nodesDeleted: Int!
              relationshipsDeleted: Int!
            }

            interface Interface1 {
              field1: String!
              interface2(limit: Int, offset: Int, sort: [Interface2Sort!], where: Interface2Where): [Interface2!]!
              interface2Connection(after: String, first: Int, sort: [Interface1Interface2ConnectionSort!], where: Interface1Interface2ConnectionWhere): Interface1Interface2Connection!
            }

            type Interface1AggregateSelection {
              count: Int!
              field1: StringAggregateSelection!
            }

            input Interface1ConnectInput {
              interface2: [Interface1Interface2ConnectFieldInput!]
            }

            input Interface1ConnectWhere {
              node: Interface1Where!
            }

            input Interface1CreateInput {
              Type1Interface1: Type1Interface1CreateInput
              Type2Interface1: Type2Interface1CreateInput
            }

            input Interface1DeleteInput {
              interface2: [Interface1Interface2DeleteFieldInput!]
            }

            input Interface1DisconnectInput {
              interface2: [Interface1Interface2DisconnectFieldInput!]
            }

            type Interface1Edge {
              cursor: String!
              node: Interface1!
            }

            enum Interface1Implementation {
              Type1Interface1
              Type2Interface1
            }

            input Interface1Interface2AggregateInput {
              AND: [Interface1Interface2AggregateInput!]
              NOT: Interface1Interface2AggregateInput
              OR: [Interface1Interface2AggregateInput!]
              count_EQ: Int
              count_GT: Int
              count_GTE: Int
              count_LT: Int
              count_LTE: Int
              node: Interface1Interface2NodeAggregationWhereInput
            }

            input Interface1Interface2ConnectFieldInput {
              where: Interface2ConnectWhere
            }

            type Interface1Interface2Connection {
              edges: [Interface1Interface2Relationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input Interface1Interface2ConnectionFilters {
              \\"\\"\\"
              Return Interface1s where all of the related Interface1Interface2Connections match this filter
              \\"\\"\\"
              all: Interface1Interface2ConnectionWhere
              \\"\\"\\"
              Return Interface1s where none of the related Interface1Interface2Connections match this filter
              \\"\\"\\"
              none: Interface1Interface2ConnectionWhere
              \\"\\"\\"
              Return Interface1s where one of the related Interface1Interface2Connections match this filter
              \\"\\"\\"
              single: Interface1Interface2ConnectionWhere
              \\"\\"\\"
              Return Interface1s where some of the related Interface1Interface2Connections match this filter
              \\"\\"\\"
              some: Interface1Interface2ConnectionWhere
            }

            input Interface1Interface2ConnectionSort {
              node: Interface2Sort
            }

            input Interface1Interface2ConnectionWhere {
              AND: [Interface1Interface2ConnectionWhere!]
              NOT: Interface1Interface2ConnectionWhere
              OR: [Interface1Interface2ConnectionWhere!]
              node: Interface2Where
            }

            input Interface1Interface2CreateFieldInput {
              node: Interface2CreateInput!
            }

            input Interface1Interface2DeleteFieldInput {
              where: Interface1Interface2ConnectionWhere
            }

            input Interface1Interface2DisconnectFieldInput {
              where: Interface1Interface2ConnectionWhere
            }

            input Interface1Interface2NodeAggregationWhereInput {
              AND: [Interface1Interface2NodeAggregationWhereInput!]
              NOT: Interface1Interface2NodeAggregationWhereInput
              OR: [Interface1Interface2NodeAggregationWhereInput!]
              field2_AVERAGE_LENGTH_EQUAL: Float
              field2_AVERAGE_LENGTH_GT: Float
              field2_AVERAGE_LENGTH_GTE: Float
              field2_AVERAGE_LENGTH_LT: Float
              field2_AVERAGE_LENGTH_LTE: Float
              field2_LONGEST_LENGTH_EQUAL: Int
              field2_LONGEST_LENGTH_GT: Int
              field2_LONGEST_LENGTH_GTE: Int
              field2_LONGEST_LENGTH_LT: Int
              field2_LONGEST_LENGTH_LTE: Int
              field2_SHORTEST_LENGTH_EQUAL: Int
              field2_SHORTEST_LENGTH_GT: Int
              field2_SHORTEST_LENGTH_GTE: Int
              field2_SHORTEST_LENGTH_LT: Int
              field2_SHORTEST_LENGTH_LTE: Int
            }

            type Interface1Interface2Relationship {
              cursor: String!
              node: Interface2!
            }

            input Interface1Interface2RelationshipFilters {
              \\"\\"\\"
              Return Interface1s where all of the related Interface2s match this filter
              \\"\\"\\"
              all: Interface2Where
              \\"\\"\\"
              Return Interface1s where none of the related Interface2s match this filter
              \\"\\"\\"
              none: Interface2Where
              \\"\\"\\"
              Return Interface1s where one of the related Interface2s match this filter
              \\"\\"\\"
              single: Interface2Where
              \\"\\"\\"
              Return Interface1s where some of the related Interface2s match this filter
              \\"\\"\\"
              some: Interface2Where
            }

            input Interface1Interface2UpdateConnectionInput {
              node: Interface2UpdateInput
            }

            input Interface1Interface2UpdateFieldInput {
              connect: [Interface1Interface2ConnectFieldInput!]
              create: [Interface1Interface2CreateFieldInput!]
              delete: [Interface1Interface2DeleteFieldInput!]
              disconnect: [Interface1Interface2DisconnectFieldInput!]
              update: Interface1Interface2UpdateConnectionInput
              where: Interface1Interface2ConnectionWhere
            }

            \\"\\"\\"
            Fields to sort Interface1s by. The order in which sorts are applied is not guaranteed when specifying many fields in one Interface1Sort object.
            \\"\\"\\"
            input Interface1Sort {
              field1: SortDirection
            }

            input Interface1UpdateInput {
              field1_SET: String
              interface2: [Interface1Interface2UpdateFieldInput!]
            }

            input Interface1Where {
              AND: [Interface1Where!]
              NOT: Interface1Where
              OR: [Interface1Where!]
              field1: StringScalarFilters
              field1_CONTAINS: String
              field1_ENDS_WITH: String
              field1_EQ: String
              field1_IN: [String!]
              field1_STARTS_WITH: String
              interface2: Interface1Interface2RelationshipFilters
              interface2Aggregate: Interface1Interface2AggregateInput
              interface2Connection: Interface1Interface2ConnectionFilters
              \\"\\"\\"
              Return Interface1s where all of the related Interface1Interface2Connections match this filter
              \\"\\"\\"
              interface2Connection_ALL: Interface1Interface2ConnectionWhere
              \\"\\"\\"
              Return Interface1s where none of the related Interface1Interface2Connections match this filter
              \\"\\"\\"
              interface2Connection_NONE: Interface1Interface2ConnectionWhere
              \\"\\"\\"
              Return Interface1s where one of the related Interface1Interface2Connections match this filter
              \\"\\"\\"
              interface2Connection_SINGLE: Interface1Interface2ConnectionWhere
              \\"\\"\\"
              Return Interface1s where some of the related Interface1Interface2Connections match this filter
              \\"\\"\\"
              interface2Connection_SOME: Interface1Interface2ConnectionWhere
              \\"\\"\\"
              Return Interface1s where all of the related Interface2s match this filter
              \\"\\"\\"
              interface2_ALL: Interface2Where
              \\"\\"\\"
              Return Interface1s where none of the related Interface2s match this filter
              \\"\\"\\"
              interface2_NONE: Interface2Where
              \\"\\"\\"
              Return Interface1s where one of the related Interface2s match this filter
              \\"\\"\\"
              interface2_SINGLE: Interface2Where
              \\"\\"\\"
              Return Interface1s where some of the related Interface2s match this filter
              \\"\\"\\"
              interface2_SOME: Interface2Where
              typename_IN: [Interface1Implementation!]
            }

            type Interface1sConnection {
              edges: [Interface1Edge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            interface Interface2 {
              field2: String
            }

            type Interface2AggregateSelection {
              count: Int!
              field2: StringAggregateSelection!
            }

            input Interface2ConnectWhere {
              node: Interface2Where!
            }

            input Interface2CreateInput {
              Type1Interface2: Type1Interface2CreateInput
              Type2Interface2: Type2Interface2CreateInput
            }

            type Interface2Edge {
              cursor: String!
              node: Interface2!
            }

            enum Interface2Implementation {
              Type1Interface2
              Type2Interface2
            }

            \\"\\"\\"
            Fields to sort Interface2s by. The order in which sorts are applied is not guaranteed when specifying many fields in one Interface2Sort object.
            \\"\\"\\"
            input Interface2Sort {
              field2: SortDirection
            }

            input Interface2UpdateInput {
              field2_SET: String
            }

            input Interface2Where {
              AND: [Interface2Where!]
              NOT: Interface2Where
              OR: [Interface2Where!]
              field2: StringScalarFilters
              field2_CONTAINS: String
              field2_ENDS_WITH: String
              field2_EQ: String
              field2_IN: [String]
              field2_STARTS_WITH: String
              typename_IN: [Interface2Implementation!]
            }

            type Interface2sConnection {
              edges: [Interface2Edge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            type Mutation {
              createType1Interface1s(input: [Type1Interface1CreateInput!]!): CreateType1Interface1sMutationResponse!
              createType1Interface2s(input: [Type1Interface2CreateInput!]!): CreateType1Interface2sMutationResponse!
              createType1s(input: [Type1CreateInput!]!): CreateType1sMutationResponse!
              createType2Interface1s(input: [Type2Interface1CreateInput!]!): CreateType2Interface1sMutationResponse!
              createType2Interface2s(input: [Type2Interface2CreateInput!]!): CreateType2Interface2sMutationResponse!
              deleteType1Interface1s(delete: Type1Interface1DeleteInput, where: Type1Interface1Where): DeleteInfo!
              deleteType1Interface2s(where: Type1Interface2Where): DeleteInfo!
              deleteType1s(delete: Type1DeleteInput, where: Type1Where): DeleteInfo!
              deleteType2Interface1s(delete: Type2Interface1DeleteInput, where: Type2Interface1Where): DeleteInfo!
              deleteType2Interface2s(where: Type2Interface2Where): DeleteInfo!
              updateType1Interface1s(update: Type1Interface1UpdateInput, where: Type1Interface1Where): UpdateType1Interface1sMutationResponse!
              updateType1Interface2s(update: Type1Interface2UpdateInput, where: Type1Interface2Where): UpdateType1Interface2sMutationResponse!
              updateType1s(update: Type1UpdateInput, where: Type1Where): UpdateType1sMutationResponse!
              updateType2Interface1s(update: Type2Interface1UpdateInput, where: Type2Interface1Where): UpdateType2Interface1sMutationResponse!
              updateType2Interface2s(update: Type2Interface2UpdateInput, where: Type2Interface2Where): UpdateType2Interface2sMutationResponse!
            }

            \\"\\"\\"Pagination information (Relay)\\"\\"\\"
            type PageInfo {
              endCursor: String
              hasNextPage: Boolean!
              hasPreviousPage: Boolean!
              startCursor: String
            }

            type Query {
              interface1s(limit: Int, offset: Int, sort: [Interface1Sort!], where: Interface1Where): [Interface1!]!
              interface1sAggregate(where: Interface1Where): Interface1AggregateSelection!
              interface1sConnection(after: String, first: Int, sort: [Interface1Sort!], where: Interface1Where): Interface1sConnection!
              interface2s(limit: Int, offset: Int, sort: [Interface2Sort!], where: Interface2Where): [Interface2!]!
              interface2sAggregate(where: Interface2Where): Interface2AggregateSelection!
              interface2sConnection(after: String, first: Int, sort: [Interface2Sort!], where: Interface2Where): Interface2sConnection!
              type1Interface1s(limit: Int, offset: Int, sort: [Type1Interface1Sort!], where: Type1Interface1Where): [Type1Interface1!]!
              type1Interface1sAggregate(where: Type1Interface1Where): Type1Interface1AggregateSelection!
              type1Interface1sConnection(after: String, first: Int, sort: [Type1Interface1Sort!], where: Type1Interface1Where): Type1Interface1sConnection!
              type1Interface2s(limit: Int, offset: Int, sort: [Type1Interface2Sort!], where: Type1Interface2Where): [Type1Interface2!]!
              type1Interface2sAggregate(where: Type1Interface2Where): Type1Interface2AggregateSelection!
              type1Interface2sConnection(after: String, first: Int, sort: [Type1Interface2Sort!], where: Type1Interface2Where): Type1Interface2sConnection!
              type1s(limit: Int, offset: Int, sort: [Type1Sort!], where: Type1Where): [Type1!]!
              type1sAggregate(where: Type1Where): Type1AggregateSelection!
              type1sConnection(after: String, first: Int, sort: [Type1Sort!], where: Type1Where): Type1sConnection!
              type2Interface1s(limit: Int, offset: Int, sort: [Type2Interface1Sort!], where: Type2Interface1Where): [Type2Interface1!]!
              type2Interface1sAggregate(where: Type2Interface1Where): Type2Interface1AggregateSelection!
              type2Interface1sConnection(after: String, first: Int, sort: [Type2Interface1Sort!], where: Type2Interface1Where): Type2Interface1sConnection!
              type2Interface2s(limit: Int, offset: Int, sort: [Type2Interface2Sort!], where: Type2Interface2Where): [Type2Interface2!]!
              type2Interface2sAggregate(where: Type2Interface2Where): Type2Interface2AggregateSelection!
              type2Interface2sConnection(after: String, first: Int, sort: [Type2Interface2Sort!], where: Type2Interface2Where): Type2Interface2sConnection!
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

            type Type1 {
              field1: String!
              interface1(limit: Int, offset: Int, sort: [Interface1Sort!], where: Interface1Where): [Interface1!]!
              interface1Aggregate(where: Interface1Where): Type1Interface1Interface1AggregationSelection
              interface1Connection(after: String, first: Int, sort: [Type1Interface1ConnectionSort!], where: Type1Interface1ConnectionWhere): Type1Interface1Connection!
            }

            type Type1AggregateSelection {
              count: Int!
              field1: StringAggregateSelection!
            }

            input Type1CreateInput {
              field1: String!
              interface1: Type1Interface1FieldInput
            }

            input Type1DeleteInput {
              interface1: [Type1Interface1DeleteFieldInput!]
            }

            type Type1Edge {
              cursor: String!
              node: Type1!
            }

            type Type1Interface1 implements Interface1 {
              field1: String!
              interface2(limit: Int, offset: Int, sort: [Interface2Sort!], where: Interface2Where): [Interface2!]!
              interface2Aggregate(where: Interface2Where): Type1Interface1Interface2Interface2AggregationSelection
              interface2Connection(after: String, first: Int, sort: [Interface1Interface2ConnectionSort!], where: Interface1Interface2ConnectionWhere): Interface1Interface2Connection!
            }

            input Type1Interface1AggregateInput {
              AND: [Type1Interface1AggregateInput!]
              NOT: Type1Interface1AggregateInput
              OR: [Type1Interface1AggregateInput!]
              count_EQ: Int
              count_GT: Int
              count_GTE: Int
              count_LT: Int
              count_LTE: Int
              node: Type1Interface1NodeAggregationWhereInput
            }

            type Type1Interface1AggregateSelection {
              count: Int!
              field1: StringAggregateSelection!
            }

            input Type1Interface1ConnectFieldInput {
              connect: Interface1ConnectInput
              where: Interface1ConnectWhere
            }

            type Type1Interface1Connection {
              edges: [Type1Interface1Relationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input Type1Interface1ConnectionFilters {
              \\"\\"\\"
              Return Type1s where all of the related Type1Interface1Connections match this filter
              \\"\\"\\"
              all: Type1Interface1ConnectionWhere
              \\"\\"\\"
              Return Type1s where none of the related Type1Interface1Connections match this filter
              \\"\\"\\"
              none: Type1Interface1ConnectionWhere
              \\"\\"\\"
              Return Type1s where one of the related Type1Interface1Connections match this filter
              \\"\\"\\"
              single: Type1Interface1ConnectionWhere
              \\"\\"\\"
              Return Type1s where some of the related Type1Interface1Connections match this filter
              \\"\\"\\"
              some: Type1Interface1ConnectionWhere
            }

            input Type1Interface1ConnectionSort {
              node: Interface1Sort
            }

            input Type1Interface1ConnectionWhere {
              AND: [Type1Interface1ConnectionWhere!]
              NOT: Type1Interface1ConnectionWhere
              OR: [Type1Interface1ConnectionWhere!]
              node: Interface1Where
            }

            input Type1Interface1CreateFieldInput {
              node: Interface1CreateInput!
            }

            input Type1Interface1CreateInput {
              field1: String!
              interface2: Type1Interface1Interface2FieldInput
            }

            input Type1Interface1DeleteFieldInput {
              delete: Interface1DeleteInput
              where: Type1Interface1ConnectionWhere
            }

            input Type1Interface1DeleteInput {
              interface2: [Type1Interface1Interface2DeleteFieldInput!]
            }

            input Type1Interface1DisconnectFieldInput {
              disconnect: Interface1DisconnectInput
              where: Type1Interface1ConnectionWhere
            }

            type Type1Interface1Edge {
              cursor: String!
              node: Type1Interface1!
            }

            input Type1Interface1FieldInput {
              connect: [Type1Interface1ConnectFieldInput!]
              create: [Type1Interface1CreateFieldInput!]
            }

            type Type1Interface1Interface1AggregationSelection {
              count: Int!
              node: Type1Interface1Interface1NodeAggregateSelection
            }

            type Type1Interface1Interface1NodeAggregateSelection {
              field1: StringAggregateSelection!
            }

            input Type1Interface1Interface2AggregateInput {
              AND: [Type1Interface1Interface2AggregateInput!]
              NOT: Type1Interface1Interface2AggregateInput
              OR: [Type1Interface1Interface2AggregateInput!]
              count_EQ: Int
              count_GT: Int
              count_GTE: Int
              count_LT: Int
              count_LTE: Int
              node: Type1Interface1Interface2NodeAggregationWhereInput
            }

            input Type1Interface1Interface2ConnectFieldInput {
              where: Interface2ConnectWhere
            }

            input Type1Interface1Interface2ConnectionFilters {
              \\"\\"\\"
              Return Type1Interface1s where all of the related Interface1Interface2Connections match this filter
              \\"\\"\\"
              all: Interface1Interface2ConnectionWhere
              \\"\\"\\"
              Return Type1Interface1s where none of the related Interface1Interface2Connections match this filter
              \\"\\"\\"
              none: Interface1Interface2ConnectionWhere
              \\"\\"\\"
              Return Type1Interface1s where one of the related Interface1Interface2Connections match this filter
              \\"\\"\\"
              single: Interface1Interface2ConnectionWhere
              \\"\\"\\"
              Return Type1Interface1s where some of the related Interface1Interface2Connections match this filter
              \\"\\"\\"
              some: Interface1Interface2ConnectionWhere
            }

            input Type1Interface1Interface2CreateFieldInput {
              node: Interface2CreateInput!
            }

            input Type1Interface1Interface2DeleteFieldInput {
              where: Interface1Interface2ConnectionWhere
            }

            input Type1Interface1Interface2DisconnectFieldInput {
              where: Interface1Interface2ConnectionWhere
            }

            input Type1Interface1Interface2FieldInput {
              connect: [Type1Interface1Interface2ConnectFieldInput!]
              create: [Type1Interface1Interface2CreateFieldInput!]
            }

            type Type1Interface1Interface2Interface2AggregationSelection {
              count: Int!
              node: Type1Interface1Interface2Interface2NodeAggregateSelection
            }

            type Type1Interface1Interface2Interface2NodeAggregateSelection {
              field2: StringAggregateSelection!
            }

            input Type1Interface1Interface2NodeAggregationWhereInput {
              AND: [Type1Interface1Interface2NodeAggregationWhereInput!]
              NOT: Type1Interface1Interface2NodeAggregationWhereInput
              OR: [Type1Interface1Interface2NodeAggregationWhereInput!]
              field2_AVERAGE_LENGTH_EQUAL: Float
              field2_AVERAGE_LENGTH_GT: Float
              field2_AVERAGE_LENGTH_GTE: Float
              field2_AVERAGE_LENGTH_LT: Float
              field2_AVERAGE_LENGTH_LTE: Float
              field2_LONGEST_LENGTH_EQUAL: Int
              field2_LONGEST_LENGTH_GT: Int
              field2_LONGEST_LENGTH_GTE: Int
              field2_LONGEST_LENGTH_LT: Int
              field2_LONGEST_LENGTH_LTE: Int
              field2_SHORTEST_LENGTH_EQUAL: Int
              field2_SHORTEST_LENGTH_GT: Int
              field2_SHORTEST_LENGTH_GTE: Int
              field2_SHORTEST_LENGTH_LT: Int
              field2_SHORTEST_LENGTH_LTE: Int
            }

            input Type1Interface1Interface2RelationshipFilters {
              \\"\\"\\"
              Return Type1Interface1s where all of the related Interface2s match this filter
              \\"\\"\\"
              all: Interface2Where
              \\"\\"\\"
              Return Type1Interface1s where none of the related Interface2s match this filter
              \\"\\"\\"
              none: Interface2Where
              \\"\\"\\"
              Return Type1Interface1s where one of the related Interface2s match this filter
              \\"\\"\\"
              single: Interface2Where
              \\"\\"\\"
              Return Type1Interface1s where some of the related Interface2s match this filter
              \\"\\"\\"
              some: Interface2Where
            }

            input Type1Interface1Interface2UpdateConnectionInput {
              node: Interface2UpdateInput
            }

            input Type1Interface1Interface2UpdateFieldInput {
              connect: [Type1Interface1Interface2ConnectFieldInput!]
              create: [Type1Interface1Interface2CreateFieldInput!]
              delete: [Type1Interface1Interface2DeleteFieldInput!]
              disconnect: [Type1Interface1Interface2DisconnectFieldInput!]
              update: Type1Interface1Interface2UpdateConnectionInput
              where: Interface1Interface2ConnectionWhere
            }

            input Type1Interface1NodeAggregationWhereInput {
              AND: [Type1Interface1NodeAggregationWhereInput!]
              NOT: Type1Interface1NodeAggregationWhereInput
              OR: [Type1Interface1NodeAggregationWhereInput!]
              field1_AVERAGE_LENGTH_EQUAL: Float
              field1_AVERAGE_LENGTH_GT: Float
              field1_AVERAGE_LENGTH_GTE: Float
              field1_AVERAGE_LENGTH_LT: Float
              field1_AVERAGE_LENGTH_LTE: Float
              field1_LONGEST_LENGTH_EQUAL: Int
              field1_LONGEST_LENGTH_GT: Int
              field1_LONGEST_LENGTH_GTE: Int
              field1_LONGEST_LENGTH_LT: Int
              field1_LONGEST_LENGTH_LTE: Int
              field1_SHORTEST_LENGTH_EQUAL: Int
              field1_SHORTEST_LENGTH_GT: Int
              field1_SHORTEST_LENGTH_GTE: Int
              field1_SHORTEST_LENGTH_LT: Int
              field1_SHORTEST_LENGTH_LTE: Int
            }

            type Type1Interface1Relationship {
              cursor: String!
              node: Interface1!
            }

            input Type1Interface1RelationshipFilters {
              \\"\\"\\"Return Type1s where all of the related Interface1s match this filter\\"\\"\\"
              all: Interface1Where
              \\"\\"\\"Return Type1s where none of the related Interface1s match this filter\\"\\"\\"
              none: Interface1Where
              \\"\\"\\"Return Type1s where one of the related Interface1s match this filter\\"\\"\\"
              single: Interface1Where
              \\"\\"\\"Return Type1s where some of the related Interface1s match this filter\\"\\"\\"
              some: Interface1Where
            }

            \\"\\"\\"
            Fields to sort Type1Interface1s by. The order in which sorts are applied is not guaranteed when specifying many fields in one Type1Interface1Sort object.
            \\"\\"\\"
            input Type1Interface1Sort {
              field1: SortDirection
            }

            input Type1Interface1UpdateConnectionInput {
              node: Interface1UpdateInput
            }

            input Type1Interface1UpdateFieldInput {
              connect: [Type1Interface1ConnectFieldInput!]
              create: [Type1Interface1CreateFieldInput!]
              delete: [Type1Interface1DeleteFieldInput!]
              disconnect: [Type1Interface1DisconnectFieldInput!]
              update: Type1Interface1UpdateConnectionInput
              where: Type1Interface1ConnectionWhere
            }

            input Type1Interface1UpdateInput {
              field1_SET: String
              interface2: [Type1Interface1Interface2UpdateFieldInput!]
            }

            input Type1Interface1Where {
              AND: [Type1Interface1Where!]
              NOT: Type1Interface1Where
              OR: [Type1Interface1Where!]
              field1: StringScalarFilters
              field1_CONTAINS: String
              field1_ENDS_WITH: String
              field1_EQ: String
              field1_IN: [String!]
              field1_STARTS_WITH: String
              interface2: Type1Interface1Interface2RelationshipFilters
              interface2Aggregate: Type1Interface1Interface2AggregateInput
              interface2Connection: Type1Interface1Interface2ConnectionFilters
              \\"\\"\\"
              Return Type1Interface1s where all of the related Interface1Interface2Connections match this filter
              \\"\\"\\"
              interface2Connection_ALL: Interface1Interface2ConnectionWhere
              \\"\\"\\"
              Return Type1Interface1s where none of the related Interface1Interface2Connections match this filter
              \\"\\"\\"
              interface2Connection_NONE: Interface1Interface2ConnectionWhere
              \\"\\"\\"
              Return Type1Interface1s where one of the related Interface1Interface2Connections match this filter
              \\"\\"\\"
              interface2Connection_SINGLE: Interface1Interface2ConnectionWhere
              \\"\\"\\"
              Return Type1Interface1s where some of the related Interface1Interface2Connections match this filter
              \\"\\"\\"
              interface2Connection_SOME: Interface1Interface2ConnectionWhere
              \\"\\"\\"
              Return Type1Interface1s where all of the related Interface2s match this filter
              \\"\\"\\"
              interface2_ALL: Interface2Where
              \\"\\"\\"
              Return Type1Interface1s where none of the related Interface2s match this filter
              \\"\\"\\"
              interface2_NONE: Interface2Where
              \\"\\"\\"
              Return Type1Interface1s where one of the related Interface2s match this filter
              \\"\\"\\"
              interface2_SINGLE: Interface2Where
              \\"\\"\\"
              Return Type1Interface1s where some of the related Interface2s match this filter
              \\"\\"\\"
              interface2_SOME: Interface2Where
            }

            type Type1Interface1sConnection {
              edges: [Type1Interface1Edge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            type Type1Interface2 implements Interface2 {
              field2: String!
            }

            type Type1Interface2AggregateSelection {
              count: Int!
              field2: StringAggregateSelection!
            }

            input Type1Interface2CreateInput {
              field2: String!
            }

            type Type1Interface2Edge {
              cursor: String!
              node: Type1Interface2!
            }

            \\"\\"\\"
            Fields to sort Type1Interface2s by. The order in which sorts are applied is not guaranteed when specifying many fields in one Type1Interface2Sort object.
            \\"\\"\\"
            input Type1Interface2Sort {
              field2: SortDirection
            }

            input Type1Interface2UpdateInput {
              field2_SET: String
            }

            input Type1Interface2Where {
              AND: [Type1Interface2Where!]
              NOT: Type1Interface2Where
              OR: [Type1Interface2Where!]
              field2: StringScalarFilters
              field2_CONTAINS: String
              field2_ENDS_WITH: String
              field2_EQ: String
              field2_IN: [String!]
              field2_STARTS_WITH: String
            }

            type Type1Interface2sConnection {
              edges: [Type1Interface2Edge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            \\"\\"\\"
            Fields to sort Type1s by. The order in which sorts are applied is not guaranteed when specifying many fields in one Type1Sort object.
            \\"\\"\\"
            input Type1Sort {
              field1: SortDirection
            }

            input Type1UpdateInput {
              field1_SET: String
              interface1: [Type1Interface1UpdateFieldInput!]
            }

            input Type1Where {
              AND: [Type1Where!]
              NOT: Type1Where
              OR: [Type1Where!]
              field1: StringScalarFilters
              field1_CONTAINS: String
              field1_ENDS_WITH: String
              field1_EQ: String
              field1_IN: [String!]
              field1_STARTS_WITH: String
              interface1: Type1Interface1RelationshipFilters
              interface1Aggregate: Type1Interface1AggregateInput
              interface1Connection: Type1Interface1ConnectionFilters
              \\"\\"\\"
              Return Type1s where all of the related Type1Interface1Connections match this filter
              \\"\\"\\"
              interface1Connection_ALL: Type1Interface1ConnectionWhere
              \\"\\"\\"
              Return Type1s where none of the related Type1Interface1Connections match this filter
              \\"\\"\\"
              interface1Connection_NONE: Type1Interface1ConnectionWhere
              \\"\\"\\"
              Return Type1s where one of the related Type1Interface1Connections match this filter
              \\"\\"\\"
              interface1Connection_SINGLE: Type1Interface1ConnectionWhere
              \\"\\"\\"
              Return Type1s where some of the related Type1Interface1Connections match this filter
              \\"\\"\\"
              interface1Connection_SOME: Type1Interface1ConnectionWhere
              \\"\\"\\"Return Type1s where all of the related Interface1s match this filter\\"\\"\\"
              interface1_ALL: Interface1Where
              \\"\\"\\"Return Type1s where none of the related Interface1s match this filter\\"\\"\\"
              interface1_NONE: Interface1Where
              \\"\\"\\"Return Type1s where one of the related Interface1s match this filter\\"\\"\\"
              interface1_SINGLE: Interface1Where
              \\"\\"\\"Return Type1s where some of the related Interface1s match this filter\\"\\"\\"
              interface1_SOME: Interface1Where
            }

            type Type1sConnection {
              edges: [Type1Edge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            type Type2Interface1 implements Interface1 {
              field1: String!
              interface2(limit: Int, offset: Int, sort: [Interface2Sort!], where: Interface2Where): [Interface2!]!
              interface2Aggregate(where: Interface2Where): Type2Interface1Interface2Interface2AggregationSelection
              interface2Connection(after: String, first: Int, sort: [Interface1Interface2ConnectionSort!], where: Interface1Interface2ConnectionWhere): Interface1Interface2Connection!
            }

            type Type2Interface1AggregateSelection {
              count: Int!
              field1: StringAggregateSelection!
            }

            input Type2Interface1CreateInput {
              field1: String!
              interface2: Type2Interface1Interface2FieldInput
            }

            input Type2Interface1DeleteInput {
              interface2: [Type2Interface1Interface2DeleteFieldInput!]
            }

            type Type2Interface1Edge {
              cursor: String!
              node: Type2Interface1!
            }

            input Type2Interface1Interface2AggregateInput {
              AND: [Type2Interface1Interface2AggregateInput!]
              NOT: Type2Interface1Interface2AggregateInput
              OR: [Type2Interface1Interface2AggregateInput!]
              count_EQ: Int
              count_GT: Int
              count_GTE: Int
              count_LT: Int
              count_LTE: Int
              node: Type2Interface1Interface2NodeAggregationWhereInput
            }

            input Type2Interface1Interface2ConnectFieldInput {
              where: Interface2ConnectWhere
            }

            input Type2Interface1Interface2ConnectionFilters {
              \\"\\"\\"
              Return Type2Interface1s where all of the related Interface1Interface2Connections match this filter
              \\"\\"\\"
              all: Interface1Interface2ConnectionWhere
              \\"\\"\\"
              Return Type2Interface1s where none of the related Interface1Interface2Connections match this filter
              \\"\\"\\"
              none: Interface1Interface2ConnectionWhere
              \\"\\"\\"
              Return Type2Interface1s where one of the related Interface1Interface2Connections match this filter
              \\"\\"\\"
              single: Interface1Interface2ConnectionWhere
              \\"\\"\\"
              Return Type2Interface1s where some of the related Interface1Interface2Connections match this filter
              \\"\\"\\"
              some: Interface1Interface2ConnectionWhere
            }

            input Type2Interface1Interface2CreateFieldInput {
              node: Interface2CreateInput!
            }

            input Type2Interface1Interface2DeleteFieldInput {
              where: Interface1Interface2ConnectionWhere
            }

            input Type2Interface1Interface2DisconnectFieldInput {
              where: Interface1Interface2ConnectionWhere
            }

            input Type2Interface1Interface2FieldInput {
              connect: [Type2Interface1Interface2ConnectFieldInput!]
              create: [Type2Interface1Interface2CreateFieldInput!]
            }

            type Type2Interface1Interface2Interface2AggregationSelection {
              count: Int!
              node: Type2Interface1Interface2Interface2NodeAggregateSelection
            }

            type Type2Interface1Interface2Interface2NodeAggregateSelection {
              field2: StringAggregateSelection!
            }

            input Type2Interface1Interface2NodeAggregationWhereInput {
              AND: [Type2Interface1Interface2NodeAggregationWhereInput!]
              NOT: Type2Interface1Interface2NodeAggregationWhereInput
              OR: [Type2Interface1Interface2NodeAggregationWhereInput!]
              field2_AVERAGE_LENGTH_EQUAL: Float
              field2_AVERAGE_LENGTH_GT: Float
              field2_AVERAGE_LENGTH_GTE: Float
              field2_AVERAGE_LENGTH_LT: Float
              field2_AVERAGE_LENGTH_LTE: Float
              field2_LONGEST_LENGTH_EQUAL: Int
              field2_LONGEST_LENGTH_GT: Int
              field2_LONGEST_LENGTH_GTE: Int
              field2_LONGEST_LENGTH_LT: Int
              field2_LONGEST_LENGTH_LTE: Int
              field2_SHORTEST_LENGTH_EQUAL: Int
              field2_SHORTEST_LENGTH_GT: Int
              field2_SHORTEST_LENGTH_GTE: Int
              field2_SHORTEST_LENGTH_LT: Int
              field2_SHORTEST_LENGTH_LTE: Int
            }

            input Type2Interface1Interface2RelationshipFilters {
              \\"\\"\\"
              Return Type2Interface1s where all of the related Interface2s match this filter
              \\"\\"\\"
              all: Interface2Where
              \\"\\"\\"
              Return Type2Interface1s where none of the related Interface2s match this filter
              \\"\\"\\"
              none: Interface2Where
              \\"\\"\\"
              Return Type2Interface1s where one of the related Interface2s match this filter
              \\"\\"\\"
              single: Interface2Where
              \\"\\"\\"
              Return Type2Interface1s where some of the related Interface2s match this filter
              \\"\\"\\"
              some: Interface2Where
            }

            input Type2Interface1Interface2UpdateConnectionInput {
              node: Interface2UpdateInput
            }

            input Type2Interface1Interface2UpdateFieldInput {
              connect: [Type2Interface1Interface2ConnectFieldInput!]
              create: [Type2Interface1Interface2CreateFieldInput!]
              delete: [Type2Interface1Interface2DeleteFieldInput!]
              disconnect: [Type2Interface1Interface2DisconnectFieldInput!]
              update: Type2Interface1Interface2UpdateConnectionInput
              where: Interface1Interface2ConnectionWhere
            }

            \\"\\"\\"
            Fields to sort Type2Interface1s by. The order in which sorts are applied is not guaranteed when specifying many fields in one Type2Interface1Sort object.
            \\"\\"\\"
            input Type2Interface1Sort {
              field1: SortDirection
            }

            input Type2Interface1UpdateInput {
              field1_SET: String
              interface2: [Type2Interface1Interface2UpdateFieldInput!]
            }

            input Type2Interface1Where {
              AND: [Type2Interface1Where!]
              NOT: Type2Interface1Where
              OR: [Type2Interface1Where!]
              field1: StringScalarFilters
              field1_CONTAINS: String
              field1_ENDS_WITH: String
              field1_EQ: String
              field1_IN: [String!]
              field1_STARTS_WITH: String
              interface2: Type2Interface1Interface2RelationshipFilters
              interface2Aggregate: Type2Interface1Interface2AggregateInput
              interface2Connection: Type2Interface1Interface2ConnectionFilters
              \\"\\"\\"
              Return Type2Interface1s where all of the related Interface1Interface2Connections match this filter
              \\"\\"\\"
              interface2Connection_ALL: Interface1Interface2ConnectionWhere
              \\"\\"\\"
              Return Type2Interface1s where none of the related Interface1Interface2Connections match this filter
              \\"\\"\\"
              interface2Connection_NONE: Interface1Interface2ConnectionWhere
              \\"\\"\\"
              Return Type2Interface1s where one of the related Interface1Interface2Connections match this filter
              \\"\\"\\"
              interface2Connection_SINGLE: Interface1Interface2ConnectionWhere
              \\"\\"\\"
              Return Type2Interface1s where some of the related Interface1Interface2Connections match this filter
              \\"\\"\\"
              interface2Connection_SOME: Interface1Interface2ConnectionWhere
              \\"\\"\\"
              Return Type2Interface1s where all of the related Interface2s match this filter
              \\"\\"\\"
              interface2_ALL: Interface2Where
              \\"\\"\\"
              Return Type2Interface1s where none of the related Interface2s match this filter
              \\"\\"\\"
              interface2_NONE: Interface2Where
              \\"\\"\\"
              Return Type2Interface1s where one of the related Interface2s match this filter
              \\"\\"\\"
              interface2_SINGLE: Interface2Where
              \\"\\"\\"
              Return Type2Interface1s where some of the related Interface2s match this filter
              \\"\\"\\"
              interface2_SOME: Interface2Where
            }

            type Type2Interface1sConnection {
              edges: [Type2Interface1Edge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            type Type2Interface2 implements Interface2 {
              field2: String!
            }

            type Type2Interface2AggregateSelection {
              count: Int!
              field2: StringAggregateSelection!
            }

            input Type2Interface2CreateInput {
              field2: String!
            }

            type Type2Interface2Edge {
              cursor: String!
              node: Type2Interface2!
            }

            \\"\\"\\"
            Fields to sort Type2Interface2s by. The order in which sorts are applied is not guaranteed when specifying many fields in one Type2Interface2Sort object.
            \\"\\"\\"
            input Type2Interface2Sort {
              field2: SortDirection
            }

            input Type2Interface2UpdateInput {
              field2_SET: String
            }

            input Type2Interface2Where {
              AND: [Type2Interface2Where!]
              NOT: Type2Interface2Where
              OR: [Type2Interface2Where!]
              field2: StringScalarFilters
              field2_CONTAINS: String
              field2_ENDS_WITH: String
              field2_EQ: String
              field2_IN: [String!]
              field2_STARTS_WITH: String
            }

            type Type2Interface2sConnection {
              edges: [Type2Interface2Edge!]!
              pageInfo: PageInfo!
              totalCount: Int!
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

            type UpdateType1Interface1sMutationResponse {
              info: UpdateInfo!
              type1Interface1s: [Type1Interface1!]!
            }

            type UpdateType1Interface2sMutationResponse {
              info: UpdateInfo!
              type1Interface2s: [Type1Interface2!]!
            }

            type UpdateType1sMutationResponse {
              info: UpdateInfo!
              type1s: [Type1!]!
            }

            type UpdateType2Interface1sMutationResponse {
              info: UpdateInfo!
              type2Interface1s: [Type2Interface1!]!
            }

            type UpdateType2Interface2sMutationResponse {
              info: UpdateInfo!
              type2Interface2s: [Type2Interface2!]!
            }"
        `);

        // expect(() => {
        //     // eslint-disable-next-line @typescript-eslint/no-unused-vars
        //     const neoSchema = new Neo4jGraphQL({ typeDefs });
        // }).toThrowError("Nested interface relationship fields are not supported: Interface1.interface2");
    });

    test("Interface Relationships - nested interface relationships - with same properties", async () => {
        const typeDefs = gql`
            interface Interface1 {
                field1: String!
                interface2: [Interface2!]! @declareRelationship
            }

            interface Interface2 {
                field2: String
            }

            type Type1Interface1 implements Interface1 @node {
                field1: String!
                interface2: [Interface2!]! @relationship(type: "INTERFACE_TWO", direction: OUT, properties: "Props")
            }

            type Type2Interface1 implements Interface1 @node {
                field1: String!
                interface2: [Interface2!]! @relationship(type: "INTERFACE_TWO", direction: OUT, properties: "Props")
            }

            type Type1Interface2 implements Interface2 @node {
                field2: String!
            }

            type Type2Interface2 implements Interface2 @node {
                field2: String!
            }

            type Type1 @node {
                field1: String!
                interface1: [Interface1!]! @relationship(type: "INTERFACE_ONE", direction: OUT)
            }

            type Props @relationshipProperties {
                propsField: Int!
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

            type CreateType1Interface1sMutationResponse {
              info: CreateInfo!
              type1Interface1s: [Type1Interface1!]!
            }

            type CreateType1Interface2sMutationResponse {
              info: CreateInfo!
              type1Interface2s: [Type1Interface2!]!
            }

            type CreateType1sMutationResponse {
              info: CreateInfo!
              type1s: [Type1!]!
            }

            type CreateType2Interface1sMutationResponse {
              info: CreateInfo!
              type2Interface1s: [Type2Interface1!]!
            }

            type CreateType2Interface2sMutationResponse {
              info: CreateInfo!
              type2Interface2s: [Type2Interface2!]!
            }

            \\"\\"\\"
            Information about the number of nodes and relationships deleted during a delete mutation
            \\"\\"\\"
            type DeleteInfo {
              nodesDeleted: Int!
              relationshipsDeleted: Int!
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

            interface Interface1 {
              field1: String!
              interface2(limit: Int, offset: Int, sort: [Interface2Sort!], where: Interface2Where): [Interface2!]!
              interface2Connection(after: String, first: Int, sort: [Interface1Interface2ConnectionSort!], where: Interface1Interface2ConnectionWhere): Interface1Interface2Connection!
            }

            type Interface1AggregateSelection {
              count: Int!
              field1: StringAggregateSelection!
            }

            input Interface1ConnectInput {
              interface2: [Interface1Interface2ConnectFieldInput!]
            }

            input Interface1ConnectWhere {
              node: Interface1Where!
            }

            input Interface1CreateInput {
              Type1Interface1: Type1Interface1CreateInput
              Type2Interface1: Type2Interface1CreateInput
            }

            input Interface1DeleteInput {
              interface2: [Interface1Interface2DeleteFieldInput!]
            }

            input Interface1DisconnectInput {
              interface2: [Interface1Interface2DisconnectFieldInput!]
            }

            type Interface1Edge {
              cursor: String!
              node: Interface1!
            }

            enum Interface1Implementation {
              Type1Interface1
              Type2Interface1
            }

            input Interface1Interface2AggregateInput {
              AND: [Interface1Interface2AggregateInput!]
              NOT: Interface1Interface2AggregateInput
              OR: [Interface1Interface2AggregateInput!]
              count_EQ: Int
              count_GT: Int
              count_GTE: Int
              count_LT: Int
              count_LTE: Int
              edge: Interface1Interface2EdgeAggregationWhereInput
              node: Interface1Interface2NodeAggregationWhereInput
            }

            input Interface1Interface2ConnectFieldInput {
              edge: Interface1Interface2EdgeCreateInput!
              where: Interface2ConnectWhere
            }

            type Interface1Interface2Connection {
              edges: [Interface1Interface2Relationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input Interface1Interface2ConnectionFilters {
              \\"\\"\\"
              Return Interface1s where all of the related Interface1Interface2Connections match this filter
              \\"\\"\\"
              all: Interface1Interface2ConnectionWhere
              \\"\\"\\"
              Return Interface1s where none of the related Interface1Interface2Connections match this filter
              \\"\\"\\"
              none: Interface1Interface2ConnectionWhere
              \\"\\"\\"
              Return Interface1s where one of the related Interface1Interface2Connections match this filter
              \\"\\"\\"
              single: Interface1Interface2ConnectionWhere
              \\"\\"\\"
              Return Interface1s where some of the related Interface1Interface2Connections match this filter
              \\"\\"\\"
              some: Interface1Interface2ConnectionWhere
            }

            input Interface1Interface2ConnectionSort {
              edge: Interface1Interface2EdgeSort
              node: Interface2Sort
            }

            input Interface1Interface2ConnectionWhere {
              AND: [Interface1Interface2ConnectionWhere!]
              NOT: Interface1Interface2ConnectionWhere
              OR: [Interface1Interface2ConnectionWhere!]
              edge: Interface1Interface2EdgeWhere
              node: Interface2Where
            }

            input Interface1Interface2CreateFieldInput {
              edge: Interface1Interface2EdgeCreateInput!
              node: Interface2CreateInput!
            }

            input Interface1Interface2DeleteFieldInput {
              where: Interface1Interface2ConnectionWhere
            }

            input Interface1Interface2DisconnectFieldInput {
              where: Interface1Interface2ConnectionWhere
            }

            input Interface1Interface2EdgeAggregationWhereInput {
              \\"\\"\\"
              Relationship properties when source node is of type:
              * Type1Interface1
              * Type2Interface1
              \\"\\"\\"
              Props: PropsAggregationWhereInput
            }

            input Interface1Interface2EdgeCreateInput {
              \\"\\"\\"
              Relationship properties when source node is of type:
              * Type1Interface1
              * Type2Interface1
              \\"\\"\\"
              Props: PropsCreateInput!
            }

            input Interface1Interface2EdgeSort {
              \\"\\"\\"
              Relationship properties when source node is of type:
              * Type1Interface1
              * Type2Interface1
              \\"\\"\\"
              Props: PropsSort
            }

            input Interface1Interface2EdgeUpdateInput {
              \\"\\"\\"
              Relationship properties when source node is of type:
              * Type1Interface1
              * Type2Interface1
              \\"\\"\\"
              Props: PropsUpdateInput
            }

            input Interface1Interface2EdgeWhere {
              \\"\\"\\"
              Relationship properties when source node is of type:
              * Type1Interface1
              * Type2Interface1
              \\"\\"\\"
              Props: PropsWhere
            }

            input Interface1Interface2NodeAggregationWhereInput {
              AND: [Interface1Interface2NodeAggregationWhereInput!]
              NOT: Interface1Interface2NodeAggregationWhereInput
              OR: [Interface1Interface2NodeAggregationWhereInput!]
              field2_AVERAGE_LENGTH_EQUAL: Float
              field2_AVERAGE_LENGTH_GT: Float
              field2_AVERAGE_LENGTH_GTE: Float
              field2_AVERAGE_LENGTH_LT: Float
              field2_AVERAGE_LENGTH_LTE: Float
              field2_LONGEST_LENGTH_EQUAL: Int
              field2_LONGEST_LENGTH_GT: Int
              field2_LONGEST_LENGTH_GTE: Int
              field2_LONGEST_LENGTH_LT: Int
              field2_LONGEST_LENGTH_LTE: Int
              field2_SHORTEST_LENGTH_EQUAL: Int
              field2_SHORTEST_LENGTH_GT: Int
              field2_SHORTEST_LENGTH_GTE: Int
              field2_SHORTEST_LENGTH_LT: Int
              field2_SHORTEST_LENGTH_LTE: Int
            }

            type Interface1Interface2Relationship {
              cursor: String!
              node: Interface2!
              properties: Interface1Interface2RelationshipProperties!
            }

            input Interface1Interface2RelationshipFilters {
              \\"\\"\\"
              Return Interface1s where all of the related Interface2s match this filter
              \\"\\"\\"
              all: Interface2Where
              \\"\\"\\"
              Return Interface1s where none of the related Interface2s match this filter
              \\"\\"\\"
              none: Interface2Where
              \\"\\"\\"
              Return Interface1s where one of the related Interface2s match this filter
              \\"\\"\\"
              single: Interface2Where
              \\"\\"\\"
              Return Interface1s where some of the related Interface2s match this filter
              \\"\\"\\"
              some: Interface2Where
            }

            union Interface1Interface2RelationshipProperties = Props

            input Interface1Interface2UpdateConnectionInput {
              edge: Interface1Interface2EdgeUpdateInput
              node: Interface2UpdateInput
            }

            input Interface1Interface2UpdateFieldInput {
              connect: [Interface1Interface2ConnectFieldInput!]
              create: [Interface1Interface2CreateFieldInput!]
              delete: [Interface1Interface2DeleteFieldInput!]
              disconnect: [Interface1Interface2DisconnectFieldInput!]
              update: Interface1Interface2UpdateConnectionInput
              where: Interface1Interface2ConnectionWhere
            }

            \\"\\"\\"
            Fields to sort Interface1s by. The order in which sorts are applied is not guaranteed when specifying many fields in one Interface1Sort object.
            \\"\\"\\"
            input Interface1Sort {
              field1: SortDirection
            }

            input Interface1UpdateInput {
              field1_SET: String
              interface2: [Interface1Interface2UpdateFieldInput!]
            }

            input Interface1Where {
              AND: [Interface1Where!]
              NOT: Interface1Where
              OR: [Interface1Where!]
              field1: StringScalarFilters
              field1_CONTAINS: String
              field1_ENDS_WITH: String
              field1_EQ: String
              field1_IN: [String!]
              field1_STARTS_WITH: String
              interface2: Interface1Interface2RelationshipFilters
              interface2Aggregate: Interface1Interface2AggregateInput
              interface2Connection: Interface1Interface2ConnectionFilters
              \\"\\"\\"
              Return Interface1s where all of the related Interface1Interface2Connections match this filter
              \\"\\"\\"
              interface2Connection_ALL: Interface1Interface2ConnectionWhere
              \\"\\"\\"
              Return Interface1s where none of the related Interface1Interface2Connections match this filter
              \\"\\"\\"
              interface2Connection_NONE: Interface1Interface2ConnectionWhere
              \\"\\"\\"
              Return Interface1s where one of the related Interface1Interface2Connections match this filter
              \\"\\"\\"
              interface2Connection_SINGLE: Interface1Interface2ConnectionWhere
              \\"\\"\\"
              Return Interface1s where some of the related Interface1Interface2Connections match this filter
              \\"\\"\\"
              interface2Connection_SOME: Interface1Interface2ConnectionWhere
              \\"\\"\\"
              Return Interface1s where all of the related Interface2s match this filter
              \\"\\"\\"
              interface2_ALL: Interface2Where
              \\"\\"\\"
              Return Interface1s where none of the related Interface2s match this filter
              \\"\\"\\"
              interface2_NONE: Interface2Where
              \\"\\"\\"
              Return Interface1s where one of the related Interface2s match this filter
              \\"\\"\\"
              interface2_SINGLE: Interface2Where
              \\"\\"\\"
              Return Interface1s where some of the related Interface2s match this filter
              \\"\\"\\"
              interface2_SOME: Interface2Where
              typename_IN: [Interface1Implementation!]
            }

            type Interface1sConnection {
              edges: [Interface1Edge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            interface Interface2 {
              field2: String
            }

            type Interface2AggregateSelection {
              count: Int!
              field2: StringAggregateSelection!
            }

            input Interface2ConnectWhere {
              node: Interface2Where!
            }

            input Interface2CreateInput {
              Type1Interface2: Type1Interface2CreateInput
              Type2Interface2: Type2Interface2CreateInput
            }

            type Interface2Edge {
              cursor: String!
              node: Interface2!
            }

            enum Interface2Implementation {
              Type1Interface2
              Type2Interface2
            }

            \\"\\"\\"
            Fields to sort Interface2s by. The order in which sorts are applied is not guaranteed when specifying many fields in one Interface2Sort object.
            \\"\\"\\"
            input Interface2Sort {
              field2: SortDirection
            }

            input Interface2UpdateInput {
              field2_SET: String
            }

            input Interface2Where {
              AND: [Interface2Where!]
              NOT: Interface2Where
              OR: [Interface2Where!]
              field2: StringScalarFilters
              field2_CONTAINS: String
              field2_ENDS_WITH: String
              field2_EQ: String
              field2_IN: [String]
              field2_STARTS_WITH: String
              typename_IN: [Interface2Implementation!]
            }

            type Interface2sConnection {
              edges: [Interface2Edge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            type Mutation {
              createType1Interface1s(input: [Type1Interface1CreateInput!]!): CreateType1Interface1sMutationResponse!
              createType1Interface2s(input: [Type1Interface2CreateInput!]!): CreateType1Interface2sMutationResponse!
              createType1s(input: [Type1CreateInput!]!): CreateType1sMutationResponse!
              createType2Interface1s(input: [Type2Interface1CreateInput!]!): CreateType2Interface1sMutationResponse!
              createType2Interface2s(input: [Type2Interface2CreateInput!]!): CreateType2Interface2sMutationResponse!
              deleteType1Interface1s(delete: Type1Interface1DeleteInput, where: Type1Interface1Where): DeleteInfo!
              deleteType1Interface2s(where: Type1Interface2Where): DeleteInfo!
              deleteType1s(delete: Type1DeleteInput, where: Type1Where): DeleteInfo!
              deleteType2Interface1s(delete: Type2Interface1DeleteInput, where: Type2Interface1Where): DeleteInfo!
              deleteType2Interface2s(where: Type2Interface2Where): DeleteInfo!
              updateType1Interface1s(update: Type1Interface1UpdateInput, where: Type1Interface1Where): UpdateType1Interface1sMutationResponse!
              updateType1Interface2s(update: Type1Interface2UpdateInput, where: Type1Interface2Where): UpdateType1Interface2sMutationResponse!
              updateType1s(update: Type1UpdateInput, where: Type1Where): UpdateType1sMutationResponse!
              updateType2Interface1s(update: Type2Interface1UpdateInput, where: Type2Interface1Where): UpdateType2Interface1sMutationResponse!
              updateType2Interface2s(update: Type2Interface2UpdateInput, where: Type2Interface2Where): UpdateType2Interface2sMutationResponse!
            }

            \\"\\"\\"Pagination information (Relay)\\"\\"\\"
            type PageInfo {
              endCursor: String
              hasNextPage: Boolean!
              hasPreviousPage: Boolean!
              startCursor: String
            }

            \\"\\"\\"
            The edge properties for the following fields:
            * Type1Interface1.interface2
            * Type2Interface1.interface2
            \\"\\"\\"
            type Props {
              propsField: Int!
            }

            input PropsAggregationWhereInput {
              AND: [PropsAggregationWhereInput!]
              NOT: PropsAggregationWhereInput
              OR: [PropsAggregationWhereInput!]
              propsField_AVERAGE_EQUAL: Float
              propsField_AVERAGE_GT: Float
              propsField_AVERAGE_GTE: Float
              propsField_AVERAGE_LT: Float
              propsField_AVERAGE_LTE: Float
              propsField_MAX_EQUAL: Int
              propsField_MAX_GT: Int
              propsField_MAX_GTE: Int
              propsField_MAX_LT: Int
              propsField_MAX_LTE: Int
              propsField_MIN_EQUAL: Int
              propsField_MIN_GT: Int
              propsField_MIN_GTE: Int
              propsField_MIN_LT: Int
              propsField_MIN_LTE: Int
              propsField_SUM_EQUAL: Int
              propsField_SUM_GT: Int
              propsField_SUM_GTE: Int
              propsField_SUM_LT: Int
              propsField_SUM_LTE: Int
            }

            input PropsCreateInput {
              propsField: Int!
            }

            input PropsSort {
              propsField: SortDirection
            }

            input PropsUpdateInput {
              propsField_DECREMENT: Int
              propsField_INCREMENT: Int
              propsField_SET: Int
            }

            input PropsWhere {
              AND: [PropsWhere!]
              NOT: PropsWhere
              OR: [PropsWhere!]
              propsField: IntScalarFilters
              propsField_EQ: Int
              propsField_GT: Int
              propsField_GTE: Int
              propsField_IN: [Int!]
              propsField_LT: Int
              propsField_LTE: Int
            }

            type Query {
              interface1s(limit: Int, offset: Int, sort: [Interface1Sort!], where: Interface1Where): [Interface1!]!
              interface1sAggregate(where: Interface1Where): Interface1AggregateSelection!
              interface1sConnection(after: String, first: Int, sort: [Interface1Sort!], where: Interface1Where): Interface1sConnection!
              interface2s(limit: Int, offset: Int, sort: [Interface2Sort!], where: Interface2Where): [Interface2!]!
              interface2sAggregate(where: Interface2Where): Interface2AggregateSelection!
              interface2sConnection(after: String, first: Int, sort: [Interface2Sort!], where: Interface2Where): Interface2sConnection!
              type1Interface1s(limit: Int, offset: Int, sort: [Type1Interface1Sort!], where: Type1Interface1Where): [Type1Interface1!]!
              type1Interface1sAggregate(where: Type1Interface1Where): Type1Interface1AggregateSelection!
              type1Interface1sConnection(after: String, first: Int, sort: [Type1Interface1Sort!], where: Type1Interface1Where): Type1Interface1sConnection!
              type1Interface2s(limit: Int, offset: Int, sort: [Type1Interface2Sort!], where: Type1Interface2Where): [Type1Interface2!]!
              type1Interface2sAggregate(where: Type1Interface2Where): Type1Interface2AggregateSelection!
              type1Interface2sConnection(after: String, first: Int, sort: [Type1Interface2Sort!], where: Type1Interface2Where): Type1Interface2sConnection!
              type1s(limit: Int, offset: Int, sort: [Type1Sort!], where: Type1Where): [Type1!]!
              type1sAggregate(where: Type1Where): Type1AggregateSelection!
              type1sConnection(after: String, first: Int, sort: [Type1Sort!], where: Type1Where): Type1sConnection!
              type2Interface1s(limit: Int, offset: Int, sort: [Type2Interface1Sort!], where: Type2Interface1Where): [Type2Interface1!]!
              type2Interface1sAggregate(where: Type2Interface1Where): Type2Interface1AggregateSelection!
              type2Interface1sConnection(after: String, first: Int, sort: [Type2Interface1Sort!], where: Type2Interface1Where): Type2Interface1sConnection!
              type2Interface2s(limit: Int, offset: Int, sort: [Type2Interface2Sort!], where: Type2Interface2Where): [Type2Interface2!]!
              type2Interface2sAggregate(where: Type2Interface2Where): Type2Interface2AggregateSelection!
              type2Interface2sConnection(after: String, first: Int, sort: [Type2Interface2Sort!], where: Type2Interface2Where): Type2Interface2sConnection!
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

            type Type1 {
              field1: String!
              interface1(limit: Int, offset: Int, sort: [Interface1Sort!], where: Interface1Where): [Interface1!]!
              interface1Aggregate(where: Interface1Where): Type1Interface1Interface1AggregationSelection
              interface1Connection(after: String, first: Int, sort: [Type1Interface1ConnectionSort!], where: Type1Interface1ConnectionWhere): Type1Interface1Connection!
            }

            type Type1AggregateSelection {
              count: Int!
              field1: StringAggregateSelection!
            }

            input Type1CreateInput {
              field1: String!
              interface1: Type1Interface1FieldInput
            }

            input Type1DeleteInput {
              interface1: [Type1Interface1DeleteFieldInput!]
            }

            type Type1Edge {
              cursor: String!
              node: Type1!
            }

            type Type1Interface1 implements Interface1 {
              field1: String!
              interface2(limit: Int, offset: Int, sort: [Interface2Sort!], where: Interface2Where): [Interface2!]!
              interface2Aggregate(where: Interface2Where): Type1Interface1Interface2Interface2AggregationSelection
              interface2Connection(after: String, first: Int, sort: [Interface1Interface2ConnectionSort!], where: Interface1Interface2ConnectionWhere): Interface1Interface2Connection!
            }

            input Type1Interface1AggregateInput {
              AND: [Type1Interface1AggregateInput!]
              NOT: Type1Interface1AggregateInput
              OR: [Type1Interface1AggregateInput!]
              count_EQ: Int
              count_GT: Int
              count_GTE: Int
              count_LT: Int
              count_LTE: Int
              node: Type1Interface1NodeAggregationWhereInput
            }

            type Type1Interface1AggregateSelection {
              count: Int!
              field1: StringAggregateSelection!
            }

            input Type1Interface1ConnectFieldInput {
              connect: Interface1ConnectInput
              where: Interface1ConnectWhere
            }

            type Type1Interface1Connection {
              edges: [Type1Interface1Relationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input Type1Interface1ConnectionFilters {
              \\"\\"\\"
              Return Type1s where all of the related Type1Interface1Connections match this filter
              \\"\\"\\"
              all: Type1Interface1ConnectionWhere
              \\"\\"\\"
              Return Type1s where none of the related Type1Interface1Connections match this filter
              \\"\\"\\"
              none: Type1Interface1ConnectionWhere
              \\"\\"\\"
              Return Type1s where one of the related Type1Interface1Connections match this filter
              \\"\\"\\"
              single: Type1Interface1ConnectionWhere
              \\"\\"\\"
              Return Type1s where some of the related Type1Interface1Connections match this filter
              \\"\\"\\"
              some: Type1Interface1ConnectionWhere
            }

            input Type1Interface1ConnectionSort {
              node: Interface1Sort
            }

            input Type1Interface1ConnectionWhere {
              AND: [Type1Interface1ConnectionWhere!]
              NOT: Type1Interface1ConnectionWhere
              OR: [Type1Interface1ConnectionWhere!]
              node: Interface1Where
            }

            input Type1Interface1CreateFieldInput {
              node: Interface1CreateInput!
            }

            input Type1Interface1CreateInput {
              field1: String!
              interface2: Type1Interface1Interface2FieldInput
            }

            input Type1Interface1DeleteFieldInput {
              delete: Interface1DeleteInput
              where: Type1Interface1ConnectionWhere
            }

            input Type1Interface1DeleteInput {
              interface2: [Type1Interface1Interface2DeleteFieldInput!]
            }

            input Type1Interface1DisconnectFieldInput {
              disconnect: Interface1DisconnectInput
              where: Type1Interface1ConnectionWhere
            }

            type Type1Interface1Edge {
              cursor: String!
              node: Type1Interface1!
            }

            input Type1Interface1FieldInput {
              connect: [Type1Interface1ConnectFieldInput!]
              create: [Type1Interface1CreateFieldInput!]
            }

            type Type1Interface1Interface1AggregationSelection {
              count: Int!
              node: Type1Interface1Interface1NodeAggregateSelection
            }

            type Type1Interface1Interface1NodeAggregateSelection {
              field1: StringAggregateSelection!
            }

            input Type1Interface1Interface2AggregateInput {
              AND: [Type1Interface1Interface2AggregateInput!]
              NOT: Type1Interface1Interface2AggregateInput
              OR: [Type1Interface1Interface2AggregateInput!]
              count_EQ: Int
              count_GT: Int
              count_GTE: Int
              count_LT: Int
              count_LTE: Int
              edge: PropsAggregationWhereInput
              node: Type1Interface1Interface2NodeAggregationWhereInput
            }

            input Type1Interface1Interface2ConnectFieldInput {
              edge: PropsCreateInput!
              where: Interface2ConnectWhere
            }

            input Type1Interface1Interface2ConnectionFilters {
              \\"\\"\\"
              Return Type1Interface1s where all of the related Interface1Interface2Connections match this filter
              \\"\\"\\"
              all: Interface1Interface2ConnectionWhere
              \\"\\"\\"
              Return Type1Interface1s where none of the related Interface1Interface2Connections match this filter
              \\"\\"\\"
              none: Interface1Interface2ConnectionWhere
              \\"\\"\\"
              Return Type1Interface1s where one of the related Interface1Interface2Connections match this filter
              \\"\\"\\"
              single: Interface1Interface2ConnectionWhere
              \\"\\"\\"
              Return Type1Interface1s where some of the related Interface1Interface2Connections match this filter
              \\"\\"\\"
              some: Interface1Interface2ConnectionWhere
            }

            input Type1Interface1Interface2CreateFieldInput {
              edge: PropsCreateInput!
              node: Interface2CreateInput!
            }

            input Type1Interface1Interface2DeleteFieldInput {
              where: Interface1Interface2ConnectionWhere
            }

            input Type1Interface1Interface2DisconnectFieldInput {
              where: Interface1Interface2ConnectionWhere
            }

            input Type1Interface1Interface2FieldInput {
              connect: [Type1Interface1Interface2ConnectFieldInput!]
              create: [Type1Interface1Interface2CreateFieldInput!]
            }

            type Type1Interface1Interface2Interface2AggregationSelection {
              count: Int!
              edge: Type1Interface1Interface2Interface2EdgeAggregateSelection
              node: Type1Interface1Interface2Interface2NodeAggregateSelection
            }

            type Type1Interface1Interface2Interface2EdgeAggregateSelection {
              propsField: IntAggregateSelection!
            }

            type Type1Interface1Interface2Interface2NodeAggregateSelection {
              field2: StringAggregateSelection!
            }

            input Type1Interface1Interface2NodeAggregationWhereInput {
              AND: [Type1Interface1Interface2NodeAggregationWhereInput!]
              NOT: Type1Interface1Interface2NodeAggregationWhereInput
              OR: [Type1Interface1Interface2NodeAggregationWhereInput!]
              field2_AVERAGE_LENGTH_EQUAL: Float
              field2_AVERAGE_LENGTH_GT: Float
              field2_AVERAGE_LENGTH_GTE: Float
              field2_AVERAGE_LENGTH_LT: Float
              field2_AVERAGE_LENGTH_LTE: Float
              field2_LONGEST_LENGTH_EQUAL: Int
              field2_LONGEST_LENGTH_GT: Int
              field2_LONGEST_LENGTH_GTE: Int
              field2_LONGEST_LENGTH_LT: Int
              field2_LONGEST_LENGTH_LTE: Int
              field2_SHORTEST_LENGTH_EQUAL: Int
              field2_SHORTEST_LENGTH_GT: Int
              field2_SHORTEST_LENGTH_GTE: Int
              field2_SHORTEST_LENGTH_LT: Int
              field2_SHORTEST_LENGTH_LTE: Int
            }

            input Type1Interface1Interface2RelationshipFilters {
              \\"\\"\\"
              Return Type1Interface1s where all of the related Interface2s match this filter
              \\"\\"\\"
              all: Interface2Where
              \\"\\"\\"
              Return Type1Interface1s where none of the related Interface2s match this filter
              \\"\\"\\"
              none: Interface2Where
              \\"\\"\\"
              Return Type1Interface1s where one of the related Interface2s match this filter
              \\"\\"\\"
              single: Interface2Where
              \\"\\"\\"
              Return Type1Interface1s where some of the related Interface2s match this filter
              \\"\\"\\"
              some: Interface2Where
            }

            input Type1Interface1Interface2UpdateConnectionInput {
              edge: PropsUpdateInput
              node: Interface2UpdateInput
            }

            input Type1Interface1Interface2UpdateFieldInput {
              connect: [Type1Interface1Interface2ConnectFieldInput!]
              create: [Type1Interface1Interface2CreateFieldInput!]
              delete: [Type1Interface1Interface2DeleteFieldInput!]
              disconnect: [Type1Interface1Interface2DisconnectFieldInput!]
              update: Type1Interface1Interface2UpdateConnectionInput
              where: Interface1Interface2ConnectionWhere
            }

            input Type1Interface1NodeAggregationWhereInput {
              AND: [Type1Interface1NodeAggregationWhereInput!]
              NOT: Type1Interface1NodeAggregationWhereInput
              OR: [Type1Interface1NodeAggregationWhereInput!]
              field1_AVERAGE_LENGTH_EQUAL: Float
              field1_AVERAGE_LENGTH_GT: Float
              field1_AVERAGE_LENGTH_GTE: Float
              field1_AVERAGE_LENGTH_LT: Float
              field1_AVERAGE_LENGTH_LTE: Float
              field1_LONGEST_LENGTH_EQUAL: Int
              field1_LONGEST_LENGTH_GT: Int
              field1_LONGEST_LENGTH_GTE: Int
              field1_LONGEST_LENGTH_LT: Int
              field1_LONGEST_LENGTH_LTE: Int
              field1_SHORTEST_LENGTH_EQUAL: Int
              field1_SHORTEST_LENGTH_GT: Int
              field1_SHORTEST_LENGTH_GTE: Int
              field1_SHORTEST_LENGTH_LT: Int
              field1_SHORTEST_LENGTH_LTE: Int
            }

            type Type1Interface1Relationship {
              cursor: String!
              node: Interface1!
            }

            input Type1Interface1RelationshipFilters {
              \\"\\"\\"Return Type1s where all of the related Interface1s match this filter\\"\\"\\"
              all: Interface1Where
              \\"\\"\\"Return Type1s where none of the related Interface1s match this filter\\"\\"\\"
              none: Interface1Where
              \\"\\"\\"Return Type1s where one of the related Interface1s match this filter\\"\\"\\"
              single: Interface1Where
              \\"\\"\\"Return Type1s where some of the related Interface1s match this filter\\"\\"\\"
              some: Interface1Where
            }

            \\"\\"\\"
            Fields to sort Type1Interface1s by. The order in which sorts are applied is not guaranteed when specifying many fields in one Type1Interface1Sort object.
            \\"\\"\\"
            input Type1Interface1Sort {
              field1: SortDirection
            }

            input Type1Interface1UpdateConnectionInput {
              node: Interface1UpdateInput
            }

            input Type1Interface1UpdateFieldInput {
              connect: [Type1Interface1ConnectFieldInput!]
              create: [Type1Interface1CreateFieldInput!]
              delete: [Type1Interface1DeleteFieldInput!]
              disconnect: [Type1Interface1DisconnectFieldInput!]
              update: Type1Interface1UpdateConnectionInput
              where: Type1Interface1ConnectionWhere
            }

            input Type1Interface1UpdateInput {
              field1_SET: String
              interface2: [Type1Interface1Interface2UpdateFieldInput!]
            }

            input Type1Interface1Where {
              AND: [Type1Interface1Where!]
              NOT: Type1Interface1Where
              OR: [Type1Interface1Where!]
              field1: StringScalarFilters
              field1_CONTAINS: String
              field1_ENDS_WITH: String
              field1_EQ: String
              field1_IN: [String!]
              field1_STARTS_WITH: String
              interface2: Type1Interface1Interface2RelationshipFilters
              interface2Aggregate: Type1Interface1Interface2AggregateInput
              interface2Connection: Type1Interface1Interface2ConnectionFilters
              \\"\\"\\"
              Return Type1Interface1s where all of the related Interface1Interface2Connections match this filter
              \\"\\"\\"
              interface2Connection_ALL: Interface1Interface2ConnectionWhere
              \\"\\"\\"
              Return Type1Interface1s where none of the related Interface1Interface2Connections match this filter
              \\"\\"\\"
              interface2Connection_NONE: Interface1Interface2ConnectionWhere
              \\"\\"\\"
              Return Type1Interface1s where one of the related Interface1Interface2Connections match this filter
              \\"\\"\\"
              interface2Connection_SINGLE: Interface1Interface2ConnectionWhere
              \\"\\"\\"
              Return Type1Interface1s where some of the related Interface1Interface2Connections match this filter
              \\"\\"\\"
              interface2Connection_SOME: Interface1Interface2ConnectionWhere
              \\"\\"\\"
              Return Type1Interface1s where all of the related Interface2s match this filter
              \\"\\"\\"
              interface2_ALL: Interface2Where
              \\"\\"\\"
              Return Type1Interface1s where none of the related Interface2s match this filter
              \\"\\"\\"
              interface2_NONE: Interface2Where
              \\"\\"\\"
              Return Type1Interface1s where one of the related Interface2s match this filter
              \\"\\"\\"
              interface2_SINGLE: Interface2Where
              \\"\\"\\"
              Return Type1Interface1s where some of the related Interface2s match this filter
              \\"\\"\\"
              interface2_SOME: Interface2Where
            }

            type Type1Interface1sConnection {
              edges: [Type1Interface1Edge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            type Type1Interface2 implements Interface2 {
              field2: String!
            }

            type Type1Interface2AggregateSelection {
              count: Int!
              field2: StringAggregateSelection!
            }

            input Type1Interface2CreateInput {
              field2: String!
            }

            type Type1Interface2Edge {
              cursor: String!
              node: Type1Interface2!
            }

            \\"\\"\\"
            Fields to sort Type1Interface2s by. The order in which sorts are applied is not guaranteed when specifying many fields in one Type1Interface2Sort object.
            \\"\\"\\"
            input Type1Interface2Sort {
              field2: SortDirection
            }

            input Type1Interface2UpdateInput {
              field2_SET: String
            }

            input Type1Interface2Where {
              AND: [Type1Interface2Where!]
              NOT: Type1Interface2Where
              OR: [Type1Interface2Where!]
              field2: StringScalarFilters
              field2_CONTAINS: String
              field2_ENDS_WITH: String
              field2_EQ: String
              field2_IN: [String!]
              field2_STARTS_WITH: String
            }

            type Type1Interface2sConnection {
              edges: [Type1Interface2Edge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            \\"\\"\\"
            Fields to sort Type1s by. The order in which sorts are applied is not guaranteed when specifying many fields in one Type1Sort object.
            \\"\\"\\"
            input Type1Sort {
              field1: SortDirection
            }

            input Type1UpdateInput {
              field1_SET: String
              interface1: [Type1Interface1UpdateFieldInput!]
            }

            input Type1Where {
              AND: [Type1Where!]
              NOT: Type1Where
              OR: [Type1Where!]
              field1: StringScalarFilters
              field1_CONTAINS: String
              field1_ENDS_WITH: String
              field1_EQ: String
              field1_IN: [String!]
              field1_STARTS_WITH: String
              interface1: Type1Interface1RelationshipFilters
              interface1Aggregate: Type1Interface1AggregateInput
              interface1Connection: Type1Interface1ConnectionFilters
              \\"\\"\\"
              Return Type1s where all of the related Type1Interface1Connections match this filter
              \\"\\"\\"
              interface1Connection_ALL: Type1Interface1ConnectionWhere
              \\"\\"\\"
              Return Type1s where none of the related Type1Interface1Connections match this filter
              \\"\\"\\"
              interface1Connection_NONE: Type1Interface1ConnectionWhere
              \\"\\"\\"
              Return Type1s where one of the related Type1Interface1Connections match this filter
              \\"\\"\\"
              interface1Connection_SINGLE: Type1Interface1ConnectionWhere
              \\"\\"\\"
              Return Type1s where some of the related Type1Interface1Connections match this filter
              \\"\\"\\"
              interface1Connection_SOME: Type1Interface1ConnectionWhere
              \\"\\"\\"Return Type1s where all of the related Interface1s match this filter\\"\\"\\"
              interface1_ALL: Interface1Where
              \\"\\"\\"Return Type1s where none of the related Interface1s match this filter\\"\\"\\"
              interface1_NONE: Interface1Where
              \\"\\"\\"Return Type1s where one of the related Interface1s match this filter\\"\\"\\"
              interface1_SINGLE: Interface1Where
              \\"\\"\\"Return Type1s where some of the related Interface1s match this filter\\"\\"\\"
              interface1_SOME: Interface1Where
            }

            type Type1sConnection {
              edges: [Type1Edge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            type Type2Interface1 implements Interface1 {
              field1: String!
              interface2(limit: Int, offset: Int, sort: [Interface2Sort!], where: Interface2Where): [Interface2!]!
              interface2Aggregate(where: Interface2Where): Type2Interface1Interface2Interface2AggregationSelection
              interface2Connection(after: String, first: Int, sort: [Interface1Interface2ConnectionSort!], where: Interface1Interface2ConnectionWhere): Interface1Interface2Connection!
            }

            type Type2Interface1AggregateSelection {
              count: Int!
              field1: StringAggregateSelection!
            }

            input Type2Interface1CreateInput {
              field1: String!
              interface2: Type2Interface1Interface2FieldInput
            }

            input Type2Interface1DeleteInput {
              interface2: [Type2Interface1Interface2DeleteFieldInput!]
            }

            type Type2Interface1Edge {
              cursor: String!
              node: Type2Interface1!
            }

            input Type2Interface1Interface2AggregateInput {
              AND: [Type2Interface1Interface2AggregateInput!]
              NOT: Type2Interface1Interface2AggregateInput
              OR: [Type2Interface1Interface2AggregateInput!]
              count_EQ: Int
              count_GT: Int
              count_GTE: Int
              count_LT: Int
              count_LTE: Int
              edge: PropsAggregationWhereInput
              node: Type2Interface1Interface2NodeAggregationWhereInput
            }

            input Type2Interface1Interface2ConnectFieldInput {
              edge: PropsCreateInput!
              where: Interface2ConnectWhere
            }

            input Type2Interface1Interface2ConnectionFilters {
              \\"\\"\\"
              Return Type2Interface1s where all of the related Interface1Interface2Connections match this filter
              \\"\\"\\"
              all: Interface1Interface2ConnectionWhere
              \\"\\"\\"
              Return Type2Interface1s where none of the related Interface1Interface2Connections match this filter
              \\"\\"\\"
              none: Interface1Interface2ConnectionWhere
              \\"\\"\\"
              Return Type2Interface1s where one of the related Interface1Interface2Connections match this filter
              \\"\\"\\"
              single: Interface1Interface2ConnectionWhere
              \\"\\"\\"
              Return Type2Interface1s where some of the related Interface1Interface2Connections match this filter
              \\"\\"\\"
              some: Interface1Interface2ConnectionWhere
            }

            input Type2Interface1Interface2CreateFieldInput {
              edge: PropsCreateInput!
              node: Interface2CreateInput!
            }

            input Type2Interface1Interface2DeleteFieldInput {
              where: Interface1Interface2ConnectionWhere
            }

            input Type2Interface1Interface2DisconnectFieldInput {
              where: Interface1Interface2ConnectionWhere
            }

            input Type2Interface1Interface2FieldInput {
              connect: [Type2Interface1Interface2ConnectFieldInput!]
              create: [Type2Interface1Interface2CreateFieldInput!]
            }

            type Type2Interface1Interface2Interface2AggregationSelection {
              count: Int!
              edge: Type2Interface1Interface2Interface2EdgeAggregateSelection
              node: Type2Interface1Interface2Interface2NodeAggregateSelection
            }

            type Type2Interface1Interface2Interface2EdgeAggregateSelection {
              propsField: IntAggregateSelection!
            }

            type Type2Interface1Interface2Interface2NodeAggregateSelection {
              field2: StringAggregateSelection!
            }

            input Type2Interface1Interface2NodeAggregationWhereInput {
              AND: [Type2Interface1Interface2NodeAggregationWhereInput!]
              NOT: Type2Interface1Interface2NodeAggregationWhereInput
              OR: [Type2Interface1Interface2NodeAggregationWhereInput!]
              field2_AVERAGE_LENGTH_EQUAL: Float
              field2_AVERAGE_LENGTH_GT: Float
              field2_AVERAGE_LENGTH_GTE: Float
              field2_AVERAGE_LENGTH_LT: Float
              field2_AVERAGE_LENGTH_LTE: Float
              field2_LONGEST_LENGTH_EQUAL: Int
              field2_LONGEST_LENGTH_GT: Int
              field2_LONGEST_LENGTH_GTE: Int
              field2_LONGEST_LENGTH_LT: Int
              field2_LONGEST_LENGTH_LTE: Int
              field2_SHORTEST_LENGTH_EQUAL: Int
              field2_SHORTEST_LENGTH_GT: Int
              field2_SHORTEST_LENGTH_GTE: Int
              field2_SHORTEST_LENGTH_LT: Int
              field2_SHORTEST_LENGTH_LTE: Int
            }

            input Type2Interface1Interface2RelationshipFilters {
              \\"\\"\\"
              Return Type2Interface1s where all of the related Interface2s match this filter
              \\"\\"\\"
              all: Interface2Where
              \\"\\"\\"
              Return Type2Interface1s where none of the related Interface2s match this filter
              \\"\\"\\"
              none: Interface2Where
              \\"\\"\\"
              Return Type2Interface1s where one of the related Interface2s match this filter
              \\"\\"\\"
              single: Interface2Where
              \\"\\"\\"
              Return Type2Interface1s where some of the related Interface2s match this filter
              \\"\\"\\"
              some: Interface2Where
            }

            input Type2Interface1Interface2UpdateConnectionInput {
              edge: PropsUpdateInput
              node: Interface2UpdateInput
            }

            input Type2Interface1Interface2UpdateFieldInput {
              connect: [Type2Interface1Interface2ConnectFieldInput!]
              create: [Type2Interface1Interface2CreateFieldInput!]
              delete: [Type2Interface1Interface2DeleteFieldInput!]
              disconnect: [Type2Interface1Interface2DisconnectFieldInput!]
              update: Type2Interface1Interface2UpdateConnectionInput
              where: Interface1Interface2ConnectionWhere
            }

            \\"\\"\\"
            Fields to sort Type2Interface1s by. The order in which sorts are applied is not guaranteed when specifying many fields in one Type2Interface1Sort object.
            \\"\\"\\"
            input Type2Interface1Sort {
              field1: SortDirection
            }

            input Type2Interface1UpdateInput {
              field1_SET: String
              interface2: [Type2Interface1Interface2UpdateFieldInput!]
            }

            input Type2Interface1Where {
              AND: [Type2Interface1Where!]
              NOT: Type2Interface1Where
              OR: [Type2Interface1Where!]
              field1: StringScalarFilters
              field1_CONTAINS: String
              field1_ENDS_WITH: String
              field1_EQ: String
              field1_IN: [String!]
              field1_STARTS_WITH: String
              interface2: Type2Interface1Interface2RelationshipFilters
              interface2Aggregate: Type2Interface1Interface2AggregateInput
              interface2Connection: Type2Interface1Interface2ConnectionFilters
              \\"\\"\\"
              Return Type2Interface1s where all of the related Interface1Interface2Connections match this filter
              \\"\\"\\"
              interface2Connection_ALL: Interface1Interface2ConnectionWhere
              \\"\\"\\"
              Return Type2Interface1s where none of the related Interface1Interface2Connections match this filter
              \\"\\"\\"
              interface2Connection_NONE: Interface1Interface2ConnectionWhere
              \\"\\"\\"
              Return Type2Interface1s where one of the related Interface1Interface2Connections match this filter
              \\"\\"\\"
              interface2Connection_SINGLE: Interface1Interface2ConnectionWhere
              \\"\\"\\"
              Return Type2Interface1s where some of the related Interface1Interface2Connections match this filter
              \\"\\"\\"
              interface2Connection_SOME: Interface1Interface2ConnectionWhere
              \\"\\"\\"
              Return Type2Interface1s where all of the related Interface2s match this filter
              \\"\\"\\"
              interface2_ALL: Interface2Where
              \\"\\"\\"
              Return Type2Interface1s where none of the related Interface2s match this filter
              \\"\\"\\"
              interface2_NONE: Interface2Where
              \\"\\"\\"
              Return Type2Interface1s where one of the related Interface2s match this filter
              \\"\\"\\"
              interface2_SINGLE: Interface2Where
              \\"\\"\\"
              Return Type2Interface1s where some of the related Interface2s match this filter
              \\"\\"\\"
              interface2_SOME: Interface2Where
            }

            type Type2Interface1sConnection {
              edges: [Type2Interface1Edge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            type Type2Interface2 implements Interface2 {
              field2: String!
            }

            type Type2Interface2AggregateSelection {
              count: Int!
              field2: StringAggregateSelection!
            }

            input Type2Interface2CreateInput {
              field2: String!
            }

            type Type2Interface2Edge {
              cursor: String!
              node: Type2Interface2!
            }

            \\"\\"\\"
            Fields to sort Type2Interface2s by. The order in which sorts are applied is not guaranteed when specifying many fields in one Type2Interface2Sort object.
            \\"\\"\\"
            input Type2Interface2Sort {
              field2: SortDirection
            }

            input Type2Interface2UpdateInput {
              field2_SET: String
            }

            input Type2Interface2Where {
              AND: [Type2Interface2Where!]
              NOT: Type2Interface2Where
              OR: [Type2Interface2Where!]
              field2: StringScalarFilters
              field2_CONTAINS: String
              field2_ENDS_WITH: String
              field2_EQ: String
              field2_IN: [String!]
              field2_STARTS_WITH: String
            }

            type Type2Interface2sConnection {
              edges: [Type2Interface2Edge!]!
              pageInfo: PageInfo!
              totalCount: Int!
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

            type UpdateType1Interface1sMutationResponse {
              info: UpdateInfo!
              type1Interface1s: [Type1Interface1!]!
            }

            type UpdateType1Interface2sMutationResponse {
              info: UpdateInfo!
              type1Interface2s: [Type1Interface2!]!
            }

            type UpdateType1sMutationResponse {
              info: UpdateInfo!
              type1s: [Type1!]!
            }

            type UpdateType2Interface1sMutationResponse {
              info: UpdateInfo!
              type2Interface1s: [Type2Interface1!]!
            }

            type UpdateType2Interface2sMutationResponse {
              info: UpdateInfo!
              type2Interface2s: [Type2Interface2!]!
            }"
        `);

        // expect(() => {
        //     // eslint-disable-next-line @typescript-eslint/no-unused-vars
        //     const neoSchema = new Neo4jGraphQL({ typeDefs });
        // }).toThrowError("Nested interface relationship fields are not supported: Interface1.interface2");
    });

    test("Interface Relationships - nested interface relationships - different relationship implementations", async () => {
        const typeDefs = gql`
            interface Interface1 {
                field1: String!
                interface2: [Interface2!]! @declareRelationship
            }

            interface Interface2 {
                field2: String
            }

            type Type1Interface1 implements Interface1 @node {
                field1: String!
                interface2: [Interface2!]!
                    @relationship(type: "INTERFACE_TWO", direction: OUT, properties: "Type1Props")
            }

            type Type2Interface1 implements Interface1 @node {
                field1: String!
                interface2: [Interface2!]!
                    @relationship(type: "INTERFACE_TWO", direction: OUT, properties: "Type2Props")
            }

            type Type1Interface2 implements Interface2 @node {
                field2: String!
            }

            type Type2Interface2 implements Interface2 @node {
                field2: String!
            }

            type Type1 @node {
                field1: String!
                interface1: [Interface1!]! @relationship(type: "INTERFACE_ONE", direction: OUT)
            }

            type Type1Props @relationshipProperties {
                type1Field: Int!
            }

            type Type2Props @relationshipProperties {
                type2Field: Int!
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

            type CreateType1Interface1sMutationResponse {
              info: CreateInfo!
              type1Interface1s: [Type1Interface1!]!
            }

            type CreateType1Interface2sMutationResponse {
              info: CreateInfo!
              type1Interface2s: [Type1Interface2!]!
            }

            type CreateType1sMutationResponse {
              info: CreateInfo!
              type1s: [Type1!]!
            }

            type CreateType2Interface1sMutationResponse {
              info: CreateInfo!
              type2Interface1s: [Type2Interface1!]!
            }

            type CreateType2Interface2sMutationResponse {
              info: CreateInfo!
              type2Interface2s: [Type2Interface2!]!
            }

            \\"\\"\\"
            Information about the number of nodes and relationships deleted during a delete mutation
            \\"\\"\\"
            type DeleteInfo {
              nodesDeleted: Int!
              relationshipsDeleted: Int!
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

            interface Interface1 {
              field1: String!
              interface2(limit: Int, offset: Int, sort: [Interface2Sort!], where: Interface2Where): [Interface2!]!
              interface2Connection(after: String, first: Int, sort: [Interface1Interface2ConnectionSort!], where: Interface1Interface2ConnectionWhere): Interface1Interface2Connection!
            }

            type Interface1AggregateSelection {
              count: Int!
              field1: StringAggregateSelection!
            }

            input Interface1ConnectInput {
              interface2: [Interface1Interface2ConnectFieldInput!]
            }

            input Interface1ConnectWhere {
              node: Interface1Where!
            }

            input Interface1CreateInput {
              Type1Interface1: Type1Interface1CreateInput
              Type2Interface1: Type2Interface1CreateInput
            }

            input Interface1DeleteInput {
              interface2: [Interface1Interface2DeleteFieldInput!]
            }

            input Interface1DisconnectInput {
              interface2: [Interface1Interface2DisconnectFieldInput!]
            }

            type Interface1Edge {
              cursor: String!
              node: Interface1!
            }

            enum Interface1Implementation {
              Type1Interface1
              Type2Interface1
            }

            input Interface1Interface2AggregateInput {
              AND: [Interface1Interface2AggregateInput!]
              NOT: Interface1Interface2AggregateInput
              OR: [Interface1Interface2AggregateInput!]
              count_EQ: Int
              count_GT: Int
              count_GTE: Int
              count_LT: Int
              count_LTE: Int
              edge: Interface1Interface2EdgeAggregationWhereInput
              node: Interface1Interface2NodeAggregationWhereInput
            }

            input Interface1Interface2ConnectFieldInput {
              edge: Interface1Interface2EdgeCreateInput!
              where: Interface2ConnectWhere
            }

            type Interface1Interface2Connection {
              edges: [Interface1Interface2Relationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input Interface1Interface2ConnectionFilters {
              \\"\\"\\"
              Return Interface1s where all of the related Interface1Interface2Connections match this filter
              \\"\\"\\"
              all: Interface1Interface2ConnectionWhere
              \\"\\"\\"
              Return Interface1s where none of the related Interface1Interface2Connections match this filter
              \\"\\"\\"
              none: Interface1Interface2ConnectionWhere
              \\"\\"\\"
              Return Interface1s where one of the related Interface1Interface2Connections match this filter
              \\"\\"\\"
              single: Interface1Interface2ConnectionWhere
              \\"\\"\\"
              Return Interface1s where some of the related Interface1Interface2Connections match this filter
              \\"\\"\\"
              some: Interface1Interface2ConnectionWhere
            }

            input Interface1Interface2ConnectionSort {
              edge: Interface1Interface2EdgeSort
              node: Interface2Sort
            }

            input Interface1Interface2ConnectionWhere {
              AND: [Interface1Interface2ConnectionWhere!]
              NOT: Interface1Interface2ConnectionWhere
              OR: [Interface1Interface2ConnectionWhere!]
              edge: Interface1Interface2EdgeWhere
              node: Interface2Where
            }

            input Interface1Interface2CreateFieldInput {
              edge: Interface1Interface2EdgeCreateInput!
              node: Interface2CreateInput!
            }

            input Interface1Interface2DeleteFieldInput {
              where: Interface1Interface2ConnectionWhere
            }

            input Interface1Interface2DisconnectFieldInput {
              where: Interface1Interface2ConnectionWhere
            }

            input Interface1Interface2EdgeAggregationWhereInput {
              \\"\\"\\"
              Relationship properties when source node is of type:
              * Type1Interface1
              \\"\\"\\"
              Type1Props: Type1PropsAggregationWhereInput
              \\"\\"\\"
              Relationship properties when source node is of type:
              * Type2Interface1
              \\"\\"\\"
              Type2Props: Type2PropsAggregationWhereInput
            }

            input Interface1Interface2EdgeCreateInput {
              \\"\\"\\"
              Relationship properties when source node is of type:
              * Type1Interface1
              \\"\\"\\"
              Type1Props: Type1PropsCreateInput!
              \\"\\"\\"
              Relationship properties when source node is of type:
              * Type2Interface1
              \\"\\"\\"
              Type2Props: Type2PropsCreateInput!
            }

            input Interface1Interface2EdgeSort {
              \\"\\"\\"
              Relationship properties when source node is of type:
              * Type1Interface1
              \\"\\"\\"
              Type1Props: Type1PropsSort
              \\"\\"\\"
              Relationship properties when source node is of type:
              * Type2Interface1
              \\"\\"\\"
              Type2Props: Type2PropsSort
            }

            input Interface1Interface2EdgeUpdateInput {
              \\"\\"\\"
              Relationship properties when source node is of type:
              * Type1Interface1
              \\"\\"\\"
              Type1Props: Type1PropsUpdateInput
              \\"\\"\\"
              Relationship properties when source node is of type:
              * Type2Interface1
              \\"\\"\\"
              Type2Props: Type2PropsUpdateInput
            }

            input Interface1Interface2EdgeWhere {
              \\"\\"\\"
              Relationship properties when source node is of type:
              * Type1Interface1
              \\"\\"\\"
              Type1Props: Type1PropsWhere
              \\"\\"\\"
              Relationship properties when source node is of type:
              * Type2Interface1
              \\"\\"\\"
              Type2Props: Type2PropsWhere
            }

            input Interface1Interface2NodeAggregationWhereInput {
              AND: [Interface1Interface2NodeAggregationWhereInput!]
              NOT: Interface1Interface2NodeAggregationWhereInput
              OR: [Interface1Interface2NodeAggregationWhereInput!]
              field2_AVERAGE_LENGTH_EQUAL: Float
              field2_AVERAGE_LENGTH_GT: Float
              field2_AVERAGE_LENGTH_GTE: Float
              field2_AVERAGE_LENGTH_LT: Float
              field2_AVERAGE_LENGTH_LTE: Float
              field2_LONGEST_LENGTH_EQUAL: Int
              field2_LONGEST_LENGTH_GT: Int
              field2_LONGEST_LENGTH_GTE: Int
              field2_LONGEST_LENGTH_LT: Int
              field2_LONGEST_LENGTH_LTE: Int
              field2_SHORTEST_LENGTH_EQUAL: Int
              field2_SHORTEST_LENGTH_GT: Int
              field2_SHORTEST_LENGTH_GTE: Int
              field2_SHORTEST_LENGTH_LT: Int
              field2_SHORTEST_LENGTH_LTE: Int
            }

            type Interface1Interface2Relationship {
              cursor: String!
              node: Interface2!
              properties: Interface1Interface2RelationshipProperties!
            }

            input Interface1Interface2RelationshipFilters {
              \\"\\"\\"
              Return Interface1s where all of the related Interface2s match this filter
              \\"\\"\\"
              all: Interface2Where
              \\"\\"\\"
              Return Interface1s where none of the related Interface2s match this filter
              \\"\\"\\"
              none: Interface2Where
              \\"\\"\\"
              Return Interface1s where one of the related Interface2s match this filter
              \\"\\"\\"
              single: Interface2Where
              \\"\\"\\"
              Return Interface1s where some of the related Interface2s match this filter
              \\"\\"\\"
              some: Interface2Where
            }

            union Interface1Interface2RelationshipProperties = Type1Props | Type2Props

            input Interface1Interface2UpdateConnectionInput {
              edge: Interface1Interface2EdgeUpdateInput
              node: Interface2UpdateInput
            }

            input Interface1Interface2UpdateFieldInput {
              connect: [Interface1Interface2ConnectFieldInput!]
              create: [Interface1Interface2CreateFieldInput!]
              delete: [Interface1Interface2DeleteFieldInput!]
              disconnect: [Interface1Interface2DisconnectFieldInput!]
              update: Interface1Interface2UpdateConnectionInput
              where: Interface1Interface2ConnectionWhere
            }

            \\"\\"\\"
            Fields to sort Interface1s by. The order in which sorts are applied is not guaranteed when specifying many fields in one Interface1Sort object.
            \\"\\"\\"
            input Interface1Sort {
              field1: SortDirection
            }

            input Interface1UpdateInput {
              field1_SET: String
              interface2: [Interface1Interface2UpdateFieldInput!]
            }

            input Interface1Where {
              AND: [Interface1Where!]
              NOT: Interface1Where
              OR: [Interface1Where!]
              field1: StringScalarFilters
              field1_CONTAINS: String
              field1_ENDS_WITH: String
              field1_EQ: String
              field1_IN: [String!]
              field1_STARTS_WITH: String
              interface2: Interface1Interface2RelationshipFilters
              interface2Aggregate: Interface1Interface2AggregateInput
              interface2Connection: Interface1Interface2ConnectionFilters
              \\"\\"\\"
              Return Interface1s where all of the related Interface1Interface2Connections match this filter
              \\"\\"\\"
              interface2Connection_ALL: Interface1Interface2ConnectionWhere
              \\"\\"\\"
              Return Interface1s where none of the related Interface1Interface2Connections match this filter
              \\"\\"\\"
              interface2Connection_NONE: Interface1Interface2ConnectionWhere
              \\"\\"\\"
              Return Interface1s where one of the related Interface1Interface2Connections match this filter
              \\"\\"\\"
              interface2Connection_SINGLE: Interface1Interface2ConnectionWhere
              \\"\\"\\"
              Return Interface1s where some of the related Interface1Interface2Connections match this filter
              \\"\\"\\"
              interface2Connection_SOME: Interface1Interface2ConnectionWhere
              \\"\\"\\"
              Return Interface1s where all of the related Interface2s match this filter
              \\"\\"\\"
              interface2_ALL: Interface2Where
              \\"\\"\\"
              Return Interface1s where none of the related Interface2s match this filter
              \\"\\"\\"
              interface2_NONE: Interface2Where
              \\"\\"\\"
              Return Interface1s where one of the related Interface2s match this filter
              \\"\\"\\"
              interface2_SINGLE: Interface2Where
              \\"\\"\\"
              Return Interface1s where some of the related Interface2s match this filter
              \\"\\"\\"
              interface2_SOME: Interface2Where
              typename_IN: [Interface1Implementation!]
            }

            type Interface1sConnection {
              edges: [Interface1Edge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            interface Interface2 {
              field2: String
            }

            type Interface2AggregateSelection {
              count: Int!
              field2: StringAggregateSelection!
            }

            input Interface2ConnectWhere {
              node: Interface2Where!
            }

            input Interface2CreateInput {
              Type1Interface2: Type1Interface2CreateInput
              Type2Interface2: Type2Interface2CreateInput
            }

            type Interface2Edge {
              cursor: String!
              node: Interface2!
            }

            enum Interface2Implementation {
              Type1Interface2
              Type2Interface2
            }

            \\"\\"\\"
            Fields to sort Interface2s by. The order in which sorts are applied is not guaranteed when specifying many fields in one Interface2Sort object.
            \\"\\"\\"
            input Interface2Sort {
              field2: SortDirection
            }

            input Interface2UpdateInput {
              field2_SET: String
            }

            input Interface2Where {
              AND: [Interface2Where!]
              NOT: Interface2Where
              OR: [Interface2Where!]
              field2: StringScalarFilters
              field2_CONTAINS: String
              field2_ENDS_WITH: String
              field2_EQ: String
              field2_IN: [String]
              field2_STARTS_WITH: String
              typename_IN: [Interface2Implementation!]
            }

            type Interface2sConnection {
              edges: [Interface2Edge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            type Mutation {
              createType1Interface1s(input: [Type1Interface1CreateInput!]!): CreateType1Interface1sMutationResponse!
              createType1Interface2s(input: [Type1Interface2CreateInput!]!): CreateType1Interface2sMutationResponse!
              createType1s(input: [Type1CreateInput!]!): CreateType1sMutationResponse!
              createType2Interface1s(input: [Type2Interface1CreateInput!]!): CreateType2Interface1sMutationResponse!
              createType2Interface2s(input: [Type2Interface2CreateInput!]!): CreateType2Interface2sMutationResponse!
              deleteType1Interface1s(delete: Type1Interface1DeleteInput, where: Type1Interface1Where): DeleteInfo!
              deleteType1Interface2s(where: Type1Interface2Where): DeleteInfo!
              deleteType1s(delete: Type1DeleteInput, where: Type1Where): DeleteInfo!
              deleteType2Interface1s(delete: Type2Interface1DeleteInput, where: Type2Interface1Where): DeleteInfo!
              deleteType2Interface2s(where: Type2Interface2Where): DeleteInfo!
              updateType1Interface1s(update: Type1Interface1UpdateInput, where: Type1Interface1Where): UpdateType1Interface1sMutationResponse!
              updateType1Interface2s(update: Type1Interface2UpdateInput, where: Type1Interface2Where): UpdateType1Interface2sMutationResponse!
              updateType1s(update: Type1UpdateInput, where: Type1Where): UpdateType1sMutationResponse!
              updateType2Interface1s(update: Type2Interface1UpdateInput, where: Type2Interface1Where): UpdateType2Interface1sMutationResponse!
              updateType2Interface2s(update: Type2Interface2UpdateInput, where: Type2Interface2Where): UpdateType2Interface2sMutationResponse!
            }

            \\"\\"\\"Pagination information (Relay)\\"\\"\\"
            type PageInfo {
              endCursor: String
              hasNextPage: Boolean!
              hasPreviousPage: Boolean!
              startCursor: String
            }

            type Query {
              interface1s(limit: Int, offset: Int, sort: [Interface1Sort!], where: Interface1Where): [Interface1!]!
              interface1sAggregate(where: Interface1Where): Interface1AggregateSelection!
              interface1sConnection(after: String, first: Int, sort: [Interface1Sort!], where: Interface1Where): Interface1sConnection!
              interface2s(limit: Int, offset: Int, sort: [Interface2Sort!], where: Interface2Where): [Interface2!]!
              interface2sAggregate(where: Interface2Where): Interface2AggregateSelection!
              interface2sConnection(after: String, first: Int, sort: [Interface2Sort!], where: Interface2Where): Interface2sConnection!
              type1Interface1s(limit: Int, offset: Int, sort: [Type1Interface1Sort!], where: Type1Interface1Where): [Type1Interface1!]!
              type1Interface1sAggregate(where: Type1Interface1Where): Type1Interface1AggregateSelection!
              type1Interface1sConnection(after: String, first: Int, sort: [Type1Interface1Sort!], where: Type1Interface1Where): Type1Interface1sConnection!
              type1Interface2s(limit: Int, offset: Int, sort: [Type1Interface2Sort!], where: Type1Interface2Where): [Type1Interface2!]!
              type1Interface2sAggregate(where: Type1Interface2Where): Type1Interface2AggregateSelection!
              type1Interface2sConnection(after: String, first: Int, sort: [Type1Interface2Sort!], where: Type1Interface2Where): Type1Interface2sConnection!
              type1s(limit: Int, offset: Int, sort: [Type1Sort!], where: Type1Where): [Type1!]!
              type1sAggregate(where: Type1Where): Type1AggregateSelection!
              type1sConnection(after: String, first: Int, sort: [Type1Sort!], where: Type1Where): Type1sConnection!
              type2Interface1s(limit: Int, offset: Int, sort: [Type2Interface1Sort!], where: Type2Interface1Where): [Type2Interface1!]!
              type2Interface1sAggregate(where: Type2Interface1Where): Type2Interface1AggregateSelection!
              type2Interface1sConnection(after: String, first: Int, sort: [Type2Interface1Sort!], where: Type2Interface1Where): Type2Interface1sConnection!
              type2Interface2s(limit: Int, offset: Int, sort: [Type2Interface2Sort!], where: Type2Interface2Where): [Type2Interface2!]!
              type2Interface2sAggregate(where: Type2Interface2Where): Type2Interface2AggregateSelection!
              type2Interface2sConnection(after: String, first: Int, sort: [Type2Interface2Sort!], where: Type2Interface2Where): Type2Interface2sConnection!
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

            type Type1 {
              field1: String!
              interface1(limit: Int, offset: Int, sort: [Interface1Sort!], where: Interface1Where): [Interface1!]!
              interface1Aggregate(where: Interface1Where): Type1Interface1Interface1AggregationSelection
              interface1Connection(after: String, first: Int, sort: [Type1Interface1ConnectionSort!], where: Type1Interface1ConnectionWhere): Type1Interface1Connection!
            }

            type Type1AggregateSelection {
              count: Int!
              field1: StringAggregateSelection!
            }

            input Type1CreateInput {
              field1: String!
              interface1: Type1Interface1FieldInput
            }

            input Type1DeleteInput {
              interface1: [Type1Interface1DeleteFieldInput!]
            }

            type Type1Edge {
              cursor: String!
              node: Type1!
            }

            type Type1Interface1 implements Interface1 {
              field1: String!
              interface2(limit: Int, offset: Int, sort: [Interface2Sort!], where: Interface2Where): [Interface2!]!
              interface2Aggregate(where: Interface2Where): Type1Interface1Interface2Interface2AggregationSelection
              interface2Connection(after: String, first: Int, sort: [Interface1Interface2ConnectionSort!], where: Interface1Interface2ConnectionWhere): Interface1Interface2Connection!
            }

            input Type1Interface1AggregateInput {
              AND: [Type1Interface1AggregateInput!]
              NOT: Type1Interface1AggregateInput
              OR: [Type1Interface1AggregateInput!]
              count_EQ: Int
              count_GT: Int
              count_GTE: Int
              count_LT: Int
              count_LTE: Int
              node: Type1Interface1NodeAggregationWhereInput
            }

            type Type1Interface1AggregateSelection {
              count: Int!
              field1: StringAggregateSelection!
            }

            input Type1Interface1ConnectFieldInput {
              connect: Interface1ConnectInput
              where: Interface1ConnectWhere
            }

            type Type1Interface1Connection {
              edges: [Type1Interface1Relationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input Type1Interface1ConnectionFilters {
              \\"\\"\\"
              Return Type1s where all of the related Type1Interface1Connections match this filter
              \\"\\"\\"
              all: Type1Interface1ConnectionWhere
              \\"\\"\\"
              Return Type1s where none of the related Type1Interface1Connections match this filter
              \\"\\"\\"
              none: Type1Interface1ConnectionWhere
              \\"\\"\\"
              Return Type1s where one of the related Type1Interface1Connections match this filter
              \\"\\"\\"
              single: Type1Interface1ConnectionWhere
              \\"\\"\\"
              Return Type1s where some of the related Type1Interface1Connections match this filter
              \\"\\"\\"
              some: Type1Interface1ConnectionWhere
            }

            input Type1Interface1ConnectionSort {
              node: Interface1Sort
            }

            input Type1Interface1ConnectionWhere {
              AND: [Type1Interface1ConnectionWhere!]
              NOT: Type1Interface1ConnectionWhere
              OR: [Type1Interface1ConnectionWhere!]
              node: Interface1Where
            }

            input Type1Interface1CreateFieldInput {
              node: Interface1CreateInput!
            }

            input Type1Interface1CreateInput {
              field1: String!
              interface2: Type1Interface1Interface2FieldInput
            }

            input Type1Interface1DeleteFieldInput {
              delete: Interface1DeleteInput
              where: Type1Interface1ConnectionWhere
            }

            input Type1Interface1DeleteInput {
              interface2: [Type1Interface1Interface2DeleteFieldInput!]
            }

            input Type1Interface1DisconnectFieldInput {
              disconnect: Interface1DisconnectInput
              where: Type1Interface1ConnectionWhere
            }

            type Type1Interface1Edge {
              cursor: String!
              node: Type1Interface1!
            }

            input Type1Interface1FieldInput {
              connect: [Type1Interface1ConnectFieldInput!]
              create: [Type1Interface1CreateFieldInput!]
            }

            type Type1Interface1Interface1AggregationSelection {
              count: Int!
              node: Type1Interface1Interface1NodeAggregateSelection
            }

            type Type1Interface1Interface1NodeAggregateSelection {
              field1: StringAggregateSelection!
            }

            input Type1Interface1Interface2AggregateInput {
              AND: [Type1Interface1Interface2AggregateInput!]
              NOT: Type1Interface1Interface2AggregateInput
              OR: [Type1Interface1Interface2AggregateInput!]
              count_EQ: Int
              count_GT: Int
              count_GTE: Int
              count_LT: Int
              count_LTE: Int
              edge: Type1PropsAggregationWhereInput
              node: Type1Interface1Interface2NodeAggregationWhereInput
            }

            input Type1Interface1Interface2ConnectFieldInput {
              edge: Type1PropsCreateInput!
              where: Interface2ConnectWhere
            }

            input Type1Interface1Interface2ConnectionFilters {
              \\"\\"\\"
              Return Type1Interface1s where all of the related Interface1Interface2Connections match this filter
              \\"\\"\\"
              all: Interface1Interface2ConnectionWhere
              \\"\\"\\"
              Return Type1Interface1s where none of the related Interface1Interface2Connections match this filter
              \\"\\"\\"
              none: Interface1Interface2ConnectionWhere
              \\"\\"\\"
              Return Type1Interface1s where one of the related Interface1Interface2Connections match this filter
              \\"\\"\\"
              single: Interface1Interface2ConnectionWhere
              \\"\\"\\"
              Return Type1Interface1s where some of the related Interface1Interface2Connections match this filter
              \\"\\"\\"
              some: Interface1Interface2ConnectionWhere
            }

            input Type1Interface1Interface2CreateFieldInput {
              edge: Type1PropsCreateInput!
              node: Interface2CreateInput!
            }

            input Type1Interface1Interface2DeleteFieldInput {
              where: Interface1Interface2ConnectionWhere
            }

            input Type1Interface1Interface2DisconnectFieldInput {
              where: Interface1Interface2ConnectionWhere
            }

            input Type1Interface1Interface2FieldInput {
              connect: [Type1Interface1Interface2ConnectFieldInput!]
              create: [Type1Interface1Interface2CreateFieldInput!]
            }

            type Type1Interface1Interface2Interface2AggregationSelection {
              count: Int!
              edge: Type1Interface1Interface2Interface2EdgeAggregateSelection
              node: Type1Interface1Interface2Interface2NodeAggregateSelection
            }

            type Type1Interface1Interface2Interface2EdgeAggregateSelection {
              type1Field: IntAggregateSelection!
            }

            type Type1Interface1Interface2Interface2NodeAggregateSelection {
              field2: StringAggregateSelection!
            }

            input Type1Interface1Interface2NodeAggregationWhereInput {
              AND: [Type1Interface1Interface2NodeAggregationWhereInput!]
              NOT: Type1Interface1Interface2NodeAggregationWhereInput
              OR: [Type1Interface1Interface2NodeAggregationWhereInput!]
              field2_AVERAGE_LENGTH_EQUAL: Float
              field2_AVERAGE_LENGTH_GT: Float
              field2_AVERAGE_LENGTH_GTE: Float
              field2_AVERAGE_LENGTH_LT: Float
              field2_AVERAGE_LENGTH_LTE: Float
              field2_LONGEST_LENGTH_EQUAL: Int
              field2_LONGEST_LENGTH_GT: Int
              field2_LONGEST_LENGTH_GTE: Int
              field2_LONGEST_LENGTH_LT: Int
              field2_LONGEST_LENGTH_LTE: Int
              field2_SHORTEST_LENGTH_EQUAL: Int
              field2_SHORTEST_LENGTH_GT: Int
              field2_SHORTEST_LENGTH_GTE: Int
              field2_SHORTEST_LENGTH_LT: Int
              field2_SHORTEST_LENGTH_LTE: Int
            }

            input Type1Interface1Interface2RelationshipFilters {
              \\"\\"\\"
              Return Type1Interface1s where all of the related Interface2s match this filter
              \\"\\"\\"
              all: Interface2Where
              \\"\\"\\"
              Return Type1Interface1s where none of the related Interface2s match this filter
              \\"\\"\\"
              none: Interface2Where
              \\"\\"\\"
              Return Type1Interface1s where one of the related Interface2s match this filter
              \\"\\"\\"
              single: Interface2Where
              \\"\\"\\"
              Return Type1Interface1s where some of the related Interface2s match this filter
              \\"\\"\\"
              some: Interface2Where
            }

            input Type1Interface1Interface2UpdateConnectionInput {
              edge: Type1PropsUpdateInput
              node: Interface2UpdateInput
            }

            input Type1Interface1Interface2UpdateFieldInput {
              connect: [Type1Interface1Interface2ConnectFieldInput!]
              create: [Type1Interface1Interface2CreateFieldInput!]
              delete: [Type1Interface1Interface2DeleteFieldInput!]
              disconnect: [Type1Interface1Interface2DisconnectFieldInput!]
              update: Type1Interface1Interface2UpdateConnectionInput
              where: Interface1Interface2ConnectionWhere
            }

            input Type1Interface1NodeAggregationWhereInput {
              AND: [Type1Interface1NodeAggregationWhereInput!]
              NOT: Type1Interface1NodeAggregationWhereInput
              OR: [Type1Interface1NodeAggregationWhereInput!]
              field1_AVERAGE_LENGTH_EQUAL: Float
              field1_AVERAGE_LENGTH_GT: Float
              field1_AVERAGE_LENGTH_GTE: Float
              field1_AVERAGE_LENGTH_LT: Float
              field1_AVERAGE_LENGTH_LTE: Float
              field1_LONGEST_LENGTH_EQUAL: Int
              field1_LONGEST_LENGTH_GT: Int
              field1_LONGEST_LENGTH_GTE: Int
              field1_LONGEST_LENGTH_LT: Int
              field1_LONGEST_LENGTH_LTE: Int
              field1_SHORTEST_LENGTH_EQUAL: Int
              field1_SHORTEST_LENGTH_GT: Int
              field1_SHORTEST_LENGTH_GTE: Int
              field1_SHORTEST_LENGTH_LT: Int
              field1_SHORTEST_LENGTH_LTE: Int
            }

            type Type1Interface1Relationship {
              cursor: String!
              node: Interface1!
            }

            input Type1Interface1RelationshipFilters {
              \\"\\"\\"Return Type1s where all of the related Interface1s match this filter\\"\\"\\"
              all: Interface1Where
              \\"\\"\\"Return Type1s where none of the related Interface1s match this filter\\"\\"\\"
              none: Interface1Where
              \\"\\"\\"Return Type1s where one of the related Interface1s match this filter\\"\\"\\"
              single: Interface1Where
              \\"\\"\\"Return Type1s where some of the related Interface1s match this filter\\"\\"\\"
              some: Interface1Where
            }

            \\"\\"\\"
            Fields to sort Type1Interface1s by. The order in which sorts are applied is not guaranteed when specifying many fields in one Type1Interface1Sort object.
            \\"\\"\\"
            input Type1Interface1Sort {
              field1: SortDirection
            }

            input Type1Interface1UpdateConnectionInput {
              node: Interface1UpdateInput
            }

            input Type1Interface1UpdateFieldInput {
              connect: [Type1Interface1ConnectFieldInput!]
              create: [Type1Interface1CreateFieldInput!]
              delete: [Type1Interface1DeleteFieldInput!]
              disconnect: [Type1Interface1DisconnectFieldInput!]
              update: Type1Interface1UpdateConnectionInput
              where: Type1Interface1ConnectionWhere
            }

            input Type1Interface1UpdateInput {
              field1_SET: String
              interface2: [Type1Interface1Interface2UpdateFieldInput!]
            }

            input Type1Interface1Where {
              AND: [Type1Interface1Where!]
              NOT: Type1Interface1Where
              OR: [Type1Interface1Where!]
              field1: StringScalarFilters
              field1_CONTAINS: String
              field1_ENDS_WITH: String
              field1_EQ: String
              field1_IN: [String!]
              field1_STARTS_WITH: String
              interface2: Type1Interface1Interface2RelationshipFilters
              interface2Aggregate: Type1Interface1Interface2AggregateInput
              interface2Connection: Type1Interface1Interface2ConnectionFilters
              \\"\\"\\"
              Return Type1Interface1s where all of the related Interface1Interface2Connections match this filter
              \\"\\"\\"
              interface2Connection_ALL: Interface1Interface2ConnectionWhere
              \\"\\"\\"
              Return Type1Interface1s where none of the related Interface1Interface2Connections match this filter
              \\"\\"\\"
              interface2Connection_NONE: Interface1Interface2ConnectionWhere
              \\"\\"\\"
              Return Type1Interface1s where one of the related Interface1Interface2Connections match this filter
              \\"\\"\\"
              interface2Connection_SINGLE: Interface1Interface2ConnectionWhere
              \\"\\"\\"
              Return Type1Interface1s where some of the related Interface1Interface2Connections match this filter
              \\"\\"\\"
              interface2Connection_SOME: Interface1Interface2ConnectionWhere
              \\"\\"\\"
              Return Type1Interface1s where all of the related Interface2s match this filter
              \\"\\"\\"
              interface2_ALL: Interface2Where
              \\"\\"\\"
              Return Type1Interface1s where none of the related Interface2s match this filter
              \\"\\"\\"
              interface2_NONE: Interface2Where
              \\"\\"\\"
              Return Type1Interface1s where one of the related Interface2s match this filter
              \\"\\"\\"
              interface2_SINGLE: Interface2Where
              \\"\\"\\"
              Return Type1Interface1s where some of the related Interface2s match this filter
              \\"\\"\\"
              interface2_SOME: Interface2Where
            }

            type Type1Interface1sConnection {
              edges: [Type1Interface1Edge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            type Type1Interface2 implements Interface2 {
              field2: String!
            }

            type Type1Interface2AggregateSelection {
              count: Int!
              field2: StringAggregateSelection!
            }

            input Type1Interface2CreateInput {
              field2: String!
            }

            type Type1Interface2Edge {
              cursor: String!
              node: Type1Interface2!
            }

            \\"\\"\\"
            Fields to sort Type1Interface2s by. The order in which sorts are applied is not guaranteed when specifying many fields in one Type1Interface2Sort object.
            \\"\\"\\"
            input Type1Interface2Sort {
              field2: SortDirection
            }

            input Type1Interface2UpdateInput {
              field2_SET: String
            }

            input Type1Interface2Where {
              AND: [Type1Interface2Where!]
              NOT: Type1Interface2Where
              OR: [Type1Interface2Where!]
              field2: StringScalarFilters
              field2_CONTAINS: String
              field2_ENDS_WITH: String
              field2_EQ: String
              field2_IN: [String!]
              field2_STARTS_WITH: String
            }

            type Type1Interface2sConnection {
              edges: [Type1Interface2Edge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            \\"\\"\\"
            The edge properties for the following fields:
            * Type1Interface1.interface2
            \\"\\"\\"
            type Type1Props {
              type1Field: Int!
            }

            input Type1PropsAggregationWhereInput {
              AND: [Type1PropsAggregationWhereInput!]
              NOT: Type1PropsAggregationWhereInput
              OR: [Type1PropsAggregationWhereInput!]
              type1Field_AVERAGE_EQUAL: Float
              type1Field_AVERAGE_GT: Float
              type1Field_AVERAGE_GTE: Float
              type1Field_AVERAGE_LT: Float
              type1Field_AVERAGE_LTE: Float
              type1Field_MAX_EQUAL: Int
              type1Field_MAX_GT: Int
              type1Field_MAX_GTE: Int
              type1Field_MAX_LT: Int
              type1Field_MAX_LTE: Int
              type1Field_MIN_EQUAL: Int
              type1Field_MIN_GT: Int
              type1Field_MIN_GTE: Int
              type1Field_MIN_LT: Int
              type1Field_MIN_LTE: Int
              type1Field_SUM_EQUAL: Int
              type1Field_SUM_GT: Int
              type1Field_SUM_GTE: Int
              type1Field_SUM_LT: Int
              type1Field_SUM_LTE: Int
            }

            input Type1PropsCreateInput {
              type1Field: Int!
            }

            input Type1PropsSort {
              type1Field: SortDirection
            }

            input Type1PropsUpdateInput {
              type1Field_DECREMENT: Int
              type1Field_INCREMENT: Int
              type1Field_SET: Int
            }

            input Type1PropsWhere {
              AND: [Type1PropsWhere!]
              NOT: Type1PropsWhere
              OR: [Type1PropsWhere!]
              type1Field: IntScalarFilters
              type1Field_EQ: Int
              type1Field_GT: Int
              type1Field_GTE: Int
              type1Field_IN: [Int!]
              type1Field_LT: Int
              type1Field_LTE: Int
            }

            \\"\\"\\"
            Fields to sort Type1s by. The order in which sorts are applied is not guaranteed when specifying many fields in one Type1Sort object.
            \\"\\"\\"
            input Type1Sort {
              field1: SortDirection
            }

            input Type1UpdateInput {
              field1_SET: String
              interface1: [Type1Interface1UpdateFieldInput!]
            }

            input Type1Where {
              AND: [Type1Where!]
              NOT: Type1Where
              OR: [Type1Where!]
              field1: StringScalarFilters
              field1_CONTAINS: String
              field1_ENDS_WITH: String
              field1_EQ: String
              field1_IN: [String!]
              field1_STARTS_WITH: String
              interface1: Type1Interface1RelationshipFilters
              interface1Aggregate: Type1Interface1AggregateInput
              interface1Connection: Type1Interface1ConnectionFilters
              \\"\\"\\"
              Return Type1s where all of the related Type1Interface1Connections match this filter
              \\"\\"\\"
              interface1Connection_ALL: Type1Interface1ConnectionWhere
              \\"\\"\\"
              Return Type1s where none of the related Type1Interface1Connections match this filter
              \\"\\"\\"
              interface1Connection_NONE: Type1Interface1ConnectionWhere
              \\"\\"\\"
              Return Type1s where one of the related Type1Interface1Connections match this filter
              \\"\\"\\"
              interface1Connection_SINGLE: Type1Interface1ConnectionWhere
              \\"\\"\\"
              Return Type1s where some of the related Type1Interface1Connections match this filter
              \\"\\"\\"
              interface1Connection_SOME: Type1Interface1ConnectionWhere
              \\"\\"\\"Return Type1s where all of the related Interface1s match this filter\\"\\"\\"
              interface1_ALL: Interface1Where
              \\"\\"\\"Return Type1s where none of the related Interface1s match this filter\\"\\"\\"
              interface1_NONE: Interface1Where
              \\"\\"\\"Return Type1s where one of the related Interface1s match this filter\\"\\"\\"
              interface1_SINGLE: Interface1Where
              \\"\\"\\"Return Type1s where some of the related Interface1s match this filter\\"\\"\\"
              interface1_SOME: Interface1Where
            }

            type Type1sConnection {
              edges: [Type1Edge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            type Type2Interface1 implements Interface1 {
              field1: String!
              interface2(limit: Int, offset: Int, sort: [Interface2Sort!], where: Interface2Where): [Interface2!]!
              interface2Aggregate(where: Interface2Where): Type2Interface1Interface2Interface2AggregationSelection
              interface2Connection(after: String, first: Int, sort: [Interface1Interface2ConnectionSort!], where: Interface1Interface2ConnectionWhere): Interface1Interface2Connection!
            }

            type Type2Interface1AggregateSelection {
              count: Int!
              field1: StringAggregateSelection!
            }

            input Type2Interface1CreateInput {
              field1: String!
              interface2: Type2Interface1Interface2FieldInput
            }

            input Type2Interface1DeleteInput {
              interface2: [Type2Interface1Interface2DeleteFieldInput!]
            }

            type Type2Interface1Edge {
              cursor: String!
              node: Type2Interface1!
            }

            input Type2Interface1Interface2AggregateInput {
              AND: [Type2Interface1Interface2AggregateInput!]
              NOT: Type2Interface1Interface2AggregateInput
              OR: [Type2Interface1Interface2AggregateInput!]
              count_EQ: Int
              count_GT: Int
              count_GTE: Int
              count_LT: Int
              count_LTE: Int
              edge: Type2PropsAggregationWhereInput
              node: Type2Interface1Interface2NodeAggregationWhereInput
            }

            input Type2Interface1Interface2ConnectFieldInput {
              edge: Type2PropsCreateInput!
              where: Interface2ConnectWhere
            }

            input Type2Interface1Interface2ConnectionFilters {
              \\"\\"\\"
              Return Type2Interface1s where all of the related Interface1Interface2Connections match this filter
              \\"\\"\\"
              all: Interface1Interface2ConnectionWhere
              \\"\\"\\"
              Return Type2Interface1s where none of the related Interface1Interface2Connections match this filter
              \\"\\"\\"
              none: Interface1Interface2ConnectionWhere
              \\"\\"\\"
              Return Type2Interface1s where one of the related Interface1Interface2Connections match this filter
              \\"\\"\\"
              single: Interface1Interface2ConnectionWhere
              \\"\\"\\"
              Return Type2Interface1s where some of the related Interface1Interface2Connections match this filter
              \\"\\"\\"
              some: Interface1Interface2ConnectionWhere
            }

            input Type2Interface1Interface2CreateFieldInput {
              edge: Type2PropsCreateInput!
              node: Interface2CreateInput!
            }

            input Type2Interface1Interface2DeleteFieldInput {
              where: Interface1Interface2ConnectionWhere
            }

            input Type2Interface1Interface2DisconnectFieldInput {
              where: Interface1Interface2ConnectionWhere
            }

            input Type2Interface1Interface2FieldInput {
              connect: [Type2Interface1Interface2ConnectFieldInput!]
              create: [Type2Interface1Interface2CreateFieldInput!]
            }

            type Type2Interface1Interface2Interface2AggregationSelection {
              count: Int!
              edge: Type2Interface1Interface2Interface2EdgeAggregateSelection
              node: Type2Interface1Interface2Interface2NodeAggregateSelection
            }

            type Type2Interface1Interface2Interface2EdgeAggregateSelection {
              type2Field: IntAggregateSelection!
            }

            type Type2Interface1Interface2Interface2NodeAggregateSelection {
              field2: StringAggregateSelection!
            }

            input Type2Interface1Interface2NodeAggregationWhereInput {
              AND: [Type2Interface1Interface2NodeAggregationWhereInput!]
              NOT: Type2Interface1Interface2NodeAggregationWhereInput
              OR: [Type2Interface1Interface2NodeAggregationWhereInput!]
              field2_AVERAGE_LENGTH_EQUAL: Float
              field2_AVERAGE_LENGTH_GT: Float
              field2_AVERAGE_LENGTH_GTE: Float
              field2_AVERAGE_LENGTH_LT: Float
              field2_AVERAGE_LENGTH_LTE: Float
              field2_LONGEST_LENGTH_EQUAL: Int
              field2_LONGEST_LENGTH_GT: Int
              field2_LONGEST_LENGTH_GTE: Int
              field2_LONGEST_LENGTH_LT: Int
              field2_LONGEST_LENGTH_LTE: Int
              field2_SHORTEST_LENGTH_EQUAL: Int
              field2_SHORTEST_LENGTH_GT: Int
              field2_SHORTEST_LENGTH_GTE: Int
              field2_SHORTEST_LENGTH_LT: Int
              field2_SHORTEST_LENGTH_LTE: Int
            }

            input Type2Interface1Interface2RelationshipFilters {
              \\"\\"\\"
              Return Type2Interface1s where all of the related Interface2s match this filter
              \\"\\"\\"
              all: Interface2Where
              \\"\\"\\"
              Return Type2Interface1s where none of the related Interface2s match this filter
              \\"\\"\\"
              none: Interface2Where
              \\"\\"\\"
              Return Type2Interface1s where one of the related Interface2s match this filter
              \\"\\"\\"
              single: Interface2Where
              \\"\\"\\"
              Return Type2Interface1s where some of the related Interface2s match this filter
              \\"\\"\\"
              some: Interface2Where
            }

            input Type2Interface1Interface2UpdateConnectionInput {
              edge: Type2PropsUpdateInput
              node: Interface2UpdateInput
            }

            input Type2Interface1Interface2UpdateFieldInput {
              connect: [Type2Interface1Interface2ConnectFieldInput!]
              create: [Type2Interface1Interface2CreateFieldInput!]
              delete: [Type2Interface1Interface2DeleteFieldInput!]
              disconnect: [Type2Interface1Interface2DisconnectFieldInput!]
              update: Type2Interface1Interface2UpdateConnectionInput
              where: Interface1Interface2ConnectionWhere
            }

            \\"\\"\\"
            Fields to sort Type2Interface1s by. The order in which sorts are applied is not guaranteed when specifying many fields in one Type2Interface1Sort object.
            \\"\\"\\"
            input Type2Interface1Sort {
              field1: SortDirection
            }

            input Type2Interface1UpdateInput {
              field1_SET: String
              interface2: [Type2Interface1Interface2UpdateFieldInput!]
            }

            input Type2Interface1Where {
              AND: [Type2Interface1Where!]
              NOT: Type2Interface1Where
              OR: [Type2Interface1Where!]
              field1: StringScalarFilters
              field1_CONTAINS: String
              field1_ENDS_WITH: String
              field1_EQ: String
              field1_IN: [String!]
              field1_STARTS_WITH: String
              interface2: Type2Interface1Interface2RelationshipFilters
              interface2Aggregate: Type2Interface1Interface2AggregateInput
              interface2Connection: Type2Interface1Interface2ConnectionFilters
              \\"\\"\\"
              Return Type2Interface1s where all of the related Interface1Interface2Connections match this filter
              \\"\\"\\"
              interface2Connection_ALL: Interface1Interface2ConnectionWhere
              \\"\\"\\"
              Return Type2Interface1s where none of the related Interface1Interface2Connections match this filter
              \\"\\"\\"
              interface2Connection_NONE: Interface1Interface2ConnectionWhere
              \\"\\"\\"
              Return Type2Interface1s where one of the related Interface1Interface2Connections match this filter
              \\"\\"\\"
              interface2Connection_SINGLE: Interface1Interface2ConnectionWhere
              \\"\\"\\"
              Return Type2Interface1s where some of the related Interface1Interface2Connections match this filter
              \\"\\"\\"
              interface2Connection_SOME: Interface1Interface2ConnectionWhere
              \\"\\"\\"
              Return Type2Interface1s where all of the related Interface2s match this filter
              \\"\\"\\"
              interface2_ALL: Interface2Where
              \\"\\"\\"
              Return Type2Interface1s where none of the related Interface2s match this filter
              \\"\\"\\"
              interface2_NONE: Interface2Where
              \\"\\"\\"
              Return Type2Interface1s where one of the related Interface2s match this filter
              \\"\\"\\"
              interface2_SINGLE: Interface2Where
              \\"\\"\\"
              Return Type2Interface1s where some of the related Interface2s match this filter
              \\"\\"\\"
              interface2_SOME: Interface2Where
            }

            type Type2Interface1sConnection {
              edges: [Type2Interface1Edge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            type Type2Interface2 implements Interface2 {
              field2: String!
            }

            type Type2Interface2AggregateSelection {
              count: Int!
              field2: StringAggregateSelection!
            }

            input Type2Interface2CreateInput {
              field2: String!
            }

            type Type2Interface2Edge {
              cursor: String!
              node: Type2Interface2!
            }

            \\"\\"\\"
            Fields to sort Type2Interface2s by. The order in which sorts are applied is not guaranteed when specifying many fields in one Type2Interface2Sort object.
            \\"\\"\\"
            input Type2Interface2Sort {
              field2: SortDirection
            }

            input Type2Interface2UpdateInput {
              field2_SET: String
            }

            input Type2Interface2Where {
              AND: [Type2Interface2Where!]
              NOT: Type2Interface2Where
              OR: [Type2Interface2Where!]
              field2: StringScalarFilters
              field2_CONTAINS: String
              field2_ENDS_WITH: String
              field2_EQ: String
              field2_IN: [String!]
              field2_STARTS_WITH: String
            }

            type Type2Interface2sConnection {
              edges: [Type2Interface2Edge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            \\"\\"\\"
            The edge properties for the following fields:
            * Type2Interface1.interface2
            \\"\\"\\"
            type Type2Props {
              type2Field: Int!
            }

            input Type2PropsAggregationWhereInput {
              AND: [Type2PropsAggregationWhereInput!]
              NOT: Type2PropsAggregationWhereInput
              OR: [Type2PropsAggregationWhereInput!]
              type2Field_AVERAGE_EQUAL: Float
              type2Field_AVERAGE_GT: Float
              type2Field_AVERAGE_GTE: Float
              type2Field_AVERAGE_LT: Float
              type2Field_AVERAGE_LTE: Float
              type2Field_MAX_EQUAL: Int
              type2Field_MAX_GT: Int
              type2Field_MAX_GTE: Int
              type2Field_MAX_LT: Int
              type2Field_MAX_LTE: Int
              type2Field_MIN_EQUAL: Int
              type2Field_MIN_GT: Int
              type2Field_MIN_GTE: Int
              type2Field_MIN_LT: Int
              type2Field_MIN_LTE: Int
              type2Field_SUM_EQUAL: Int
              type2Field_SUM_GT: Int
              type2Field_SUM_GTE: Int
              type2Field_SUM_LT: Int
              type2Field_SUM_LTE: Int
            }

            input Type2PropsCreateInput {
              type2Field: Int!
            }

            input Type2PropsSort {
              type2Field: SortDirection
            }

            input Type2PropsUpdateInput {
              type2Field_DECREMENT: Int
              type2Field_INCREMENT: Int
              type2Field_SET: Int
            }

            input Type2PropsWhere {
              AND: [Type2PropsWhere!]
              NOT: Type2PropsWhere
              OR: [Type2PropsWhere!]
              type2Field: IntScalarFilters
              type2Field_EQ: Int
              type2Field_GT: Int
              type2Field_GTE: Int
              type2Field_IN: [Int!]
              type2Field_LT: Int
              type2Field_LTE: Int
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

            type UpdateType1Interface1sMutationResponse {
              info: UpdateInfo!
              type1Interface1s: [Type1Interface1!]!
            }

            type UpdateType1Interface2sMutationResponse {
              info: UpdateInfo!
              type1Interface2s: [Type1Interface2!]!
            }

            type UpdateType1sMutationResponse {
              info: UpdateInfo!
              type1s: [Type1!]!
            }

            type UpdateType2Interface1sMutationResponse {
              info: UpdateInfo!
              type2Interface1s: [Type2Interface1!]!
            }

            type UpdateType2Interface2sMutationResponse {
              info: UpdateInfo!
              type2Interface2s: [Type2Interface2!]!
            }"
        `);

        // expect(() => {
        //     // eslint-disable-next-line @typescript-eslint/no-unused-vars
        //     const neoSchema = new Neo4jGraphQL({ typeDefs });
        // }).toThrowError("Nested interface relationship fields are not supported: Interface1.interface2");
    });

    test("Interface Relationships - nested relationships", async () => {
        const typeDefs = gql`
            interface Content {
                id: ID
                content: String
                creator: [User!]! @declareRelationship
            }

            type Comment implements Content @node {
                id: ID
                content: String
                creator: [User!]! @relationship(type: "HAS_CONTENT", direction: IN)
                post: [Post!]! @relationship(type: "HAS_COMMENT", direction: IN)
            }

            type Post implements Content @node {
                id: ID
                content: String
                creator: [User!]! @relationship(type: "HAS_CONTENT", direction: IN)
                comments: [Comment!]! @relationship(type: "HAS_COMMENT", direction: OUT)
            }

            type User @node {
                id: ID
                name: String
                content: [Content!]! @relationship(type: "HAS_CONTENT", direction: OUT)
            }
        `;

        const neoSchema = new Neo4jGraphQL({ typeDefs });
        const printedSchema = printSchemaWithDirectives(lexicographicSortSchema(await neoSchema.getSchema()));

        expect(printedSchema).toMatchInlineSnapshot(`
            "schema {
              query: Query
              mutation: Mutation
            }

            type Comment implements Content {
              content: String
              creator(limit: Int, offset: Int, sort: [UserSort!], where: UserWhere): [User!]!
              creatorAggregate(where: UserWhere): CommentUserCreatorAggregationSelection
              creatorConnection(after: String, first: Int, sort: [ContentCreatorConnectionSort!], where: ContentCreatorConnectionWhere): ContentCreatorConnection!
              id: ID
              post(limit: Int, offset: Int, sort: [PostSort!], where: PostWhere): [Post!]!
              postAggregate(where: PostWhere): CommentPostPostAggregationSelection
              postConnection(after: String, first: Int, sort: [CommentPostConnectionSort!], where: CommentPostConnectionWhere): CommentPostConnection!
            }

            type CommentAggregateSelection {
              content: StringAggregateSelection!
              count: Int!
              id: IDAggregateSelection!
            }

            input CommentConnectInput {
              creator: [CommentCreatorConnectFieldInput!]
              post: [CommentPostConnectFieldInput!]
            }

            input CommentConnectWhere {
              node: CommentWhere!
            }

            input CommentCreateInput {
              content: String
              creator: CommentCreatorFieldInput
              id: ID
              post: CommentPostFieldInput
            }

            input CommentCreatorAggregateInput {
              AND: [CommentCreatorAggregateInput!]
              NOT: CommentCreatorAggregateInput
              OR: [CommentCreatorAggregateInput!]
              count_EQ: Int
              count_GT: Int
              count_GTE: Int
              count_LT: Int
              count_LTE: Int
              node: CommentCreatorNodeAggregationWhereInput
            }

            input CommentCreatorConnectFieldInput {
              connect: [UserConnectInput!]
              where: UserConnectWhere
            }

            input CommentCreatorConnectionFilters {
              \\"\\"\\"
              Return Comments where all of the related ContentCreatorConnections match this filter
              \\"\\"\\"
              all: ContentCreatorConnectionWhere
              \\"\\"\\"
              Return Comments where none of the related ContentCreatorConnections match this filter
              \\"\\"\\"
              none: ContentCreatorConnectionWhere
              \\"\\"\\"
              Return Comments where one of the related ContentCreatorConnections match this filter
              \\"\\"\\"
              single: ContentCreatorConnectionWhere
              \\"\\"\\"
              Return Comments where some of the related ContentCreatorConnections match this filter
              \\"\\"\\"
              some: ContentCreatorConnectionWhere
            }

            input CommentCreatorCreateFieldInput {
              node: UserCreateInput!
            }

            input CommentCreatorFieldInput {
              connect: [CommentCreatorConnectFieldInput!]
              create: [CommentCreatorCreateFieldInput!]
            }

            input CommentCreatorNodeAggregationWhereInput {
              AND: [CommentCreatorNodeAggregationWhereInput!]
              NOT: CommentCreatorNodeAggregationWhereInput
              OR: [CommentCreatorNodeAggregationWhereInput!]
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
              name_AVERAGE_LENGTH_EQUAL: Float
              name_AVERAGE_LENGTH_GT: Float
              name_AVERAGE_LENGTH_GTE: Float
              name_AVERAGE_LENGTH_LT: Float
              name_AVERAGE_LENGTH_LTE: Float
              name_LONGEST_LENGTH_EQUAL: Int
              name_LONGEST_LENGTH_GT: Int
              name_LONGEST_LENGTH_GTE: Int
              name_LONGEST_LENGTH_LT: Int
              name_LONGEST_LENGTH_LTE: Int
              name_SHORTEST_LENGTH_EQUAL: Int
              name_SHORTEST_LENGTH_GT: Int
              name_SHORTEST_LENGTH_GTE: Int
              name_SHORTEST_LENGTH_LT: Int
              name_SHORTEST_LENGTH_LTE: Int
            }

            input CommentCreatorRelationshipFilters {
              \\"\\"\\"Return Comments where all of the related Users match this filter\\"\\"\\"
              all: UserWhere
              \\"\\"\\"Return Comments where none of the related Users match this filter\\"\\"\\"
              none: UserWhere
              \\"\\"\\"Return Comments where one of the related Users match this filter\\"\\"\\"
              single: UserWhere
              \\"\\"\\"Return Comments where some of the related Users match this filter\\"\\"\\"
              some: UserWhere
            }

            input CommentCreatorUpdateConnectionInput {
              node: UserUpdateInput
            }

            input CommentCreatorUpdateFieldInput {
              connect: [CommentCreatorConnectFieldInput!]
              create: [CommentCreatorCreateFieldInput!]
              delete: [ContentCreatorDeleteFieldInput!]
              disconnect: [ContentCreatorDisconnectFieldInput!]
              update: CommentCreatorUpdateConnectionInput
              where: ContentCreatorConnectionWhere
            }

            input CommentDeleteInput {
              creator: [ContentCreatorDeleteFieldInput!]
              post: [CommentPostDeleteFieldInput!]
            }

            input CommentDisconnectInput {
              creator: [ContentCreatorDisconnectFieldInput!]
              post: [CommentPostDisconnectFieldInput!]
            }

            type CommentEdge {
              cursor: String!
              node: Comment!
            }

            input CommentPostAggregateInput {
              AND: [CommentPostAggregateInput!]
              NOT: CommentPostAggregateInput
              OR: [CommentPostAggregateInput!]
              count_EQ: Int
              count_GT: Int
              count_GTE: Int
              count_LT: Int
              count_LTE: Int
              node: CommentPostNodeAggregationWhereInput
            }

            input CommentPostConnectFieldInput {
              connect: [PostConnectInput!]
              where: PostConnectWhere
            }

            type CommentPostConnection {
              edges: [CommentPostRelationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input CommentPostConnectionFilters {
              \\"\\"\\"
              Return Comments where all of the related CommentPostConnections match this filter
              \\"\\"\\"
              all: CommentPostConnectionWhere
              \\"\\"\\"
              Return Comments where none of the related CommentPostConnections match this filter
              \\"\\"\\"
              none: CommentPostConnectionWhere
              \\"\\"\\"
              Return Comments where one of the related CommentPostConnections match this filter
              \\"\\"\\"
              single: CommentPostConnectionWhere
              \\"\\"\\"
              Return Comments where some of the related CommentPostConnections match this filter
              \\"\\"\\"
              some: CommentPostConnectionWhere
            }

            input CommentPostConnectionSort {
              node: PostSort
            }

            input CommentPostConnectionWhere {
              AND: [CommentPostConnectionWhere!]
              NOT: CommentPostConnectionWhere
              OR: [CommentPostConnectionWhere!]
              node: PostWhere
            }

            input CommentPostCreateFieldInput {
              node: PostCreateInput!
            }

            input CommentPostDeleteFieldInput {
              delete: PostDeleteInput
              where: CommentPostConnectionWhere
            }

            input CommentPostDisconnectFieldInput {
              disconnect: PostDisconnectInput
              where: CommentPostConnectionWhere
            }

            input CommentPostFieldInput {
              connect: [CommentPostConnectFieldInput!]
              create: [CommentPostCreateFieldInput!]
            }

            input CommentPostNodeAggregationWhereInput {
              AND: [CommentPostNodeAggregationWhereInput!]
              NOT: CommentPostNodeAggregationWhereInput
              OR: [CommentPostNodeAggregationWhereInput!]
              content_AVERAGE_LENGTH_EQUAL: Float
              content_AVERAGE_LENGTH_GT: Float
              content_AVERAGE_LENGTH_GTE: Float
              content_AVERAGE_LENGTH_LT: Float
              content_AVERAGE_LENGTH_LTE: Float
              content_LONGEST_LENGTH_EQUAL: Int
              content_LONGEST_LENGTH_GT: Int
              content_LONGEST_LENGTH_GTE: Int
              content_LONGEST_LENGTH_LT: Int
              content_LONGEST_LENGTH_LTE: Int
              content_SHORTEST_LENGTH_EQUAL: Int
              content_SHORTEST_LENGTH_GT: Int
              content_SHORTEST_LENGTH_GTE: Int
              content_SHORTEST_LENGTH_LT: Int
              content_SHORTEST_LENGTH_LTE: Int
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

            type CommentPostPostAggregationSelection {
              count: Int!
              node: CommentPostPostNodeAggregateSelection
            }

            type CommentPostPostNodeAggregateSelection {
              content: StringAggregateSelection!
              id: IDAggregateSelection!
            }

            type CommentPostRelationship {
              cursor: String!
              node: Post!
            }

            input CommentPostRelationshipFilters {
              \\"\\"\\"Return Comments where all of the related Posts match this filter\\"\\"\\"
              all: PostWhere
              \\"\\"\\"Return Comments where none of the related Posts match this filter\\"\\"\\"
              none: PostWhere
              \\"\\"\\"Return Comments where one of the related Posts match this filter\\"\\"\\"
              single: PostWhere
              \\"\\"\\"Return Comments where some of the related Posts match this filter\\"\\"\\"
              some: PostWhere
            }

            input CommentPostUpdateConnectionInput {
              node: PostUpdateInput
            }

            input CommentPostUpdateFieldInput {
              connect: [CommentPostConnectFieldInput!]
              create: [CommentPostCreateFieldInput!]
              delete: [CommentPostDeleteFieldInput!]
              disconnect: [CommentPostDisconnectFieldInput!]
              update: CommentPostUpdateConnectionInput
              where: CommentPostConnectionWhere
            }

            \\"\\"\\"
            Fields to sort Comments by. The order in which sorts are applied is not guaranteed when specifying many fields in one CommentSort object.
            \\"\\"\\"
            input CommentSort {
              content: SortDirection
              id: SortDirection
            }

            input CommentUpdateInput {
              content_SET: String
              creator: [CommentCreatorUpdateFieldInput!]
              id_SET: ID
              post: [CommentPostUpdateFieldInput!]
            }

            type CommentUserCreatorAggregationSelection {
              count: Int!
              node: CommentUserCreatorNodeAggregateSelection
            }

            type CommentUserCreatorNodeAggregateSelection {
              id: IDAggregateSelection!
              name: StringAggregateSelection!
            }

            input CommentWhere {
              AND: [CommentWhere!]
              NOT: CommentWhere
              OR: [CommentWhere!]
              content: StringScalarFilters
              content_CONTAINS: String
              content_ENDS_WITH: String
              content_EQ: String
              content_IN: [String]
              content_STARTS_WITH: String
              creator: CommentCreatorRelationshipFilters
              creatorAggregate: CommentCreatorAggregateInput
              creatorConnection: CommentCreatorConnectionFilters
              \\"\\"\\"
              Return Comments where all of the related ContentCreatorConnections match this filter
              \\"\\"\\"
              creatorConnection_ALL: ContentCreatorConnectionWhere
              \\"\\"\\"
              Return Comments where none of the related ContentCreatorConnections match this filter
              \\"\\"\\"
              creatorConnection_NONE: ContentCreatorConnectionWhere
              \\"\\"\\"
              Return Comments where one of the related ContentCreatorConnections match this filter
              \\"\\"\\"
              creatorConnection_SINGLE: ContentCreatorConnectionWhere
              \\"\\"\\"
              Return Comments where some of the related ContentCreatorConnections match this filter
              \\"\\"\\"
              creatorConnection_SOME: ContentCreatorConnectionWhere
              \\"\\"\\"Return Comments where all of the related Users match this filter\\"\\"\\"
              creator_ALL: UserWhere
              \\"\\"\\"Return Comments where none of the related Users match this filter\\"\\"\\"
              creator_NONE: UserWhere
              \\"\\"\\"Return Comments where one of the related Users match this filter\\"\\"\\"
              creator_SINGLE: UserWhere
              \\"\\"\\"Return Comments where some of the related Users match this filter\\"\\"\\"
              creator_SOME: UserWhere
              id: IDScalarFilters
              id_CONTAINS: ID
              id_ENDS_WITH: ID
              id_EQ: ID
              id_IN: [ID]
              id_STARTS_WITH: ID
              post: CommentPostRelationshipFilters
              postAggregate: CommentPostAggregateInput
              postConnection: CommentPostConnectionFilters
              \\"\\"\\"
              Return Comments where all of the related CommentPostConnections match this filter
              \\"\\"\\"
              postConnection_ALL: CommentPostConnectionWhere
              \\"\\"\\"
              Return Comments where none of the related CommentPostConnections match this filter
              \\"\\"\\"
              postConnection_NONE: CommentPostConnectionWhere
              \\"\\"\\"
              Return Comments where one of the related CommentPostConnections match this filter
              \\"\\"\\"
              postConnection_SINGLE: CommentPostConnectionWhere
              \\"\\"\\"
              Return Comments where some of the related CommentPostConnections match this filter
              \\"\\"\\"
              postConnection_SOME: CommentPostConnectionWhere
              \\"\\"\\"Return Comments where all of the related Posts match this filter\\"\\"\\"
              post_ALL: PostWhere
              \\"\\"\\"Return Comments where none of the related Posts match this filter\\"\\"\\"
              post_NONE: PostWhere
              \\"\\"\\"Return Comments where one of the related Posts match this filter\\"\\"\\"
              post_SINGLE: PostWhere
              \\"\\"\\"Return Comments where some of the related Posts match this filter\\"\\"\\"
              post_SOME: PostWhere
            }

            type CommentsConnection {
              edges: [CommentEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            interface Content {
              content: String
              creator(limit: Int, offset: Int, sort: [UserSort!], where: UserWhere): [User!]!
              creatorConnection(after: String, first: Int, sort: [ContentCreatorConnectionSort!], where: ContentCreatorConnectionWhere): ContentCreatorConnection!
              id: ID
            }

            type ContentAggregateSelection {
              content: StringAggregateSelection!
              count: Int!
              id: IDAggregateSelection!
            }

            input ContentConnectInput {
              creator: [ContentCreatorConnectFieldInput!]
            }

            input ContentConnectWhere {
              node: ContentWhere!
            }

            input ContentCreateInput {
              Comment: CommentCreateInput
              Post: PostCreateInput
            }

            input ContentCreatorAggregateInput {
              AND: [ContentCreatorAggregateInput!]
              NOT: ContentCreatorAggregateInput
              OR: [ContentCreatorAggregateInput!]
              count_EQ: Int
              count_GT: Int
              count_GTE: Int
              count_LT: Int
              count_LTE: Int
              node: ContentCreatorNodeAggregationWhereInput
            }

            input ContentCreatorConnectFieldInput {
              connect: [UserConnectInput!]
              where: UserConnectWhere
            }

            type ContentCreatorConnection {
              edges: [ContentCreatorRelationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input ContentCreatorConnectionFilters {
              \\"\\"\\"
              Return Contents where all of the related ContentCreatorConnections match this filter
              \\"\\"\\"
              all: ContentCreatorConnectionWhere
              \\"\\"\\"
              Return Contents where none of the related ContentCreatorConnections match this filter
              \\"\\"\\"
              none: ContentCreatorConnectionWhere
              \\"\\"\\"
              Return Contents where one of the related ContentCreatorConnections match this filter
              \\"\\"\\"
              single: ContentCreatorConnectionWhere
              \\"\\"\\"
              Return Contents where some of the related ContentCreatorConnections match this filter
              \\"\\"\\"
              some: ContentCreatorConnectionWhere
            }

            input ContentCreatorConnectionSort {
              node: UserSort
            }

            input ContentCreatorConnectionWhere {
              AND: [ContentCreatorConnectionWhere!]
              NOT: ContentCreatorConnectionWhere
              OR: [ContentCreatorConnectionWhere!]
              node: UserWhere
            }

            input ContentCreatorCreateFieldInput {
              node: UserCreateInput!
            }

            input ContentCreatorDeleteFieldInput {
              delete: UserDeleteInput
              where: ContentCreatorConnectionWhere
            }

            input ContentCreatorDisconnectFieldInput {
              disconnect: UserDisconnectInput
              where: ContentCreatorConnectionWhere
            }

            input ContentCreatorNodeAggregationWhereInput {
              AND: [ContentCreatorNodeAggregationWhereInput!]
              NOT: ContentCreatorNodeAggregationWhereInput
              OR: [ContentCreatorNodeAggregationWhereInput!]
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
              name_AVERAGE_LENGTH_EQUAL: Float
              name_AVERAGE_LENGTH_GT: Float
              name_AVERAGE_LENGTH_GTE: Float
              name_AVERAGE_LENGTH_LT: Float
              name_AVERAGE_LENGTH_LTE: Float
              name_LONGEST_LENGTH_EQUAL: Int
              name_LONGEST_LENGTH_GT: Int
              name_LONGEST_LENGTH_GTE: Int
              name_LONGEST_LENGTH_LT: Int
              name_LONGEST_LENGTH_LTE: Int
              name_SHORTEST_LENGTH_EQUAL: Int
              name_SHORTEST_LENGTH_GT: Int
              name_SHORTEST_LENGTH_GTE: Int
              name_SHORTEST_LENGTH_LT: Int
              name_SHORTEST_LENGTH_LTE: Int
            }

            type ContentCreatorRelationship {
              cursor: String!
              node: User!
            }

            input ContentCreatorRelationshipFilters {
              \\"\\"\\"Return Contents where all of the related Users match this filter\\"\\"\\"
              all: UserWhere
              \\"\\"\\"Return Contents where none of the related Users match this filter\\"\\"\\"
              none: UserWhere
              \\"\\"\\"Return Contents where one of the related Users match this filter\\"\\"\\"
              single: UserWhere
              \\"\\"\\"Return Contents where some of the related Users match this filter\\"\\"\\"
              some: UserWhere
            }

            input ContentCreatorUpdateConnectionInput {
              node: UserUpdateInput
            }

            input ContentCreatorUpdateFieldInput {
              connect: [ContentCreatorConnectFieldInput!]
              create: [ContentCreatorCreateFieldInput!]
              delete: [ContentCreatorDeleteFieldInput!]
              disconnect: [ContentCreatorDisconnectFieldInput!]
              update: ContentCreatorUpdateConnectionInput
              where: ContentCreatorConnectionWhere
            }

            input ContentDeleteInput {
              creator: [ContentCreatorDeleteFieldInput!]
            }

            input ContentDisconnectInput {
              creator: [ContentCreatorDisconnectFieldInput!]
            }

            type ContentEdge {
              cursor: String!
              node: Content!
            }

            enum ContentImplementation {
              Comment
              Post
            }

            \\"\\"\\"
            Fields to sort Contents by. The order in which sorts are applied is not guaranteed when specifying many fields in one ContentSort object.
            \\"\\"\\"
            input ContentSort {
              content: SortDirection
              id: SortDirection
            }

            input ContentUpdateInput {
              content_SET: String
              creator: [ContentCreatorUpdateFieldInput!]
              id_SET: ID
            }

            input ContentWhere {
              AND: [ContentWhere!]
              NOT: ContentWhere
              OR: [ContentWhere!]
              content: StringScalarFilters
              content_CONTAINS: String
              content_ENDS_WITH: String
              content_EQ: String
              content_IN: [String]
              content_STARTS_WITH: String
              creator: ContentCreatorRelationshipFilters
              creatorAggregate: ContentCreatorAggregateInput
              creatorConnection: ContentCreatorConnectionFilters
              \\"\\"\\"
              Return Contents where all of the related ContentCreatorConnections match this filter
              \\"\\"\\"
              creatorConnection_ALL: ContentCreatorConnectionWhere
              \\"\\"\\"
              Return Contents where none of the related ContentCreatorConnections match this filter
              \\"\\"\\"
              creatorConnection_NONE: ContentCreatorConnectionWhere
              \\"\\"\\"
              Return Contents where one of the related ContentCreatorConnections match this filter
              \\"\\"\\"
              creatorConnection_SINGLE: ContentCreatorConnectionWhere
              \\"\\"\\"
              Return Contents where some of the related ContentCreatorConnections match this filter
              \\"\\"\\"
              creatorConnection_SOME: ContentCreatorConnectionWhere
              \\"\\"\\"Return Contents where all of the related Users match this filter\\"\\"\\"
              creator_ALL: UserWhere
              \\"\\"\\"Return Contents where none of the related Users match this filter\\"\\"\\"
              creator_NONE: UserWhere
              \\"\\"\\"Return Contents where one of the related Users match this filter\\"\\"\\"
              creator_SINGLE: UserWhere
              \\"\\"\\"Return Contents where some of the related Users match this filter\\"\\"\\"
              creator_SOME: UserWhere
              id: IDScalarFilters
              id_CONTAINS: ID
              id_ENDS_WITH: ID
              id_EQ: ID
              id_IN: [ID]
              id_STARTS_WITH: ID
              typename_IN: [ContentImplementation!]
            }

            type ContentsConnection {
              edges: [ContentEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            type CreateCommentsMutationResponse {
              comments: [Comment!]!
              info: CreateInfo!
            }

            \\"\\"\\"
            Information about the number of nodes and relationships created during a create mutation
            \\"\\"\\"
            type CreateInfo {
              nodesCreated: Int!
              relationshipsCreated: Int!
            }

            type CreatePostsMutationResponse {
              info: CreateInfo!
              posts: [Post!]!
            }

            type CreateUsersMutationResponse {
              info: CreateInfo!
              users: [User!]!
            }

            \\"\\"\\"
            Information about the number of nodes and relationships deleted during a delete mutation
            \\"\\"\\"
            type DeleteInfo {
              nodesDeleted: Int!
              relationshipsDeleted: Int!
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

            type Mutation {
              createComments(input: [CommentCreateInput!]!): CreateCommentsMutationResponse!
              createPosts(input: [PostCreateInput!]!): CreatePostsMutationResponse!
              createUsers(input: [UserCreateInput!]!): CreateUsersMutationResponse!
              deleteComments(delete: CommentDeleteInput, where: CommentWhere): DeleteInfo!
              deletePosts(delete: PostDeleteInput, where: PostWhere): DeleteInfo!
              deleteUsers(delete: UserDeleteInput, where: UserWhere): DeleteInfo!
              updateComments(update: CommentUpdateInput, where: CommentWhere): UpdateCommentsMutationResponse!
              updatePosts(update: PostUpdateInput, where: PostWhere): UpdatePostsMutationResponse!
              updateUsers(update: UserUpdateInput, where: UserWhere): UpdateUsersMutationResponse!
            }

            \\"\\"\\"Pagination information (Relay)\\"\\"\\"
            type PageInfo {
              endCursor: String
              hasNextPage: Boolean!
              hasPreviousPage: Boolean!
              startCursor: String
            }

            type Post implements Content {
              comments(limit: Int, offset: Int, sort: [CommentSort!], where: CommentWhere): [Comment!]!
              commentsAggregate(where: CommentWhere): PostCommentCommentsAggregationSelection
              commentsConnection(after: String, first: Int, sort: [PostCommentsConnectionSort!], where: PostCommentsConnectionWhere): PostCommentsConnection!
              content: String
              creator(limit: Int, offset: Int, sort: [UserSort!], where: UserWhere): [User!]!
              creatorAggregate(where: UserWhere): PostUserCreatorAggregationSelection
              creatorConnection(after: String, first: Int, sort: [ContentCreatorConnectionSort!], where: ContentCreatorConnectionWhere): ContentCreatorConnection!
              id: ID
            }

            type PostAggregateSelection {
              content: StringAggregateSelection!
              count: Int!
              id: IDAggregateSelection!
            }

            type PostCommentCommentsAggregationSelection {
              count: Int!
              node: PostCommentCommentsNodeAggregateSelection
            }

            type PostCommentCommentsNodeAggregateSelection {
              content: StringAggregateSelection!
              id: IDAggregateSelection!
            }

            input PostCommentsAggregateInput {
              AND: [PostCommentsAggregateInput!]
              NOT: PostCommentsAggregateInput
              OR: [PostCommentsAggregateInput!]
              count_EQ: Int
              count_GT: Int
              count_GTE: Int
              count_LT: Int
              count_LTE: Int
              node: PostCommentsNodeAggregationWhereInput
            }

            input PostCommentsConnectFieldInput {
              connect: [CommentConnectInput!]
              where: CommentConnectWhere
            }

            type PostCommentsConnection {
              edges: [PostCommentsRelationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input PostCommentsConnectionFilters {
              \\"\\"\\"
              Return Posts where all of the related PostCommentsConnections match this filter
              \\"\\"\\"
              all: PostCommentsConnectionWhere
              \\"\\"\\"
              Return Posts where none of the related PostCommentsConnections match this filter
              \\"\\"\\"
              none: PostCommentsConnectionWhere
              \\"\\"\\"
              Return Posts where one of the related PostCommentsConnections match this filter
              \\"\\"\\"
              single: PostCommentsConnectionWhere
              \\"\\"\\"
              Return Posts where some of the related PostCommentsConnections match this filter
              \\"\\"\\"
              some: PostCommentsConnectionWhere
            }

            input PostCommentsConnectionSort {
              node: CommentSort
            }

            input PostCommentsConnectionWhere {
              AND: [PostCommentsConnectionWhere!]
              NOT: PostCommentsConnectionWhere
              OR: [PostCommentsConnectionWhere!]
              node: CommentWhere
            }

            input PostCommentsCreateFieldInput {
              node: CommentCreateInput!
            }

            input PostCommentsDeleteFieldInput {
              delete: CommentDeleteInput
              where: PostCommentsConnectionWhere
            }

            input PostCommentsDisconnectFieldInput {
              disconnect: CommentDisconnectInput
              where: PostCommentsConnectionWhere
            }

            input PostCommentsFieldInput {
              connect: [PostCommentsConnectFieldInput!]
              create: [PostCommentsCreateFieldInput!]
            }

            input PostCommentsNodeAggregationWhereInput {
              AND: [PostCommentsNodeAggregationWhereInput!]
              NOT: PostCommentsNodeAggregationWhereInput
              OR: [PostCommentsNodeAggregationWhereInput!]
              content_AVERAGE_LENGTH_EQUAL: Float
              content_AVERAGE_LENGTH_GT: Float
              content_AVERAGE_LENGTH_GTE: Float
              content_AVERAGE_LENGTH_LT: Float
              content_AVERAGE_LENGTH_LTE: Float
              content_LONGEST_LENGTH_EQUAL: Int
              content_LONGEST_LENGTH_GT: Int
              content_LONGEST_LENGTH_GTE: Int
              content_LONGEST_LENGTH_LT: Int
              content_LONGEST_LENGTH_LTE: Int
              content_SHORTEST_LENGTH_EQUAL: Int
              content_SHORTEST_LENGTH_GT: Int
              content_SHORTEST_LENGTH_GTE: Int
              content_SHORTEST_LENGTH_LT: Int
              content_SHORTEST_LENGTH_LTE: Int
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

            type PostCommentsRelationship {
              cursor: String!
              node: Comment!
            }

            input PostCommentsRelationshipFilters {
              \\"\\"\\"Return Posts where all of the related Comments match this filter\\"\\"\\"
              all: CommentWhere
              \\"\\"\\"Return Posts where none of the related Comments match this filter\\"\\"\\"
              none: CommentWhere
              \\"\\"\\"Return Posts where one of the related Comments match this filter\\"\\"\\"
              single: CommentWhere
              \\"\\"\\"Return Posts where some of the related Comments match this filter\\"\\"\\"
              some: CommentWhere
            }

            input PostCommentsUpdateConnectionInput {
              node: CommentUpdateInput
            }

            input PostCommentsUpdateFieldInput {
              connect: [PostCommentsConnectFieldInput!]
              create: [PostCommentsCreateFieldInput!]
              delete: [PostCommentsDeleteFieldInput!]
              disconnect: [PostCommentsDisconnectFieldInput!]
              update: PostCommentsUpdateConnectionInput
              where: PostCommentsConnectionWhere
            }

            input PostConnectInput {
              comments: [PostCommentsConnectFieldInput!]
              creator: [PostCreatorConnectFieldInput!]
            }

            input PostConnectWhere {
              node: PostWhere!
            }

            input PostCreateInput {
              comments: PostCommentsFieldInput
              content: String
              creator: PostCreatorFieldInput
              id: ID
            }

            input PostCreatorAggregateInput {
              AND: [PostCreatorAggregateInput!]
              NOT: PostCreatorAggregateInput
              OR: [PostCreatorAggregateInput!]
              count_EQ: Int
              count_GT: Int
              count_GTE: Int
              count_LT: Int
              count_LTE: Int
              node: PostCreatorNodeAggregationWhereInput
            }

            input PostCreatorConnectFieldInput {
              connect: [UserConnectInput!]
              where: UserConnectWhere
            }

            input PostCreatorConnectionFilters {
              \\"\\"\\"
              Return Posts where all of the related ContentCreatorConnections match this filter
              \\"\\"\\"
              all: ContentCreatorConnectionWhere
              \\"\\"\\"
              Return Posts where none of the related ContentCreatorConnections match this filter
              \\"\\"\\"
              none: ContentCreatorConnectionWhere
              \\"\\"\\"
              Return Posts where one of the related ContentCreatorConnections match this filter
              \\"\\"\\"
              single: ContentCreatorConnectionWhere
              \\"\\"\\"
              Return Posts where some of the related ContentCreatorConnections match this filter
              \\"\\"\\"
              some: ContentCreatorConnectionWhere
            }

            input PostCreatorCreateFieldInput {
              node: UserCreateInput!
            }

            input PostCreatorFieldInput {
              connect: [PostCreatorConnectFieldInput!]
              create: [PostCreatorCreateFieldInput!]
            }

            input PostCreatorNodeAggregationWhereInput {
              AND: [PostCreatorNodeAggregationWhereInput!]
              NOT: PostCreatorNodeAggregationWhereInput
              OR: [PostCreatorNodeAggregationWhereInput!]
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
              name_AVERAGE_LENGTH_EQUAL: Float
              name_AVERAGE_LENGTH_GT: Float
              name_AVERAGE_LENGTH_GTE: Float
              name_AVERAGE_LENGTH_LT: Float
              name_AVERAGE_LENGTH_LTE: Float
              name_LONGEST_LENGTH_EQUAL: Int
              name_LONGEST_LENGTH_GT: Int
              name_LONGEST_LENGTH_GTE: Int
              name_LONGEST_LENGTH_LT: Int
              name_LONGEST_LENGTH_LTE: Int
              name_SHORTEST_LENGTH_EQUAL: Int
              name_SHORTEST_LENGTH_GT: Int
              name_SHORTEST_LENGTH_GTE: Int
              name_SHORTEST_LENGTH_LT: Int
              name_SHORTEST_LENGTH_LTE: Int
            }

            input PostCreatorRelationshipFilters {
              \\"\\"\\"Return Posts where all of the related Users match this filter\\"\\"\\"
              all: UserWhere
              \\"\\"\\"Return Posts where none of the related Users match this filter\\"\\"\\"
              none: UserWhere
              \\"\\"\\"Return Posts where one of the related Users match this filter\\"\\"\\"
              single: UserWhere
              \\"\\"\\"Return Posts where some of the related Users match this filter\\"\\"\\"
              some: UserWhere
            }

            input PostCreatorUpdateConnectionInput {
              node: UserUpdateInput
            }

            input PostCreatorUpdateFieldInput {
              connect: [PostCreatorConnectFieldInput!]
              create: [PostCreatorCreateFieldInput!]
              delete: [ContentCreatorDeleteFieldInput!]
              disconnect: [ContentCreatorDisconnectFieldInput!]
              update: PostCreatorUpdateConnectionInput
              where: ContentCreatorConnectionWhere
            }

            input PostDeleteInput {
              comments: [PostCommentsDeleteFieldInput!]
              creator: [ContentCreatorDeleteFieldInput!]
            }

            input PostDisconnectInput {
              comments: [PostCommentsDisconnectFieldInput!]
              creator: [ContentCreatorDisconnectFieldInput!]
            }

            type PostEdge {
              cursor: String!
              node: Post!
            }

            \\"\\"\\"
            Fields to sort Posts by. The order in which sorts are applied is not guaranteed when specifying many fields in one PostSort object.
            \\"\\"\\"
            input PostSort {
              content: SortDirection
              id: SortDirection
            }

            input PostUpdateInput {
              comments: [PostCommentsUpdateFieldInput!]
              content_SET: String
              creator: [PostCreatorUpdateFieldInput!]
              id_SET: ID
            }

            type PostUserCreatorAggregationSelection {
              count: Int!
              node: PostUserCreatorNodeAggregateSelection
            }

            type PostUserCreatorNodeAggregateSelection {
              id: IDAggregateSelection!
              name: StringAggregateSelection!
            }

            input PostWhere {
              AND: [PostWhere!]
              NOT: PostWhere
              OR: [PostWhere!]
              comments: PostCommentsRelationshipFilters
              commentsAggregate: PostCommentsAggregateInput
              commentsConnection: PostCommentsConnectionFilters
              \\"\\"\\"
              Return Posts where all of the related PostCommentsConnections match this filter
              \\"\\"\\"
              commentsConnection_ALL: PostCommentsConnectionWhere
              \\"\\"\\"
              Return Posts where none of the related PostCommentsConnections match this filter
              \\"\\"\\"
              commentsConnection_NONE: PostCommentsConnectionWhere
              \\"\\"\\"
              Return Posts where one of the related PostCommentsConnections match this filter
              \\"\\"\\"
              commentsConnection_SINGLE: PostCommentsConnectionWhere
              \\"\\"\\"
              Return Posts where some of the related PostCommentsConnections match this filter
              \\"\\"\\"
              commentsConnection_SOME: PostCommentsConnectionWhere
              \\"\\"\\"Return Posts where all of the related Comments match this filter\\"\\"\\"
              comments_ALL: CommentWhere
              \\"\\"\\"Return Posts where none of the related Comments match this filter\\"\\"\\"
              comments_NONE: CommentWhere
              \\"\\"\\"Return Posts where one of the related Comments match this filter\\"\\"\\"
              comments_SINGLE: CommentWhere
              \\"\\"\\"Return Posts where some of the related Comments match this filter\\"\\"\\"
              comments_SOME: CommentWhere
              content: StringScalarFilters
              content_CONTAINS: String
              content_ENDS_WITH: String
              content_EQ: String
              content_IN: [String]
              content_STARTS_WITH: String
              creator: PostCreatorRelationshipFilters
              creatorAggregate: PostCreatorAggregateInput
              creatorConnection: PostCreatorConnectionFilters
              \\"\\"\\"
              Return Posts where all of the related ContentCreatorConnections match this filter
              \\"\\"\\"
              creatorConnection_ALL: ContentCreatorConnectionWhere
              \\"\\"\\"
              Return Posts where none of the related ContentCreatorConnections match this filter
              \\"\\"\\"
              creatorConnection_NONE: ContentCreatorConnectionWhere
              \\"\\"\\"
              Return Posts where one of the related ContentCreatorConnections match this filter
              \\"\\"\\"
              creatorConnection_SINGLE: ContentCreatorConnectionWhere
              \\"\\"\\"
              Return Posts where some of the related ContentCreatorConnections match this filter
              \\"\\"\\"
              creatorConnection_SOME: ContentCreatorConnectionWhere
              \\"\\"\\"Return Posts where all of the related Users match this filter\\"\\"\\"
              creator_ALL: UserWhere
              \\"\\"\\"Return Posts where none of the related Users match this filter\\"\\"\\"
              creator_NONE: UserWhere
              \\"\\"\\"Return Posts where one of the related Users match this filter\\"\\"\\"
              creator_SINGLE: UserWhere
              \\"\\"\\"Return Posts where some of the related Users match this filter\\"\\"\\"
              creator_SOME: UserWhere
              id: IDScalarFilters
              id_CONTAINS: ID
              id_ENDS_WITH: ID
              id_EQ: ID
              id_IN: [ID]
              id_STARTS_WITH: ID
            }

            type PostsConnection {
              edges: [PostEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            type Query {
              comments(limit: Int, offset: Int, sort: [CommentSort!], where: CommentWhere): [Comment!]!
              commentsAggregate(where: CommentWhere): CommentAggregateSelection!
              commentsConnection(after: String, first: Int, sort: [CommentSort!], where: CommentWhere): CommentsConnection!
              contents(limit: Int, offset: Int, sort: [ContentSort!], where: ContentWhere): [Content!]!
              contentsAggregate(where: ContentWhere): ContentAggregateSelection!
              contentsConnection(after: String, first: Int, sort: [ContentSort!], where: ContentWhere): ContentsConnection!
              posts(limit: Int, offset: Int, sort: [PostSort!], where: PostWhere): [Post!]!
              postsAggregate(where: PostWhere): PostAggregateSelection!
              postsConnection(after: String, first: Int, sort: [PostSort!], where: PostWhere): PostsConnection!
              users(limit: Int, offset: Int, sort: [UserSort!], where: UserWhere): [User!]!
              usersAggregate(where: UserWhere): UserAggregateSelection!
              usersConnection(after: String, first: Int, sort: [UserSort!], where: UserWhere): UsersConnection!
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

            type UpdateCommentsMutationResponse {
              comments: [Comment!]!
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

            type UpdatePostsMutationResponse {
              info: UpdateInfo!
              posts: [Post!]!
            }

            type UpdateUsersMutationResponse {
              info: UpdateInfo!
              users: [User!]!
            }

            type User {
              content(limit: Int, offset: Int, sort: [ContentSort!], where: ContentWhere): [Content!]!
              contentAggregate(where: ContentWhere): UserContentContentAggregationSelection
              contentConnection(after: String, first: Int, sort: [UserContentConnectionSort!], where: UserContentConnectionWhere): UserContentConnection!
              id: ID
              name: String
            }

            type UserAggregateSelection {
              count: Int!
              id: IDAggregateSelection!
              name: StringAggregateSelection!
            }

            input UserConnectInput {
              content: [UserContentConnectFieldInput!]
            }

            input UserConnectWhere {
              node: UserWhere!
            }

            input UserContentAggregateInput {
              AND: [UserContentAggregateInput!]
              NOT: UserContentAggregateInput
              OR: [UserContentAggregateInput!]
              count_EQ: Int
              count_GT: Int
              count_GTE: Int
              count_LT: Int
              count_LTE: Int
              node: UserContentNodeAggregationWhereInput
            }

            input UserContentConnectFieldInput {
              connect: ContentConnectInput
              where: ContentConnectWhere
            }

            type UserContentConnection {
              edges: [UserContentRelationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input UserContentConnectionFilters {
              \\"\\"\\"
              Return Users where all of the related UserContentConnections match this filter
              \\"\\"\\"
              all: UserContentConnectionWhere
              \\"\\"\\"
              Return Users where none of the related UserContentConnections match this filter
              \\"\\"\\"
              none: UserContentConnectionWhere
              \\"\\"\\"
              Return Users where one of the related UserContentConnections match this filter
              \\"\\"\\"
              single: UserContentConnectionWhere
              \\"\\"\\"
              Return Users where some of the related UserContentConnections match this filter
              \\"\\"\\"
              some: UserContentConnectionWhere
            }

            input UserContentConnectionSort {
              node: ContentSort
            }

            input UserContentConnectionWhere {
              AND: [UserContentConnectionWhere!]
              NOT: UserContentConnectionWhere
              OR: [UserContentConnectionWhere!]
              node: ContentWhere
            }

            type UserContentContentAggregationSelection {
              count: Int!
              node: UserContentContentNodeAggregateSelection
            }

            type UserContentContentNodeAggregateSelection {
              content: StringAggregateSelection!
              id: IDAggregateSelection!
            }

            input UserContentCreateFieldInput {
              node: ContentCreateInput!
            }

            input UserContentDeleteFieldInput {
              delete: ContentDeleteInput
              where: UserContentConnectionWhere
            }

            input UserContentDisconnectFieldInput {
              disconnect: ContentDisconnectInput
              where: UserContentConnectionWhere
            }

            input UserContentFieldInput {
              connect: [UserContentConnectFieldInput!]
              create: [UserContentCreateFieldInput!]
            }

            input UserContentNodeAggregationWhereInput {
              AND: [UserContentNodeAggregationWhereInput!]
              NOT: UserContentNodeAggregationWhereInput
              OR: [UserContentNodeAggregationWhereInput!]
              content_AVERAGE_LENGTH_EQUAL: Float
              content_AVERAGE_LENGTH_GT: Float
              content_AVERAGE_LENGTH_GTE: Float
              content_AVERAGE_LENGTH_LT: Float
              content_AVERAGE_LENGTH_LTE: Float
              content_LONGEST_LENGTH_EQUAL: Int
              content_LONGEST_LENGTH_GT: Int
              content_LONGEST_LENGTH_GTE: Int
              content_LONGEST_LENGTH_LT: Int
              content_LONGEST_LENGTH_LTE: Int
              content_SHORTEST_LENGTH_EQUAL: Int
              content_SHORTEST_LENGTH_GT: Int
              content_SHORTEST_LENGTH_GTE: Int
              content_SHORTEST_LENGTH_LT: Int
              content_SHORTEST_LENGTH_LTE: Int
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

            type UserContentRelationship {
              cursor: String!
              node: Content!
            }

            input UserContentRelationshipFilters {
              \\"\\"\\"Return Users where all of the related Contents match this filter\\"\\"\\"
              all: ContentWhere
              \\"\\"\\"Return Users where none of the related Contents match this filter\\"\\"\\"
              none: ContentWhere
              \\"\\"\\"Return Users where one of the related Contents match this filter\\"\\"\\"
              single: ContentWhere
              \\"\\"\\"Return Users where some of the related Contents match this filter\\"\\"\\"
              some: ContentWhere
            }

            input UserContentUpdateConnectionInput {
              node: ContentUpdateInput
            }

            input UserContentUpdateFieldInput {
              connect: [UserContentConnectFieldInput!]
              create: [UserContentCreateFieldInput!]
              delete: [UserContentDeleteFieldInput!]
              disconnect: [UserContentDisconnectFieldInput!]
              update: UserContentUpdateConnectionInput
              where: UserContentConnectionWhere
            }

            input UserCreateInput {
              content: UserContentFieldInput
              id: ID
              name: String
            }

            input UserDeleteInput {
              content: [UserContentDeleteFieldInput!]
            }

            input UserDisconnectInput {
              content: [UserContentDisconnectFieldInput!]
            }

            type UserEdge {
              cursor: String!
              node: User!
            }

            \\"\\"\\"
            Fields to sort Users by. The order in which sorts are applied is not guaranteed when specifying many fields in one UserSort object.
            \\"\\"\\"
            input UserSort {
              id: SortDirection
              name: SortDirection
            }

            input UserUpdateInput {
              content: [UserContentUpdateFieldInput!]
              id_SET: ID
              name_SET: String
            }

            input UserWhere {
              AND: [UserWhere!]
              NOT: UserWhere
              OR: [UserWhere!]
              content: UserContentRelationshipFilters
              contentAggregate: UserContentAggregateInput
              contentConnection: UserContentConnectionFilters
              \\"\\"\\"
              Return Users where all of the related UserContentConnections match this filter
              \\"\\"\\"
              contentConnection_ALL: UserContentConnectionWhere
              \\"\\"\\"
              Return Users where none of the related UserContentConnections match this filter
              \\"\\"\\"
              contentConnection_NONE: UserContentConnectionWhere
              \\"\\"\\"
              Return Users where one of the related UserContentConnections match this filter
              \\"\\"\\"
              contentConnection_SINGLE: UserContentConnectionWhere
              \\"\\"\\"
              Return Users where some of the related UserContentConnections match this filter
              \\"\\"\\"
              contentConnection_SOME: UserContentConnectionWhere
              \\"\\"\\"Return Users where all of the related Contents match this filter\\"\\"\\"
              content_ALL: ContentWhere
              \\"\\"\\"Return Users where none of the related Contents match this filter\\"\\"\\"
              content_NONE: ContentWhere
              \\"\\"\\"Return Users where one of the related Contents match this filter\\"\\"\\"
              content_SINGLE: ContentWhere
              \\"\\"\\"Return Users where some of the related Contents match this filter\\"\\"\\"
              content_SOME: ContentWhere
              id: IDScalarFilters
              id_CONTAINS: ID
              id_ENDS_WITH: ID
              id_EQ: ID
              id_IN: [ID]
              id_STARTS_WITH: ID
              name: StringScalarFilters
              name_CONTAINS: String
              name_ENDS_WITH: String
              name_EQ: String
              name_IN: [String]
              name_STARTS_WITH: String
            }

            type UsersConnection {
              edges: [UserEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }"
        `);
    });

    test("Interface Relationships - interface implementing interface", async () => {
        const typeDefs = gql`
            interface Show {
                title: String!
                actors: [Actor!]! @declareRelationship
            }

            interface Production implements Show {
                title: String!
                actors: [Actor!]!
            }

            type Movie implements Production & Show @node {
                title: String!
                runtime: Int!
                actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN, properties: "ActedIn")
            }

            type Series implements Production & Show @node {
                title: String!
                episodeCount: Int!
                actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN, properties: "StarredIn")
            }

            type ActedIn @relationshipProperties {
                screenTime: Int!
            }

            type StarredIn @relationshipProperties {
                episodeNr: Int!
            }

            type Actor @node {
                name: String!
                actedIn: [Show!]! @relationship(type: "ACTED_IN", direction: OUT, properties: "ActedIn")
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
            The edge properties for the following fields:
            * Movie.actors
            * Actor.actedIn
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

            input ActedInUpdateInput {
              screenTime_DECREMENT: Int
              screenTime_INCREMENT: Int
              screenTime_SET: Int
            }

            input ActedInWhere {
              AND: [ActedInWhere!]
              NOT: ActedInWhere
              OR: [ActedInWhere!]
              screenTime: IntScalarFilters
              screenTime_EQ: Int
              screenTime_GT: Int
              screenTime_GTE: Int
              screenTime_IN: [Int!]
              screenTime_LT: Int
              screenTime_LTE: Int
            }

            type Actor {
              actedIn(limit: Int, offset: Int, sort: [ShowSort!], where: ShowWhere): [Show!]!
              actedInAggregate(where: ShowWhere): ActorShowActedInAggregationSelection
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
              edge: ActedInAggregationWhereInput
              node: ActorActedInNodeAggregationWhereInput
            }

            input ActorActedInConnectFieldInput {
              connect: ShowConnectInput
              edge: ActedInCreateInput!
              where: ShowConnectWhere
            }

            type ActorActedInConnection {
              edges: [ActorActedInRelationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input ActorActedInConnectionFilters {
              \\"\\"\\"
              Return Actors where all of the related ActorActedInConnections match this filter
              \\"\\"\\"
              all: ActorActedInConnectionWhere
              \\"\\"\\"
              Return Actors where none of the related ActorActedInConnections match this filter
              \\"\\"\\"
              none: ActorActedInConnectionWhere
              \\"\\"\\"
              Return Actors where one of the related ActorActedInConnections match this filter
              \\"\\"\\"
              single: ActorActedInConnectionWhere
              \\"\\"\\"
              Return Actors where some of the related ActorActedInConnections match this filter
              \\"\\"\\"
              some: ActorActedInConnectionWhere
            }

            input ActorActedInConnectionSort {
              edge: ActedInSort
              node: ShowSort
            }

            input ActorActedInConnectionWhere {
              AND: [ActorActedInConnectionWhere!]
              NOT: ActorActedInConnectionWhere
              OR: [ActorActedInConnectionWhere!]
              edge: ActedInWhere
              node: ShowWhere
            }

            input ActorActedInCreateFieldInput {
              edge: ActedInCreateInput!
              node: ShowCreateInput!
            }

            input ActorActedInDeleteFieldInput {
              delete: ShowDeleteInput
              where: ActorActedInConnectionWhere
            }

            input ActorActedInDisconnectFieldInput {
              disconnect: ShowDisconnectInput
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
              node: Show!
              properties: ActedIn!
            }

            input ActorActedInRelationshipFilters {
              \\"\\"\\"Return Actors where all of the related Shows match this filter\\"\\"\\"
              all: ShowWhere
              \\"\\"\\"Return Actors where none of the related Shows match this filter\\"\\"\\"
              none: ShowWhere
              \\"\\"\\"Return Actors where one of the related Shows match this filter\\"\\"\\"
              single: ShowWhere
              \\"\\"\\"Return Actors where some of the related Shows match this filter\\"\\"\\"
              some: ShowWhere
            }

            input ActorActedInUpdateConnectionInput {
              edge: ActedInUpdateInput
              node: ShowUpdateInput
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

            type ActorShowActedInAggregationSelection {
              count: Int!
              edge: ActorShowActedInEdgeAggregateSelection
              node: ActorShowActedInNodeAggregateSelection
            }

            type ActorShowActedInEdgeAggregateSelection {
              screenTime: IntAggregateSelection!
            }

            type ActorShowActedInNodeAggregateSelection {
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
              name_SET: String
            }

            input ActorWhere {
              AND: [ActorWhere!]
              NOT: ActorWhere
              OR: [ActorWhere!]
              actedIn: ActorActedInRelationshipFilters
              actedInAggregate: ActorActedInAggregateInput
              actedInConnection: ActorActedInConnectionFilters
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
              \\"\\"\\"Return Actors where all of the related Shows match this filter\\"\\"\\"
              actedIn_ALL: ShowWhere
              \\"\\"\\"Return Actors where none of the related Shows match this filter\\"\\"\\"
              actedIn_NONE: ShowWhere
              \\"\\"\\"Return Actors where one of the related Shows match this filter\\"\\"\\"
              actedIn_SINGLE: ShowWhere
              \\"\\"\\"Return Actors where some of the related Shows match this filter\\"\\"\\"
              actedIn_SOME: ShowWhere
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

            type Movie implements Production & Show {
              actors(limit: Int, offset: Int, sort: [ActorSort!], where: ActorWhere): [Actor!]!
              actorsAggregate(where: ActorWhere): MovieActorActorsAggregationSelection
              actorsConnection(after: String, first: Int, sort: [ShowActorsConnectionSort!], where: ShowActorsConnectionWhere): ShowActorsConnection!
              runtime: Int!
              title: String!
            }

            type MovieActorActorsAggregationSelection {
              count: Int!
              edge: MovieActorActorsEdgeAggregateSelection
              node: MovieActorActorsNodeAggregateSelection
            }

            type MovieActorActorsEdgeAggregateSelection {
              screenTime: IntAggregateSelection!
            }

            type MovieActorActorsNodeAggregateSelection {
              name: StringAggregateSelection!
            }

            input MovieActorsAggregateInput {
              AND: [MovieActorsAggregateInput!]
              NOT: MovieActorsAggregateInput
              OR: [MovieActorsAggregateInput!]
              count_EQ: Int
              count_GT: Int
              count_GTE: Int
              count_LT: Int
              count_LTE: Int
              edge: ActedInAggregationWhereInput
              node: MovieActorsNodeAggregationWhereInput
            }

            input MovieActorsConnectFieldInput {
              connect: [ActorConnectInput!]
              edge: ActedInCreateInput!
              where: ActorConnectWhere
            }

            input MovieActorsConnectionFilters {
              \\"\\"\\"
              Return Movies where all of the related ShowActorsConnections match this filter
              \\"\\"\\"
              all: ShowActorsConnectionWhere
              \\"\\"\\"
              Return Movies where none of the related ShowActorsConnections match this filter
              \\"\\"\\"
              none: ShowActorsConnectionWhere
              \\"\\"\\"
              Return Movies where one of the related ShowActorsConnections match this filter
              \\"\\"\\"
              single: ShowActorsConnectionWhere
              \\"\\"\\"
              Return Movies where some of the related ShowActorsConnections match this filter
              \\"\\"\\"
              some: ShowActorsConnectionWhere
            }

            input MovieActorsCreateFieldInput {
              edge: ActedInCreateInput!
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
              name_AVERAGE_LENGTH_EQUAL: Float
              name_AVERAGE_LENGTH_GT: Float
              name_AVERAGE_LENGTH_GTE: Float
              name_AVERAGE_LENGTH_LT: Float
              name_AVERAGE_LENGTH_LTE: Float
              name_LONGEST_LENGTH_EQUAL: Int
              name_LONGEST_LENGTH_GT: Int
              name_LONGEST_LENGTH_GTE: Int
              name_LONGEST_LENGTH_LT: Int
              name_LONGEST_LENGTH_LTE: Int
              name_SHORTEST_LENGTH_EQUAL: Int
              name_SHORTEST_LENGTH_GT: Int
              name_SHORTEST_LENGTH_GTE: Int
              name_SHORTEST_LENGTH_LT: Int
              name_SHORTEST_LENGTH_LTE: Int
            }

            input MovieActorsRelationshipFilters {
              \\"\\"\\"Return Movies where all of the related Actors match this filter\\"\\"\\"
              all: ActorWhere
              \\"\\"\\"Return Movies where none of the related Actors match this filter\\"\\"\\"
              none: ActorWhere
              \\"\\"\\"Return Movies where one of the related Actors match this filter\\"\\"\\"
              single: ActorWhere
              \\"\\"\\"Return Movies where some of the related Actors match this filter\\"\\"\\"
              some: ActorWhere
            }

            input MovieActorsUpdateConnectionInput {
              edge: ActedInUpdateInput
              node: ActorUpdateInput
            }

            input MovieActorsUpdateFieldInput {
              connect: [MovieActorsConnectFieldInput!]
              create: [MovieActorsCreateFieldInput!]
              delete: [ShowActorsDeleteFieldInput!]
              disconnect: [ShowActorsDisconnectFieldInput!]
              update: MovieActorsUpdateConnectionInput
              where: ShowActorsConnectionWhere
            }

            type MovieAggregateSelection {
              count: Int!
              runtime: IntAggregateSelection!
              title: StringAggregateSelection!
            }

            input MovieCreateInput {
              actors: MovieActorsFieldInput
              runtime: Int!
              title: String!
            }

            input MovieDeleteInput {
              actors: [ShowActorsDeleteFieldInput!]
            }

            type MovieEdge {
              cursor: String!
              node: Movie!
            }

            \\"\\"\\"
            Fields to sort Movies by. The order in which sorts are applied is not guaranteed when specifying many fields in one MovieSort object.
            \\"\\"\\"
            input MovieSort {
              runtime: SortDirection
              title: SortDirection
            }

            input MovieUpdateInput {
              actors: [MovieActorsUpdateFieldInput!]
              runtime_DECREMENT: Int
              runtime_INCREMENT: Int
              runtime_SET: Int
              title_SET: String
            }

            input MovieWhere {
              AND: [MovieWhere!]
              NOT: MovieWhere
              OR: [MovieWhere!]
              actors: MovieActorsRelationshipFilters
              actorsAggregate: MovieActorsAggregateInput
              actorsConnection: MovieActorsConnectionFilters
              \\"\\"\\"
              Return Movies where all of the related ShowActorsConnections match this filter
              \\"\\"\\"
              actorsConnection_ALL: ShowActorsConnectionWhere
              \\"\\"\\"
              Return Movies where none of the related ShowActorsConnections match this filter
              \\"\\"\\"
              actorsConnection_NONE: ShowActorsConnectionWhere
              \\"\\"\\"
              Return Movies where one of the related ShowActorsConnections match this filter
              \\"\\"\\"
              actorsConnection_SINGLE: ShowActorsConnectionWhere
              \\"\\"\\"
              Return Movies where some of the related ShowActorsConnections match this filter
              \\"\\"\\"
              actorsConnection_SOME: ShowActorsConnectionWhere
              \\"\\"\\"Return Movies where all of the related Actors match this filter\\"\\"\\"
              actors_ALL: ActorWhere
              \\"\\"\\"Return Movies where none of the related Actors match this filter\\"\\"\\"
              actors_NONE: ActorWhere
              \\"\\"\\"Return Movies where one of the related Actors match this filter\\"\\"\\"
              actors_SINGLE: ActorWhere
              \\"\\"\\"Return Movies where some of the related Actors match this filter\\"\\"\\"
              actors_SOME: ActorWhere
              runtime: IntScalarFilters
              runtime_EQ: Int
              runtime_GT: Int
              runtime_GTE: Int
              runtime_IN: [Int!]
              runtime_LT: Int
              runtime_LTE: Int
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
              deleteMovies(delete: MovieDeleteInput, where: MovieWhere): DeleteInfo!
              deleteSeries(delete: SeriesDeleteInput, where: SeriesWhere): DeleteInfo!
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
              actors: [Actor!]!
              title: String!
            }

            type ProductionAggregateSelection {
              count: Int!
              title: StringAggregateSelection!
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
              title: SortDirection
            }

            input ProductionWhere {
              AND: [ProductionWhere!]
              NOT: ProductionWhere
              OR: [ProductionWhere!]
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
              shows(limit: Int, offset: Int, sort: [ShowSort!], where: ShowWhere): [Show!]!
              showsAggregate(where: ShowWhere): ShowAggregateSelection!
              showsConnection(after: String, first: Int, sort: [ShowSort!], where: ShowWhere): ShowsConnection!
            }

            type Series implements Production & Show {
              actors(limit: Int, offset: Int, sort: [ActorSort!], where: ActorWhere): [Actor!]!
              actorsAggregate(where: ActorWhere): SeriesActorActorsAggregationSelection
              actorsConnection(after: String, first: Int, sort: [ShowActorsConnectionSort!], where: ShowActorsConnectionWhere): ShowActorsConnection!
              episodeCount: Int!
              title: String!
            }

            type SeriesActorActorsAggregationSelection {
              count: Int!
              edge: SeriesActorActorsEdgeAggregateSelection
              node: SeriesActorActorsNodeAggregateSelection
            }

            type SeriesActorActorsEdgeAggregateSelection {
              episodeNr: IntAggregateSelection!
            }

            type SeriesActorActorsNodeAggregateSelection {
              name: StringAggregateSelection!
            }

            input SeriesActorsAggregateInput {
              AND: [SeriesActorsAggregateInput!]
              NOT: SeriesActorsAggregateInput
              OR: [SeriesActorsAggregateInput!]
              count_EQ: Int
              count_GT: Int
              count_GTE: Int
              count_LT: Int
              count_LTE: Int
              edge: StarredInAggregationWhereInput
              node: SeriesActorsNodeAggregationWhereInput
            }

            input SeriesActorsConnectFieldInput {
              connect: [ActorConnectInput!]
              edge: StarredInCreateInput!
              where: ActorConnectWhere
            }

            input SeriesActorsConnectionFilters {
              \\"\\"\\"
              Return Series where all of the related ShowActorsConnections match this filter
              \\"\\"\\"
              all: ShowActorsConnectionWhere
              \\"\\"\\"
              Return Series where none of the related ShowActorsConnections match this filter
              \\"\\"\\"
              none: ShowActorsConnectionWhere
              \\"\\"\\"
              Return Series where one of the related ShowActorsConnections match this filter
              \\"\\"\\"
              single: ShowActorsConnectionWhere
              \\"\\"\\"
              Return Series where some of the related ShowActorsConnections match this filter
              \\"\\"\\"
              some: ShowActorsConnectionWhere
            }

            input SeriesActorsCreateFieldInput {
              edge: StarredInCreateInput!
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
              name_AVERAGE_LENGTH_EQUAL: Float
              name_AVERAGE_LENGTH_GT: Float
              name_AVERAGE_LENGTH_GTE: Float
              name_AVERAGE_LENGTH_LT: Float
              name_AVERAGE_LENGTH_LTE: Float
              name_LONGEST_LENGTH_EQUAL: Int
              name_LONGEST_LENGTH_GT: Int
              name_LONGEST_LENGTH_GTE: Int
              name_LONGEST_LENGTH_LT: Int
              name_LONGEST_LENGTH_LTE: Int
              name_SHORTEST_LENGTH_EQUAL: Int
              name_SHORTEST_LENGTH_GT: Int
              name_SHORTEST_LENGTH_GTE: Int
              name_SHORTEST_LENGTH_LT: Int
              name_SHORTEST_LENGTH_LTE: Int
            }

            input SeriesActorsRelationshipFilters {
              \\"\\"\\"Return Series where all of the related Actors match this filter\\"\\"\\"
              all: ActorWhere
              \\"\\"\\"Return Series where none of the related Actors match this filter\\"\\"\\"
              none: ActorWhere
              \\"\\"\\"Return Series where one of the related Actors match this filter\\"\\"\\"
              single: ActorWhere
              \\"\\"\\"Return Series where some of the related Actors match this filter\\"\\"\\"
              some: ActorWhere
            }

            input SeriesActorsUpdateConnectionInput {
              edge: StarredInUpdateInput
              node: ActorUpdateInput
            }

            input SeriesActorsUpdateFieldInput {
              connect: [SeriesActorsConnectFieldInput!]
              create: [SeriesActorsCreateFieldInput!]
              delete: [ShowActorsDeleteFieldInput!]
              disconnect: [ShowActorsDisconnectFieldInput!]
              update: SeriesActorsUpdateConnectionInput
              where: ShowActorsConnectionWhere
            }

            type SeriesAggregateSelection {
              count: Int!
              episodeCount: IntAggregateSelection!
              title: StringAggregateSelection!
            }

            type SeriesConnection {
              edges: [SeriesEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input SeriesCreateInput {
              actors: SeriesActorsFieldInput
              episodeCount: Int!
              title: String!
            }

            input SeriesDeleteInput {
              actors: [ShowActorsDeleteFieldInput!]
            }

            type SeriesEdge {
              cursor: String!
              node: Series!
            }

            \\"\\"\\"
            Fields to sort Series by. The order in which sorts are applied is not guaranteed when specifying many fields in one SeriesSort object.
            \\"\\"\\"
            input SeriesSort {
              episodeCount: SortDirection
              title: SortDirection
            }

            input SeriesUpdateInput {
              actors: [SeriesActorsUpdateFieldInput!]
              episodeCount_DECREMENT: Int
              episodeCount_INCREMENT: Int
              episodeCount_SET: Int
              title_SET: String
            }

            input SeriesWhere {
              AND: [SeriesWhere!]
              NOT: SeriesWhere
              OR: [SeriesWhere!]
              actors: SeriesActorsRelationshipFilters
              actorsAggregate: SeriesActorsAggregateInput
              actorsConnection: SeriesActorsConnectionFilters
              \\"\\"\\"
              Return Series where all of the related ShowActorsConnections match this filter
              \\"\\"\\"
              actorsConnection_ALL: ShowActorsConnectionWhere
              \\"\\"\\"
              Return Series where none of the related ShowActorsConnections match this filter
              \\"\\"\\"
              actorsConnection_NONE: ShowActorsConnectionWhere
              \\"\\"\\"
              Return Series where one of the related ShowActorsConnections match this filter
              \\"\\"\\"
              actorsConnection_SINGLE: ShowActorsConnectionWhere
              \\"\\"\\"
              Return Series where some of the related ShowActorsConnections match this filter
              \\"\\"\\"
              actorsConnection_SOME: ShowActorsConnectionWhere
              \\"\\"\\"Return Series where all of the related Actors match this filter\\"\\"\\"
              actors_ALL: ActorWhere
              \\"\\"\\"Return Series where none of the related Actors match this filter\\"\\"\\"
              actors_NONE: ActorWhere
              \\"\\"\\"Return Series where one of the related Actors match this filter\\"\\"\\"
              actors_SINGLE: ActorWhere
              \\"\\"\\"Return Series where some of the related Actors match this filter\\"\\"\\"
              actors_SOME: ActorWhere
              episodeCount: IntScalarFilters
              episodeCount_EQ: Int
              episodeCount_GT: Int
              episodeCount_GTE: Int
              episodeCount_IN: [Int!]
              episodeCount_LT: Int
              episodeCount_LTE: Int
              title: StringScalarFilters
              title_CONTAINS: String
              title_ENDS_WITH: String
              title_EQ: String
              title_IN: [String!]
              title_STARTS_WITH: String
            }

            interface Show {
              actors(limit: Int, offset: Int, sort: [ActorSort!], where: ActorWhere): [Actor!]!
              actorsConnection(after: String, first: Int, sort: [ShowActorsConnectionSort!], where: ShowActorsConnectionWhere): ShowActorsConnection!
              title: String!
            }

            input ShowActorsAggregateInput {
              AND: [ShowActorsAggregateInput!]
              NOT: ShowActorsAggregateInput
              OR: [ShowActorsAggregateInput!]
              count_EQ: Int
              count_GT: Int
              count_GTE: Int
              count_LT: Int
              count_LTE: Int
              edge: ShowActorsEdgeAggregationWhereInput
              node: ShowActorsNodeAggregationWhereInput
            }

            input ShowActorsConnectFieldInput {
              connect: [ActorConnectInput!]
              edge: ShowActorsEdgeCreateInput!
              where: ActorConnectWhere
            }

            type ShowActorsConnection {
              edges: [ShowActorsRelationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input ShowActorsConnectionFilters {
              \\"\\"\\"
              Return Shows where all of the related ShowActorsConnections match this filter
              \\"\\"\\"
              all: ShowActorsConnectionWhere
              \\"\\"\\"
              Return Shows where none of the related ShowActorsConnections match this filter
              \\"\\"\\"
              none: ShowActorsConnectionWhere
              \\"\\"\\"
              Return Shows where one of the related ShowActorsConnections match this filter
              \\"\\"\\"
              single: ShowActorsConnectionWhere
              \\"\\"\\"
              Return Shows where some of the related ShowActorsConnections match this filter
              \\"\\"\\"
              some: ShowActorsConnectionWhere
            }

            input ShowActorsConnectionSort {
              edge: ShowActorsEdgeSort
              node: ActorSort
            }

            input ShowActorsConnectionWhere {
              AND: [ShowActorsConnectionWhere!]
              NOT: ShowActorsConnectionWhere
              OR: [ShowActorsConnectionWhere!]
              edge: ShowActorsEdgeWhere
              node: ActorWhere
            }

            input ShowActorsCreateFieldInput {
              edge: ShowActorsEdgeCreateInput!
              node: ActorCreateInput!
            }

            input ShowActorsDeleteFieldInput {
              delete: ActorDeleteInput
              where: ShowActorsConnectionWhere
            }

            input ShowActorsDisconnectFieldInput {
              disconnect: ActorDisconnectInput
              where: ShowActorsConnectionWhere
            }

            input ShowActorsEdgeAggregationWhereInput {
              \\"\\"\\"
              Relationship properties when source node is of type:
              * Movie
              \\"\\"\\"
              ActedIn: ActedInAggregationWhereInput
              \\"\\"\\"
              Relationship properties when source node is of type:
              * Series
              \\"\\"\\"
              StarredIn: StarredInAggregationWhereInput
            }

            input ShowActorsEdgeCreateInput {
              \\"\\"\\"
              Relationship properties when source node is of type:
              * Movie
              \\"\\"\\"
              ActedIn: ActedInCreateInput!
              \\"\\"\\"
              Relationship properties when source node is of type:
              * Series
              \\"\\"\\"
              StarredIn: StarredInCreateInput!
            }

            input ShowActorsEdgeSort {
              \\"\\"\\"
              Relationship properties when source node is of type:
              * Movie
              \\"\\"\\"
              ActedIn: ActedInSort
              \\"\\"\\"
              Relationship properties when source node is of type:
              * Series
              \\"\\"\\"
              StarredIn: StarredInSort
            }

            input ShowActorsEdgeUpdateInput {
              \\"\\"\\"
              Relationship properties when source node is of type:
              * Movie
              \\"\\"\\"
              ActedIn: ActedInUpdateInput
              \\"\\"\\"
              Relationship properties when source node is of type:
              * Series
              \\"\\"\\"
              StarredIn: StarredInUpdateInput
            }

            input ShowActorsEdgeWhere {
              \\"\\"\\"
              Relationship properties when source node is of type:
              * Movie
              \\"\\"\\"
              ActedIn: ActedInWhere
              \\"\\"\\"
              Relationship properties when source node is of type:
              * Series
              \\"\\"\\"
              StarredIn: StarredInWhere
            }

            input ShowActorsNodeAggregationWhereInput {
              AND: [ShowActorsNodeAggregationWhereInput!]
              NOT: ShowActorsNodeAggregationWhereInput
              OR: [ShowActorsNodeAggregationWhereInput!]
              name_AVERAGE_LENGTH_EQUAL: Float
              name_AVERAGE_LENGTH_GT: Float
              name_AVERAGE_LENGTH_GTE: Float
              name_AVERAGE_LENGTH_LT: Float
              name_AVERAGE_LENGTH_LTE: Float
              name_LONGEST_LENGTH_EQUAL: Int
              name_LONGEST_LENGTH_GT: Int
              name_LONGEST_LENGTH_GTE: Int
              name_LONGEST_LENGTH_LT: Int
              name_LONGEST_LENGTH_LTE: Int
              name_SHORTEST_LENGTH_EQUAL: Int
              name_SHORTEST_LENGTH_GT: Int
              name_SHORTEST_LENGTH_GTE: Int
              name_SHORTEST_LENGTH_LT: Int
              name_SHORTEST_LENGTH_LTE: Int
            }

            type ShowActorsRelationship {
              cursor: String!
              node: Actor!
              properties: ShowActorsRelationshipProperties!
            }

            input ShowActorsRelationshipFilters {
              \\"\\"\\"Return Shows where all of the related Actors match this filter\\"\\"\\"
              all: ActorWhere
              \\"\\"\\"Return Shows where none of the related Actors match this filter\\"\\"\\"
              none: ActorWhere
              \\"\\"\\"Return Shows where one of the related Actors match this filter\\"\\"\\"
              single: ActorWhere
              \\"\\"\\"Return Shows where some of the related Actors match this filter\\"\\"\\"
              some: ActorWhere
            }

            union ShowActorsRelationshipProperties = ActedIn | StarredIn

            input ShowActorsUpdateConnectionInput {
              edge: ShowActorsEdgeUpdateInput
              node: ActorUpdateInput
            }

            input ShowActorsUpdateFieldInput {
              connect: [ShowActorsConnectFieldInput!]
              create: [ShowActorsCreateFieldInput!]
              delete: [ShowActorsDeleteFieldInput!]
              disconnect: [ShowActorsDisconnectFieldInput!]
              update: ShowActorsUpdateConnectionInput
              where: ShowActorsConnectionWhere
            }

            type ShowAggregateSelection {
              count: Int!
              title: StringAggregateSelection!
            }

            input ShowConnectInput {
              actors: [ShowActorsConnectFieldInput!]
            }

            input ShowConnectWhere {
              node: ShowWhere!
            }

            input ShowCreateInput {
              Movie: MovieCreateInput
              Series: SeriesCreateInput
            }

            input ShowDeleteInput {
              actors: [ShowActorsDeleteFieldInput!]
            }

            input ShowDisconnectInput {
              actors: [ShowActorsDisconnectFieldInput!]
            }

            type ShowEdge {
              cursor: String!
              node: Show!
            }

            enum ShowImplementation {
              Movie
              Series
            }

            \\"\\"\\"
            Fields to sort Shows by. The order in which sorts are applied is not guaranteed when specifying many fields in one ShowSort object.
            \\"\\"\\"
            input ShowSort {
              title: SortDirection
            }

            input ShowUpdateInput {
              actors: [ShowActorsUpdateFieldInput!]
              title_SET: String
            }

            input ShowWhere {
              AND: [ShowWhere!]
              NOT: ShowWhere
              OR: [ShowWhere!]
              actors: ShowActorsRelationshipFilters
              actorsAggregate: ShowActorsAggregateInput
              actorsConnection: ShowActorsConnectionFilters
              \\"\\"\\"
              Return Shows where all of the related ShowActorsConnections match this filter
              \\"\\"\\"
              actorsConnection_ALL: ShowActorsConnectionWhere
              \\"\\"\\"
              Return Shows where none of the related ShowActorsConnections match this filter
              \\"\\"\\"
              actorsConnection_NONE: ShowActorsConnectionWhere
              \\"\\"\\"
              Return Shows where one of the related ShowActorsConnections match this filter
              \\"\\"\\"
              actorsConnection_SINGLE: ShowActorsConnectionWhere
              \\"\\"\\"
              Return Shows where some of the related ShowActorsConnections match this filter
              \\"\\"\\"
              actorsConnection_SOME: ShowActorsConnectionWhere
              \\"\\"\\"Return Shows where all of the related Actors match this filter\\"\\"\\"
              actors_ALL: ActorWhere
              \\"\\"\\"Return Shows where none of the related Actors match this filter\\"\\"\\"
              actors_NONE: ActorWhere
              \\"\\"\\"Return Shows where one of the related Actors match this filter\\"\\"\\"
              actors_SINGLE: ActorWhere
              \\"\\"\\"Return Shows where some of the related Actors match this filter\\"\\"\\"
              actors_SOME: ActorWhere
              title: StringScalarFilters
              title_CONTAINS: String
              title_ENDS_WITH: String
              title_EQ: String
              title_IN: [String!]
              title_STARTS_WITH: String
              typename_IN: [ShowImplementation!]
            }

            type ShowsConnection {
              edges: [ShowEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            \\"\\"\\"An enum for sorting in either ascending or descending order.\\"\\"\\"
            enum SortDirection {
              \\"\\"\\"Sort by field values in ascending order.\\"\\"\\"
              ASC
              \\"\\"\\"Sort by field values in descending order.\\"\\"\\"
              DESC
            }

            \\"\\"\\"
            The edge properties for the following fields:
            * Series.actors
            \\"\\"\\"
            type StarredIn {
              episodeNr: Int!
            }

            input StarredInAggregationWhereInput {
              AND: [StarredInAggregationWhereInput!]
              NOT: StarredInAggregationWhereInput
              OR: [StarredInAggregationWhereInput!]
              episodeNr_AVERAGE_EQUAL: Float
              episodeNr_AVERAGE_GT: Float
              episodeNr_AVERAGE_GTE: Float
              episodeNr_AVERAGE_LT: Float
              episodeNr_AVERAGE_LTE: Float
              episodeNr_MAX_EQUAL: Int
              episodeNr_MAX_GT: Int
              episodeNr_MAX_GTE: Int
              episodeNr_MAX_LT: Int
              episodeNr_MAX_LTE: Int
              episodeNr_MIN_EQUAL: Int
              episodeNr_MIN_GT: Int
              episodeNr_MIN_GTE: Int
              episodeNr_MIN_LT: Int
              episodeNr_MIN_LTE: Int
              episodeNr_SUM_EQUAL: Int
              episodeNr_SUM_GT: Int
              episodeNr_SUM_GTE: Int
              episodeNr_SUM_LT: Int
              episodeNr_SUM_LTE: Int
            }

            input StarredInCreateInput {
              episodeNr: Int!
            }

            input StarredInSort {
              episodeNr: SortDirection
            }

            input StarredInUpdateInput {
              episodeNr_DECREMENT: Int
              episodeNr_INCREMENT: Int
              episodeNr_SET: Int
            }

            input StarredInWhere {
              AND: [StarredInWhere!]
              NOT: StarredInWhere
              OR: [StarredInWhere!]
              episodeNr: IntScalarFilters
              episodeNr_EQ: Int
              episodeNr_GT: Int
              episodeNr_GTE: Int
              episodeNr_IN: [Int!]
              episodeNr_LT: Int
              episodeNr_LTE: Int
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
