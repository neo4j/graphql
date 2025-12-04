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
              screenTime: IntScalarAggregationFilters
              screenTime_AVERAGE_EQUAL: Float @deprecated(reason: \\"Please use the relevant generic filter 'screenTime: { average: { eq: ... } } }' instead.\\")
              screenTime_AVERAGE_GT: Float @deprecated(reason: \\"Please use the relevant generic filter 'screenTime: { average: { gt: ... } } }' instead.\\")
              screenTime_AVERAGE_GTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'screenTime: { average: { gte: ... } } }' instead.\\")
              screenTime_AVERAGE_LT: Float @deprecated(reason: \\"Please use the relevant generic filter 'screenTime: { average: { lt: ... } } }' instead.\\")
              screenTime_AVERAGE_LTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'screenTime: { average: { lte: ... } } }' instead.\\")
              screenTime_MAX_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'screenTime: { max: { eq: ... } } }' instead.\\")
              screenTime_MAX_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'screenTime: { max: { gt: ... } } }' instead.\\")
              screenTime_MAX_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'screenTime: { max: { gte: ... } } }' instead.\\")
              screenTime_MAX_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'screenTime: { max: { lt: ... } } }' instead.\\")
              screenTime_MAX_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'screenTime: { max: { lte: ... } } }' instead.\\")
              screenTime_MIN_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'screenTime: { min: { eq: ... } } }' instead.\\")
              screenTime_MIN_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'screenTime: { min: { gt: ... } } }' instead.\\")
              screenTime_MIN_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'screenTime: { min: { gte: ... } } }' instead.\\")
              screenTime_MIN_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'screenTime: { min: { lt: ... } } }' instead.\\")
              screenTime_MIN_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'screenTime: { min: { lte: ... } } }' instead.\\")
              screenTime_SUM_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'screenTime: { sum: { eq: ... } } }' instead.\\")
              screenTime_SUM_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'screenTime: { sum: { gt: ... } } }' instead.\\")
              screenTime_SUM_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'screenTime: { sum: { gte: ... } } }' instead.\\")
              screenTime_SUM_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'screenTime: { sum: { lt: ... } } }' instead.\\")
              screenTime_SUM_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'screenTime: { sum: { lte: ... } } }' instead.\\")
            }

            input ActedInCreateInput {
              screenTime: Int!
            }

            input ActedInSort {
              screenTime: SortDirection
            }

            input ActedInUpdateInput {
              screenTime: IntScalarMutations
              screenTime_DECREMENT: Int @deprecated(reason: \\"Please use the relevant generic mutation 'screenTime: { decrement: ... } }' instead.\\")
              screenTime_INCREMENT: Int @deprecated(reason: \\"Please use the relevant generic mutation 'screenTime: { increment: ... } }' instead.\\")
              screenTime_SET: Int @deprecated(reason: \\"Please use the generic mutation 'screenTime: { set: ... } }' instead.\\")
            }

            input ActedInWhere {
              AND: [ActedInWhere!]
              NOT: ActedInWhere
              OR: [ActedInWhere!]
              screenTime: IntScalarFilters
              screenTime_EQ: Int @deprecated(reason: \\"Please use the relevant generic filter screenTime: { eq: ... }\\")
              screenTime_GT: Int @deprecated(reason: \\"Please use the relevant generic filter screenTime: { gt: ... }\\")
              screenTime_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter screenTime: { gte: ... }\\")
              screenTime_IN: [Int!] @deprecated(reason: \\"Please use the relevant generic filter screenTime: { in: ... }\\")
              screenTime_LT: Int @deprecated(reason: \\"Please use the relevant generic filter screenTime: { lt: ... }\\")
              screenTime_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter screenTime: { lte: ... }\\")
            }

            type Actor {
              actedIn(limit: Int, offset: Int, sort: [ProductionSort!], where: ProductionWhere): [Production!]!
              actedInConnection(after: String, first: Int, sort: [ActorActedInConnectionSort!], where: ActorActedInConnectionWhere): ActorActedInConnection!
              name: String!
            }

            input ActorActedInAggregateInput {
              AND: [ActorActedInAggregateInput!]
              NOT: ActorActedInAggregateInput
              OR: [ActorActedInAggregateInput!]
              count: IntScalarFilters
              count_EQ: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { eq: ... } } }' instead.\\")
              count_GT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gt: ... } } }' instead.\\")
              count_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gte: ... } } }' instead.\\")
              count_LT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lt: ... } } }' instead.\\")
              count_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lte: ... } } }' instead.\\")
              edge: ActedInAggregationWhereInput
              node: ActorActedInNodeAggregationWhereInput
            }

            input ActorActedInConnectFieldInput {
              edge: ActedInCreateInput!
              where: ProductionConnectWhere
            }

            type ActorActedInConnection {
              aggregate: ActorProductionActedInAggregateSelection!
              edges: [ActorActedInRelationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input ActorActedInConnectionAggregateInput {
              AND: [ActorActedInConnectionAggregateInput!]
              NOT: ActorActedInConnectionAggregateInput
              OR: [ActorActedInConnectionAggregateInput!]
              count: ConnectionAggregationCountFilterInput
              edge: ActedInAggregationWhereInput
              node: ActorActedInNodeAggregationWhereInput
            }

            input ActorActedInConnectionFilters {
              \\"\\"\\"
              Filter Actors by aggregating results on related ActorActedInConnections
              \\"\\"\\"
              aggregate: ActorActedInConnectionAggregateInput
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
              title: StringScalarAggregationFilters
              title_AVERAGE_LENGTH_EQUAL: Float @deprecated(reason: \\"Please use the relevant generic filter 'title: { averageLength: { eq: ... } } }' instead.\\")
              title_AVERAGE_LENGTH_GT: Float @deprecated(reason: \\"Please use the relevant generic filter 'title: { averageLength: { gt: ... } } }' instead.\\")
              title_AVERAGE_LENGTH_GTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'title: { averageLength: { gte: ... } } }' instead.\\")
              title_AVERAGE_LENGTH_LT: Float @deprecated(reason: \\"Please use the relevant generic filter 'title: { averageLength: { lt: ... } } }' instead.\\")
              title_AVERAGE_LENGTH_LTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'title: { averageLength: { lte: ... } } }' instead.\\")
              title_LONGEST_LENGTH_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { longestLength: { eq: ... } } }' instead.\\")
              title_LONGEST_LENGTH_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { longestLength: { gt: ... } } }' instead.\\")
              title_LONGEST_LENGTH_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { longestLength: { gte: ... } } }' instead.\\")
              title_LONGEST_LENGTH_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { longestLength: { lt: ... } } }' instead.\\")
              title_LONGEST_LENGTH_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { longestLength: { lte: ... } } }' instead.\\")
              title_SHORTEST_LENGTH_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { shortestLength: { eq: ... } } }' instead.\\")
              title_SHORTEST_LENGTH_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { shortestLength: { gt: ... } } }' instead.\\")
              title_SHORTEST_LENGTH_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { shortestLength: { gte: ... } } }' instead.\\")
              title_SHORTEST_LENGTH_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { shortestLength: { lt: ... } } }' instead.\\")
              title_SHORTEST_LENGTH_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { shortestLength: { lte: ... } } }' instead.\\")
            }

            type ActorActedInRelationship {
              cursor: String!
              node: Production!
              properties: ActedIn!
            }

            input ActorActedInUpdateConnectionInput {
              edge: ActedInUpdateInput
              node: ProductionUpdateInput
              where: ActorActedInConnectionWhere
            }

            input ActorActedInUpdateFieldInput {
              connect: [ActorActedInConnectFieldInput!]
              create: [ActorActedInCreateFieldInput!]
              delete: [ActorActedInDeleteFieldInput!]
              disconnect: [ActorActedInDisconnectFieldInput!]
              update: ActorActedInUpdateConnectionInput
            }

            type ActorAggregate {
              count: Count!
              node: ActorAggregateNode!
            }

            type ActorAggregateNode {
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

            type ActorProductionActedInAggregateSelection {
              count: CountConnection!
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
              name: StringScalarMutations
              name_SET: String @deprecated(reason: \\"Please use the generic mutation 'name: { set: ... } }' instead.\\")
            }

            input ActorWhere {
              AND: [ActorWhere!]
              NOT: ActorWhere
              OR: [ActorWhere!]
              actedIn: ProductionRelationshipFilters
              actedInAggregate: ActorActedInAggregateInput @deprecated(reason: \\"Aggregate filters are moved inside the actedInConnection filter, please use { actedInConnection: { aggregate: {...} } } instead\\")
              actedInConnection: ActorActedInConnectionFilters
              \\"\\"\\"
              Return Actors where all of the related ActorActedInConnections match this filter
              \\"\\"\\"
              actedInConnection_ALL: ActorActedInConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actedInConnection: { all: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Actors where none of the related ActorActedInConnections match this filter
              \\"\\"\\"
              actedInConnection_NONE: ActorActedInConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actedInConnection: { none: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Actors where one of the related ActorActedInConnections match this filter
              \\"\\"\\"
              actedInConnection_SINGLE: ActorActedInConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actedInConnection: { single: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Actors where some of the related ActorActedInConnections match this filter
              \\"\\"\\"
              actedInConnection_SOME: ActorActedInConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actedInConnection: { some: { node: ... } } }' instead.\\")
              \\"\\"\\"Return Actors where all of the related Productions match this filter\\"\\"\\"
              actedIn_ALL: ProductionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actedIn: { all: ... }' instead.\\")
              \\"\\"\\"Return Actors where none of the related Productions match this filter\\"\\"\\"
              actedIn_NONE: ProductionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actedIn: { none: ... }' instead.\\")
              \\"\\"\\"Return Actors where one of the related Productions match this filter\\"\\"\\"
              actedIn_SINGLE: ProductionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actedIn: {  single: ... }' instead.\\")
              \\"\\"\\"Return Actors where some of the related Productions match this filter\\"\\"\\"
              actedIn_SOME: ProductionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actedIn: {  some: ... }' instead.\\")
              name: StringScalarFilters
              name_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter name: { contains: ... }\\")
              name_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter name: { endsWith: ... }\\")
              name_EQ: String @deprecated(reason: \\"Please use the relevant generic filter name: { eq: ... }\\")
              name_IN: [String!] @deprecated(reason: \\"Please use the relevant generic filter name: { in: ... }\\")
              name_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter name: { startsWith: ... }\\")
            }

            type ActorsConnection {
              aggregate: ActorAggregate!
              edges: [ActorEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input ConnectionAggregationCountFilterInput {
              edges: IntScalarFilters
              nodes: IntScalarFilters
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

            \\"\\"\\"Float filters\\"\\"\\"
            input FloatScalarFilters {
              eq: Float
              gt: Float
              gte: Float
              in: [Float!]
              lt: Float
              lte: Float
            }

            type IntAggregateSelection {
              average: Float
              max: Int
              min: Int
              sum: Int
            }

            \\"\\"\\"Filters for an aggregation of an int field\\"\\"\\"
            input IntScalarAggregationFilters {
              average: FloatScalarFilters
              max: IntScalarFilters
              min: IntScalarFilters
              sum: IntScalarFilters
            }

            \\"\\"\\"Int filters\\"\\"\\"
            input IntScalarFilters {
              eq: Int
              gt: Int
              gte: Int
              in: [Int!]
              lt: Int
              lte: Int
            }

            \\"\\"\\"Int mutations\\"\\"\\"
            input IntScalarMutations {
              add: Int
              set: Int
              subtract: Int
            }

            type Movie implements Production {
              runtime: Int!
              title: String!
            }

            type MovieAggregate {
              count: Count!
              node: MovieAggregateNode!
            }

            type MovieAggregateNode {
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
              runtime: IntScalarMutations
              runtime_DECREMENT: Int @deprecated(reason: \\"Please use the relevant generic mutation 'runtime: { decrement: ... } }' instead.\\")
              runtime_INCREMENT: Int @deprecated(reason: \\"Please use the relevant generic mutation 'runtime: { increment: ... } }' instead.\\")
              runtime_SET: Int @deprecated(reason: \\"Please use the generic mutation 'runtime: { set: ... } }' instead.\\")
              title: StringScalarMutations
              title_SET: String @deprecated(reason: \\"Please use the generic mutation 'title: { set: ... } }' instead.\\")
            }

            input MovieWhere {
              AND: [MovieWhere!]
              NOT: MovieWhere
              OR: [MovieWhere!]
              runtime: IntScalarFilters
              runtime_EQ: Int @deprecated(reason: \\"Please use the relevant generic filter runtime: { eq: ... }\\")
              runtime_GT: Int @deprecated(reason: \\"Please use the relevant generic filter runtime: { gt: ... }\\")
              runtime_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter runtime: { gte: ... }\\")
              runtime_IN: [Int!] @deprecated(reason: \\"Please use the relevant generic filter runtime: { in: ... }\\")
              runtime_LT: Int @deprecated(reason: \\"Please use the relevant generic filter runtime: { lt: ... }\\")
              runtime_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter runtime: { lte: ... }\\")
              title: StringScalarFilters
              title_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter title: { contains: ... }\\")
              title_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter title: { endsWith: ... }\\")
              title_EQ: String @deprecated(reason: \\"Please use the relevant generic filter title: { eq: ... }\\")
              title_IN: [String!] @deprecated(reason: \\"Please use the relevant generic filter title: { in: ... }\\")
              title_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter title: { startsWith: ... }\\")
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

            type ProductionAggregate {
              count: Count!
              node: ProductionAggregateNode!
            }

            type ProductionAggregateNode {
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

            input ProductionRelationshipFilters {
              \\"\\"\\"Filter type where all of the related Productions match this filter\\"\\"\\"
              all: ProductionWhere
              \\"\\"\\"Filter type where none of the related Productions match this filter\\"\\"\\"
              none: ProductionWhere
              \\"\\"\\"Filter type where one of the related Productions match this filter\\"\\"\\"
              single: ProductionWhere
              \\"\\"\\"Filter type where some of the related Productions match this filter\\"\\"\\"
              some: ProductionWhere
            }

            \\"\\"\\"
            Fields to sort Productions by. The order in which sorts are applied is not guaranteed when specifying many fields in one ProductionSort object.
            \\"\\"\\"
            input ProductionSort {
              title: SortDirection
            }

            input ProductionUpdateInput {
              title: StringScalarMutations
              title_SET: String @deprecated(reason: \\"Please use the generic mutation 'title: { set: ... } }' instead.\\")
            }

            input ProductionWhere {
              AND: [ProductionWhere!]
              NOT: ProductionWhere
              OR: [ProductionWhere!]
              title: StringScalarFilters
              title_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter title: { contains: ... }\\")
              title_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter title: { endsWith: ... }\\")
              title_EQ: String @deprecated(reason: \\"Please use the relevant generic filter title: { eq: ... }\\")
              title_IN: [String!] @deprecated(reason: \\"Please use the relevant generic filter title: { in: ... }\\")
              title_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter title: { startsWith: ... }\\")
              typename: [ProductionImplementation!]
            }

            type ProductionsConnection {
              aggregate: ProductionAggregate!
              edges: [ProductionEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            type Query {
              actors(limit: Int, offset: Int, sort: [ActorSort!], where: ActorWhere): [Actor!]!
              actorsConnection(after: String, first: Int, sort: [ActorSort!], where: ActorWhere): ActorsConnection!
              movies(limit: Int, offset: Int, sort: [MovieSort!], where: MovieWhere): [Movie!]!
              moviesConnection(after: String, first: Int, sort: [MovieSort!], where: MovieWhere): MoviesConnection!
              productions(limit: Int, offset: Int, sort: [ProductionSort!], where: ProductionWhere): [Production!]!
              productionsConnection(after: String, first: Int, sort: [ProductionSort!], where: ProductionWhere): ProductionsConnection!
              series(limit: Int, offset: Int, sort: [SeriesSort!], where: SeriesWhere): [Series!]!
              seriesConnection(after: String, first: Int, sort: [SeriesSort!], where: SeriesWhere): SeriesConnection!
            }

            type Series implements Production {
              episodes: Int!
              title: String!
            }

            type SeriesAggregate {
              count: Count!
              node: SeriesAggregateNode!
            }

            type SeriesAggregateNode {
              episodes: IntAggregateSelection!
              title: StringAggregateSelection!
            }

            type SeriesConnection {
              aggregate: SeriesAggregate!
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
              episodes: IntScalarMutations
              episodes_DECREMENT: Int @deprecated(reason: \\"Please use the relevant generic mutation 'episodes: { decrement: ... } }' instead.\\")
              episodes_INCREMENT: Int @deprecated(reason: \\"Please use the relevant generic mutation 'episodes: { increment: ... } }' instead.\\")
              episodes_SET: Int @deprecated(reason: \\"Please use the generic mutation 'episodes: { set: ... } }' instead.\\")
              title: StringScalarMutations
              title_SET: String @deprecated(reason: \\"Please use the generic mutation 'title: { set: ... } }' instead.\\")
            }

            input SeriesWhere {
              AND: [SeriesWhere!]
              NOT: SeriesWhere
              OR: [SeriesWhere!]
              episodes: IntScalarFilters
              episodes_EQ: Int @deprecated(reason: \\"Please use the relevant generic filter episodes: { eq: ... }\\")
              episodes_GT: Int @deprecated(reason: \\"Please use the relevant generic filter episodes: { gt: ... }\\")
              episodes_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter episodes: { gte: ... }\\")
              episodes_IN: [Int!] @deprecated(reason: \\"Please use the relevant generic filter episodes: { in: ... }\\")
              episodes_LT: Int @deprecated(reason: \\"Please use the relevant generic filter episodes: { lt: ... }\\")
              episodes_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter episodes: { lte: ... }\\")
              title: StringScalarFilters
              title_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter title: { contains: ... }\\")
              title_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter title: { endsWith: ... }\\")
              title_EQ: String @deprecated(reason: \\"Please use the relevant generic filter title: { eq: ... }\\")
              title_IN: [String!] @deprecated(reason: \\"Please use the relevant generic filter title: { in: ... }\\")
              title_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter title: { startsWith: ... }\\")
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

            \\"\\"\\"Filters for an aggregation of a string field\\"\\"\\"
            input StringScalarAggregationFilters {
              averageLength: FloatScalarFilters
              longestLength: IntScalarFilters
              shortestLength: IntScalarFilters
            }

            \\"\\"\\"String filters\\"\\"\\"
            input StringScalarFilters {
              contains: String
              endsWith: String
              eq: String
              in: [String!]
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
              screenTime: IntScalarAggregationFilters
              screenTime_AVERAGE_EQUAL: Float @deprecated(reason: \\"Please use the relevant generic filter 'screenTime: { average: { eq: ... } } }' instead.\\")
              screenTime_AVERAGE_GT: Float @deprecated(reason: \\"Please use the relevant generic filter 'screenTime: { average: { gt: ... } } }' instead.\\")
              screenTime_AVERAGE_GTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'screenTime: { average: { gte: ... } } }' instead.\\")
              screenTime_AVERAGE_LT: Float @deprecated(reason: \\"Please use the relevant generic filter 'screenTime: { average: { lt: ... } } }' instead.\\")
              screenTime_AVERAGE_LTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'screenTime: { average: { lte: ... } } }' instead.\\")
              screenTime_MAX_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'screenTime: { max: { eq: ... } } }' instead.\\")
              screenTime_MAX_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'screenTime: { max: { gt: ... } } }' instead.\\")
              screenTime_MAX_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'screenTime: { max: { gte: ... } } }' instead.\\")
              screenTime_MAX_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'screenTime: { max: { lt: ... } } }' instead.\\")
              screenTime_MAX_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'screenTime: { max: { lte: ... } } }' instead.\\")
              screenTime_MIN_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'screenTime: { min: { eq: ... } } }' instead.\\")
              screenTime_MIN_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'screenTime: { min: { gt: ... } } }' instead.\\")
              screenTime_MIN_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'screenTime: { min: { gte: ... } } }' instead.\\")
              screenTime_MIN_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'screenTime: { min: { lt: ... } } }' instead.\\")
              screenTime_MIN_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'screenTime: { min: { lte: ... } } }' instead.\\")
              screenTime_SUM_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'screenTime: { sum: { eq: ... } } }' instead.\\")
              screenTime_SUM_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'screenTime: { sum: { gt: ... } } }' instead.\\")
              screenTime_SUM_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'screenTime: { sum: { gte: ... } } }' instead.\\")
              screenTime_SUM_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'screenTime: { sum: { lt: ... } } }' instead.\\")
              screenTime_SUM_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'screenTime: { sum: { lte: ... } } }' instead.\\")
            }

            input ActedInCreateInput {
              screenTime: Int!
            }

            input ActedInSort {
              screenTime: SortDirection
            }

            input ActedInUpdateInput {
              screenTime: IntScalarMutations
              screenTime_DECREMENT: Int @deprecated(reason: \\"Please use the relevant generic mutation 'screenTime: { decrement: ... } }' instead.\\")
              screenTime_INCREMENT: Int @deprecated(reason: \\"Please use the relevant generic mutation 'screenTime: { increment: ... } }' instead.\\")
              screenTime_SET: Int @deprecated(reason: \\"Please use the generic mutation 'screenTime: { set: ... } }' instead.\\")
            }

            input ActedInWhere {
              AND: [ActedInWhere!]
              NOT: ActedInWhere
              OR: [ActedInWhere!]
              screenTime: IntScalarFilters
              screenTime_EQ: Int @deprecated(reason: \\"Please use the relevant generic filter screenTime: { eq: ... }\\")
              screenTime_GT: Int @deprecated(reason: \\"Please use the relevant generic filter screenTime: { gt: ... }\\")
              screenTime_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter screenTime: { gte: ... }\\")
              screenTime_IN: [Int!] @deprecated(reason: \\"Please use the relevant generic filter screenTime: { in: ... }\\")
              screenTime_LT: Int @deprecated(reason: \\"Please use the relevant generic filter screenTime: { lt: ... }\\")
              screenTime_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter screenTime: { lte: ... }\\")
            }

            type Actor {
              actedIn(limit: Int, offset: Int, sort: [ProductionSort!], where: ProductionWhere): [Production!]!
              actedInConnection(after: String, first: Int, sort: [ActorActedInConnectionSort!], where: ActorActedInConnectionWhere): ActorActedInConnection!
              name: String!
            }

            input ActorActedInAggregateInput {
              AND: [ActorActedInAggregateInput!]
              NOT: ActorActedInAggregateInput
              OR: [ActorActedInAggregateInput!]
              count: IntScalarFilters
              count_EQ: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { eq: ... } } }' instead.\\")
              count_GT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gt: ... } } }' instead.\\")
              count_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gte: ... } } }' instead.\\")
              count_LT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lt: ... } } }' instead.\\")
              count_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lte: ... } } }' instead.\\")
              edge: ActedInAggregationWhereInput
              node: ActorActedInNodeAggregationWhereInput
            }

            input ActorActedInConnectFieldInput {
              connect: ProductionConnectInput
              edge: ActedInCreateInput!
              where: ProductionConnectWhere
            }

            type ActorActedInConnection {
              aggregate: ActorProductionActedInAggregateSelection!
              edges: [ActorActedInRelationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input ActorActedInConnectionAggregateInput {
              AND: [ActorActedInConnectionAggregateInput!]
              NOT: ActorActedInConnectionAggregateInput
              OR: [ActorActedInConnectionAggregateInput!]
              count: ConnectionAggregationCountFilterInput
              edge: ActedInAggregationWhereInput
              node: ActorActedInNodeAggregationWhereInput
            }

            input ActorActedInConnectionFilters {
              \\"\\"\\"
              Filter Actors by aggregating results on related ActorActedInConnections
              \\"\\"\\"
              aggregate: ActorActedInConnectionAggregateInput
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
              title: StringScalarAggregationFilters
              title_AVERAGE_LENGTH_EQUAL: Float @deprecated(reason: \\"Please use the relevant generic filter 'title: { averageLength: { eq: ... } } }' instead.\\")
              title_AVERAGE_LENGTH_GT: Float @deprecated(reason: \\"Please use the relevant generic filter 'title: { averageLength: { gt: ... } } }' instead.\\")
              title_AVERAGE_LENGTH_GTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'title: { averageLength: { gte: ... } } }' instead.\\")
              title_AVERAGE_LENGTH_LT: Float @deprecated(reason: \\"Please use the relevant generic filter 'title: { averageLength: { lt: ... } } }' instead.\\")
              title_AVERAGE_LENGTH_LTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'title: { averageLength: { lte: ... } } }' instead.\\")
              title_LONGEST_LENGTH_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { longestLength: { eq: ... } } }' instead.\\")
              title_LONGEST_LENGTH_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { longestLength: { gt: ... } } }' instead.\\")
              title_LONGEST_LENGTH_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { longestLength: { gte: ... } } }' instead.\\")
              title_LONGEST_LENGTH_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { longestLength: { lt: ... } } }' instead.\\")
              title_LONGEST_LENGTH_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { longestLength: { lte: ... } } }' instead.\\")
              title_SHORTEST_LENGTH_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { shortestLength: { eq: ... } } }' instead.\\")
              title_SHORTEST_LENGTH_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { shortestLength: { gt: ... } } }' instead.\\")
              title_SHORTEST_LENGTH_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { shortestLength: { gte: ... } } }' instead.\\")
              title_SHORTEST_LENGTH_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { shortestLength: { lt: ... } } }' instead.\\")
              title_SHORTEST_LENGTH_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { shortestLength: { lte: ... } } }' instead.\\")
            }

            type ActorActedInRelationship {
              cursor: String!
              node: Production!
              properties: ActedIn!
            }

            input ActorActedInUpdateConnectionInput {
              edge: ActedInUpdateInput
              node: ProductionUpdateInput
              where: ActorActedInConnectionWhere
            }

            input ActorActedInUpdateFieldInput {
              connect: [ActorActedInConnectFieldInput!]
              create: [ActorActedInCreateFieldInput!]
              delete: [ActorActedInDeleteFieldInput!]
              disconnect: [ActorActedInDisconnectFieldInput!]
              update: ActorActedInUpdateConnectionInput
            }

            type ActorAggregate {
              count: Count!
              node: ActorAggregateNode!
            }

            type ActorAggregateNode {
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

            type ActorProductionActedInAggregateSelection {
              count: CountConnection!
              edge: ActorProductionActedInEdgeAggregateSelection
              node: ActorProductionActedInNodeAggregateSelection
            }

            type ActorProductionActedInEdgeAggregateSelection {
              screenTime: IntAggregateSelection!
            }

            type ActorProductionActedInNodeAggregateSelection {
              title: StringAggregateSelection!
            }

            input ActorRelationshipFilters {
              \\"\\"\\"Filter type where all of the related Actors match this filter\\"\\"\\"
              all: ActorWhere
              \\"\\"\\"Filter type where none of the related Actors match this filter\\"\\"\\"
              none: ActorWhere
              \\"\\"\\"Filter type where one of the related Actors match this filter\\"\\"\\"
              single: ActorWhere
              \\"\\"\\"Filter type where some of the related Actors match this filter\\"\\"\\"
              some: ActorWhere
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
              name_SET: String @deprecated(reason: \\"Please use the generic mutation 'name: { set: ... } }' instead.\\")
            }

            input ActorWhere {
              AND: [ActorWhere!]
              NOT: ActorWhere
              OR: [ActorWhere!]
              actedIn: ProductionRelationshipFilters
              actedInAggregate: ActorActedInAggregateInput @deprecated(reason: \\"Aggregate filters are moved inside the actedInConnection filter, please use { actedInConnection: { aggregate: {...} } } instead\\")
              actedInConnection: ActorActedInConnectionFilters
              \\"\\"\\"
              Return Actors where all of the related ActorActedInConnections match this filter
              \\"\\"\\"
              actedInConnection_ALL: ActorActedInConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actedInConnection: { all: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Actors where none of the related ActorActedInConnections match this filter
              \\"\\"\\"
              actedInConnection_NONE: ActorActedInConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actedInConnection: { none: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Actors where one of the related ActorActedInConnections match this filter
              \\"\\"\\"
              actedInConnection_SINGLE: ActorActedInConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actedInConnection: { single: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Actors where some of the related ActorActedInConnections match this filter
              \\"\\"\\"
              actedInConnection_SOME: ActorActedInConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actedInConnection: { some: { node: ... } } }' instead.\\")
              \\"\\"\\"Return Actors where all of the related Productions match this filter\\"\\"\\"
              actedIn_ALL: ProductionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actedIn: { all: ... }' instead.\\")
              \\"\\"\\"Return Actors where none of the related Productions match this filter\\"\\"\\"
              actedIn_NONE: ProductionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actedIn: { none: ... }' instead.\\")
              \\"\\"\\"Return Actors where one of the related Productions match this filter\\"\\"\\"
              actedIn_SINGLE: ProductionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actedIn: {  single: ... }' instead.\\")
              \\"\\"\\"Return Actors where some of the related Productions match this filter\\"\\"\\"
              actedIn_SOME: ProductionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actedIn: {  some: ... }' instead.\\")
              name: StringScalarFilters
              name_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter name: { contains: ... }\\")
              name_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter name: { endsWith: ... }\\")
              name_EQ: String @deprecated(reason: \\"Please use the relevant generic filter name: { eq: ... }\\")
              name_IN: [String!] @deprecated(reason: \\"Please use the relevant generic filter name: { in: ... }\\")
              name_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter name: { startsWith: ... }\\")
            }

            type ActorsConnection {
              aggregate: ActorAggregate!
              edges: [ActorEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input ConnectionAggregationCountFilterInput {
              edges: IntScalarFilters
              nodes: IntScalarFilters
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
              seriesConnection(after: String, first: Int, sort: [EpisodeSeriesConnectionSort!], where: EpisodeSeriesConnectionWhere): EpisodeSeriesConnection!
            }

            type EpisodeAggregate {
              count: Count!
              node: EpisodeAggregateNode!
            }

            type EpisodeAggregateNode {
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

            input EpisodeRelationshipFilters {
              \\"\\"\\"Filter type where all of the related Episodes match this filter\\"\\"\\"
              all: EpisodeWhere
              \\"\\"\\"Filter type where none of the related Episodes match this filter\\"\\"\\"
              none: EpisodeWhere
              \\"\\"\\"Filter type where one of the related Episodes match this filter\\"\\"\\"
              single: EpisodeWhere
              \\"\\"\\"Filter type where some of the related Episodes match this filter\\"\\"\\"
              some: EpisodeWhere
            }

            input EpisodeSeriesAggregateInput {
              AND: [EpisodeSeriesAggregateInput!]
              NOT: EpisodeSeriesAggregateInput
              OR: [EpisodeSeriesAggregateInput!]
              count: IntScalarFilters
              count_EQ: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { eq: ... } } }' instead.\\")
              count_GT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gt: ... } } }' instead.\\")
              count_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gte: ... } } }' instead.\\")
              count_LT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lt: ... } } }' instead.\\")
              count_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lte: ... } } }' instead.\\")
              node: EpisodeSeriesNodeAggregationWhereInput
            }

            input EpisodeSeriesConnectFieldInput {
              connect: [SeriesConnectInput!]
              where: SeriesConnectWhere
            }

            type EpisodeSeriesConnection {
              aggregate: EpisodeSeriesSeriesAggregateSelection!
              edges: [EpisodeSeriesRelationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input EpisodeSeriesConnectionAggregateInput {
              AND: [EpisodeSeriesConnectionAggregateInput!]
              NOT: EpisodeSeriesConnectionAggregateInput
              OR: [EpisodeSeriesConnectionAggregateInput!]
              count: ConnectionAggregationCountFilterInput
              node: EpisodeSeriesNodeAggregationWhereInput
            }

            input EpisodeSeriesConnectionFilters {
              \\"\\"\\"
              Filter Episodes by aggregating results on related EpisodeSeriesConnections
              \\"\\"\\"
              aggregate: EpisodeSeriesConnectionAggregateInput
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
              episodeCount: IntScalarAggregationFilters
              episodeCount_AVERAGE_EQUAL: Float @deprecated(reason: \\"Please use the relevant generic filter 'episodeCount: { average: { eq: ... } } }' instead.\\")
              episodeCount_AVERAGE_GT: Float @deprecated(reason: \\"Please use the relevant generic filter 'episodeCount: { average: { gt: ... } } }' instead.\\")
              episodeCount_AVERAGE_GTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'episodeCount: { average: { gte: ... } } }' instead.\\")
              episodeCount_AVERAGE_LT: Float @deprecated(reason: \\"Please use the relevant generic filter 'episodeCount: { average: { lt: ... } } }' instead.\\")
              episodeCount_AVERAGE_LTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'episodeCount: { average: { lte: ... } } }' instead.\\")
              episodeCount_MAX_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'episodeCount: { max: { eq: ... } } }' instead.\\")
              episodeCount_MAX_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'episodeCount: { max: { gt: ... } } }' instead.\\")
              episodeCount_MAX_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'episodeCount: { max: { gte: ... } } }' instead.\\")
              episodeCount_MAX_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'episodeCount: { max: { lt: ... } } }' instead.\\")
              episodeCount_MAX_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'episodeCount: { max: { lte: ... } } }' instead.\\")
              episodeCount_MIN_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'episodeCount: { min: { eq: ... } } }' instead.\\")
              episodeCount_MIN_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'episodeCount: { min: { gt: ... } } }' instead.\\")
              episodeCount_MIN_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'episodeCount: { min: { gte: ... } } }' instead.\\")
              episodeCount_MIN_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'episodeCount: { min: { lt: ... } } }' instead.\\")
              episodeCount_MIN_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'episodeCount: { min: { lte: ... } } }' instead.\\")
              episodeCount_SUM_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'episodeCount: { sum: { eq: ... } } }' instead.\\")
              episodeCount_SUM_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'episodeCount: { sum: { gt: ... } } }' instead.\\")
              episodeCount_SUM_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'episodeCount: { sum: { gte: ... } } }' instead.\\")
              episodeCount_SUM_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'episodeCount: { sum: { lt: ... } } }' instead.\\")
              episodeCount_SUM_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'episodeCount: { sum: { lte: ... } } }' instead.\\")
              title: StringScalarAggregationFilters
              title_AVERAGE_LENGTH_EQUAL: Float @deprecated(reason: \\"Please use the relevant generic filter 'title: { averageLength: { eq: ... } } }' instead.\\")
              title_AVERAGE_LENGTH_GT: Float @deprecated(reason: \\"Please use the relevant generic filter 'title: { averageLength: { gt: ... } } }' instead.\\")
              title_AVERAGE_LENGTH_GTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'title: { averageLength: { gte: ... } } }' instead.\\")
              title_AVERAGE_LENGTH_LT: Float @deprecated(reason: \\"Please use the relevant generic filter 'title: { averageLength: { lt: ... } } }' instead.\\")
              title_AVERAGE_LENGTH_LTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'title: { averageLength: { lte: ... } } }' instead.\\")
              title_LONGEST_LENGTH_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { longestLength: { eq: ... } } }' instead.\\")
              title_LONGEST_LENGTH_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { longestLength: { gt: ... } } }' instead.\\")
              title_LONGEST_LENGTH_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { longestLength: { gte: ... } } }' instead.\\")
              title_LONGEST_LENGTH_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { longestLength: { lt: ... } } }' instead.\\")
              title_LONGEST_LENGTH_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { longestLength: { lte: ... } } }' instead.\\")
              title_SHORTEST_LENGTH_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { shortestLength: { eq: ... } } }' instead.\\")
              title_SHORTEST_LENGTH_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { shortestLength: { gt: ... } } }' instead.\\")
              title_SHORTEST_LENGTH_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { shortestLength: { gte: ... } } }' instead.\\")
              title_SHORTEST_LENGTH_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { shortestLength: { lt: ... } } }' instead.\\")
              title_SHORTEST_LENGTH_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { shortestLength: { lte: ... } } }' instead.\\")
            }

            type EpisodeSeriesRelationship {
              cursor: String!
              node: Series!
            }

            type EpisodeSeriesSeriesAggregateSelection {
              count: CountConnection!
              node: EpisodeSeriesSeriesNodeAggregateSelection
            }

            type EpisodeSeriesSeriesNodeAggregateSelection {
              episodeCount: IntAggregateSelection!
              title: StringAggregateSelection!
            }

            input EpisodeSeriesUpdateConnectionInput {
              node: SeriesUpdateInput
              where: EpisodeSeriesConnectionWhere
            }

            input EpisodeSeriesUpdateFieldInput {
              connect: [EpisodeSeriesConnectFieldInput!]
              create: [EpisodeSeriesCreateFieldInput!]
              delete: [EpisodeSeriesDeleteFieldInput!]
              disconnect: [EpisodeSeriesDisconnectFieldInput!]
              update: EpisodeSeriesUpdateConnectionInput
            }

            \\"\\"\\"
            Fields to sort Episodes by. The order in which sorts are applied is not guaranteed when specifying many fields in one EpisodeSort object.
            \\"\\"\\"
            input EpisodeSort {
              runtime: SortDirection
            }

            input EpisodeUpdateInput {
              runtime: IntScalarMutations
              runtime_DECREMENT: Int @deprecated(reason: \\"Please use the relevant generic mutation 'runtime: { decrement: ... } }' instead.\\")
              runtime_INCREMENT: Int @deprecated(reason: \\"Please use the relevant generic mutation 'runtime: { increment: ... } }' instead.\\")
              runtime_SET: Int @deprecated(reason: \\"Please use the generic mutation 'runtime: { set: ... } }' instead.\\")
              series: [EpisodeSeriesUpdateFieldInput!]
            }

            input EpisodeWhere {
              AND: [EpisodeWhere!]
              NOT: EpisodeWhere
              OR: [EpisodeWhere!]
              runtime: IntScalarFilters
              runtime_EQ: Int @deprecated(reason: \\"Please use the relevant generic filter runtime: { eq: ... }\\")
              runtime_GT: Int @deprecated(reason: \\"Please use the relevant generic filter runtime: { gt: ... }\\")
              runtime_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter runtime: { gte: ... }\\")
              runtime_IN: [Int!] @deprecated(reason: \\"Please use the relevant generic filter runtime: { in: ... }\\")
              runtime_LT: Int @deprecated(reason: \\"Please use the relevant generic filter runtime: { lt: ... }\\")
              runtime_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter runtime: { lte: ... }\\")
              series: SeriesRelationshipFilters
              seriesAggregate: EpisodeSeriesAggregateInput @deprecated(reason: \\"Aggregate filters are moved inside the seriesConnection filter, please use { seriesConnection: { aggregate: {...} } } instead\\")
              seriesConnection: EpisodeSeriesConnectionFilters
              \\"\\"\\"
              Return Episodes where all of the related EpisodeSeriesConnections match this filter
              \\"\\"\\"
              seriesConnection_ALL: EpisodeSeriesConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'seriesConnection: { all: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Episodes where none of the related EpisodeSeriesConnections match this filter
              \\"\\"\\"
              seriesConnection_NONE: EpisodeSeriesConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'seriesConnection: { none: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Episodes where one of the related EpisodeSeriesConnections match this filter
              \\"\\"\\"
              seriesConnection_SINGLE: EpisodeSeriesConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'seriesConnection: { single: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Episodes where some of the related EpisodeSeriesConnections match this filter
              \\"\\"\\"
              seriesConnection_SOME: EpisodeSeriesConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'seriesConnection: { some: { node: ... } } }' instead.\\")
              \\"\\"\\"Return Episodes where all of the related Series match this filter\\"\\"\\"
              series_ALL: SeriesWhere @deprecated(reason: \\"Please use the relevant generic filter 'series: { all: ... }' instead.\\")
              \\"\\"\\"Return Episodes where none of the related Series match this filter\\"\\"\\"
              series_NONE: SeriesWhere @deprecated(reason: \\"Please use the relevant generic filter 'series: { none: ... }' instead.\\")
              \\"\\"\\"Return Episodes where one of the related Series match this filter\\"\\"\\"
              series_SINGLE: SeriesWhere @deprecated(reason: \\"Please use the relevant generic filter 'series: {  single: ... }' instead.\\")
              \\"\\"\\"Return Episodes where some of the related Series match this filter\\"\\"\\"
              series_SOME: SeriesWhere @deprecated(reason: \\"Please use the relevant generic filter 'series: {  some: ... }' instead.\\")
            }

            type EpisodesConnection {
              aggregate: EpisodeAggregate!
              edges: [EpisodeEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            \\"\\"\\"Float filters\\"\\"\\"
            input FloatScalarFilters {
              eq: Float
              gt: Float
              gte: Float
              in: [Float!]
              lt: Float
              lte: Float
            }

            type IntAggregateSelection {
              average: Float
              max: Int
              min: Int
              sum: Int
            }

            \\"\\"\\"Filters for an aggregation of an int field\\"\\"\\"
            input IntScalarAggregationFilters {
              average: FloatScalarFilters
              max: IntScalarFilters
              min: IntScalarFilters
              sum: IntScalarFilters
            }

            \\"\\"\\"Int filters\\"\\"\\"
            input IntScalarFilters {
              eq: Int
              gt: Int
              gte: Int
              in: [Int!]
              lt: Int
              lte: Int
            }

            \\"\\"\\"Int mutations\\"\\"\\"
            input IntScalarMutations {
              add: Int
              set: Int
              subtract: Int
            }

            type Movie implements Production {
              actors(limit: Int, offset: Int, sort: [ActorSort!], where: ActorWhere): [Actor!]!
              actorsConnection(after: String, first: Int, sort: [ProductionActorsConnectionSort!], where: ProductionActorsConnectionWhere): ProductionActorsConnection!
              runtime: Int!
              title: String!
            }

            input MovieActorsAggregateInput {
              AND: [MovieActorsAggregateInput!]
              NOT: MovieActorsAggregateInput
              OR: [MovieActorsAggregateInput!]
              count: IntScalarFilters
              count_EQ: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { eq: ... } } }' instead.\\")
              count_GT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gt: ... } } }' instead.\\")
              count_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gte: ... } } }' instead.\\")
              count_LT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lt: ... } } }' instead.\\")
              count_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lte: ... } } }' instead.\\")
              edge: ActedInAggregationWhereInput
              node: MovieActorsNodeAggregationWhereInput
            }

            input MovieActorsConnectFieldInput {
              connect: [ActorConnectInput!]
              edge: ActedInCreateInput!
              where: ActorConnectWhere
            }

            input MovieActorsConnectionAggregateInput {
              AND: [MovieActorsConnectionAggregateInput!]
              NOT: MovieActorsConnectionAggregateInput
              OR: [MovieActorsConnectionAggregateInput!]
              count: ConnectionAggregationCountFilterInput
              edge: ActedInAggregationWhereInput
              node: MovieActorsNodeAggregationWhereInput
            }

            input MovieActorsConnectionFilters {
              \\"\\"\\"
              Filter Movies by aggregating results on related ProductionActorsConnections
              \\"\\"\\"
              aggregate: MovieActorsConnectionAggregateInput
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
              name: StringScalarAggregationFilters
              name_AVERAGE_LENGTH_EQUAL: Float @deprecated(reason: \\"Please use the relevant generic filter 'name: { averageLength: { eq: ... } } }' instead.\\")
              name_AVERAGE_LENGTH_GT: Float @deprecated(reason: \\"Please use the relevant generic filter 'name: { averageLength: { gt: ... } } }' instead.\\")
              name_AVERAGE_LENGTH_GTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'name: { averageLength: { gte: ... } } }' instead.\\")
              name_AVERAGE_LENGTH_LT: Float @deprecated(reason: \\"Please use the relevant generic filter 'name: { averageLength: { lt: ... } } }' instead.\\")
              name_AVERAGE_LENGTH_LTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'name: { averageLength: { lte: ... } } }' instead.\\")
              name_LONGEST_LENGTH_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'name: { longestLength: { eq: ... } } }' instead.\\")
              name_LONGEST_LENGTH_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'name: { longestLength: { gt: ... } } }' instead.\\")
              name_LONGEST_LENGTH_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'name: { longestLength: { gte: ... } } }' instead.\\")
              name_LONGEST_LENGTH_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'name: { longestLength: { lt: ... } } }' instead.\\")
              name_LONGEST_LENGTH_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'name: { longestLength: { lte: ... } } }' instead.\\")
              name_SHORTEST_LENGTH_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'name: { shortestLength: { eq: ... } } }' instead.\\")
              name_SHORTEST_LENGTH_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'name: { shortestLength: { gt: ... } } }' instead.\\")
              name_SHORTEST_LENGTH_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'name: { shortestLength: { gte: ... } } }' instead.\\")
              name_SHORTEST_LENGTH_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'name: { shortestLength: { lt: ... } } }' instead.\\")
              name_SHORTEST_LENGTH_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'name: { shortestLength: { lte: ... } } }' instead.\\")
            }

            input MovieActorsUpdateConnectionInput {
              edge: ActedInUpdateInput
              node: ActorUpdateInput
              where: ProductionActorsConnectionWhere
            }

            input MovieActorsUpdateFieldInput {
              connect: [MovieActorsConnectFieldInput!]
              create: [MovieActorsCreateFieldInput!]
              delete: [ProductionActorsDeleteFieldInput!]
              disconnect: [ProductionActorsDisconnectFieldInput!]
              update: MovieActorsUpdateConnectionInput
            }

            type MovieAggregate {
              count: Count!
              node: MovieAggregateNode!
            }

            type MovieAggregateNode {
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
              runtime: IntScalarMutations
              runtime_DECREMENT: Int @deprecated(reason: \\"Please use the relevant generic mutation 'runtime: { decrement: ... } }' instead.\\")
              runtime_INCREMENT: Int @deprecated(reason: \\"Please use the relevant generic mutation 'runtime: { increment: ... } }' instead.\\")
              runtime_SET: Int @deprecated(reason: \\"Please use the generic mutation 'runtime: { set: ... } }' instead.\\")
              title: StringScalarMutations
              title_SET: String @deprecated(reason: \\"Please use the generic mutation 'title: { set: ... } }' instead.\\")
            }

            input MovieWhere {
              AND: [MovieWhere!]
              NOT: MovieWhere
              OR: [MovieWhere!]
              actors: ActorRelationshipFilters
              actorsAggregate: MovieActorsAggregateInput @deprecated(reason: \\"Aggregate filters are moved inside the actorsConnection filter, please use { actorsConnection: { aggregate: {...} } } instead\\")
              actorsConnection: MovieActorsConnectionFilters
              \\"\\"\\"
              Return Movies where all of the related ProductionActorsConnections match this filter
              \\"\\"\\"
              actorsConnection_ALL: ProductionActorsConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actorsConnection: { all: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Movies where none of the related ProductionActorsConnections match this filter
              \\"\\"\\"
              actorsConnection_NONE: ProductionActorsConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actorsConnection: { none: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Movies where one of the related ProductionActorsConnections match this filter
              \\"\\"\\"
              actorsConnection_SINGLE: ProductionActorsConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actorsConnection: { single: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Movies where some of the related ProductionActorsConnections match this filter
              \\"\\"\\"
              actorsConnection_SOME: ProductionActorsConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actorsConnection: { some: { node: ... } } }' instead.\\")
              \\"\\"\\"Return Movies where all of the related Actors match this filter\\"\\"\\"
              actors_ALL: ActorWhere @deprecated(reason: \\"Please use the relevant generic filter 'actors: { all: ... }' instead.\\")
              \\"\\"\\"Return Movies where none of the related Actors match this filter\\"\\"\\"
              actors_NONE: ActorWhere @deprecated(reason: \\"Please use the relevant generic filter 'actors: { none: ... }' instead.\\")
              \\"\\"\\"Return Movies where one of the related Actors match this filter\\"\\"\\"
              actors_SINGLE: ActorWhere @deprecated(reason: \\"Please use the relevant generic filter 'actors: {  single: ... }' instead.\\")
              \\"\\"\\"Return Movies where some of the related Actors match this filter\\"\\"\\"
              actors_SOME: ActorWhere @deprecated(reason: \\"Please use the relevant generic filter 'actors: {  some: ... }' instead.\\")
              runtime: IntScalarFilters
              runtime_EQ: Int @deprecated(reason: \\"Please use the relevant generic filter runtime: { eq: ... }\\")
              runtime_GT: Int @deprecated(reason: \\"Please use the relevant generic filter runtime: { gt: ... }\\")
              runtime_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter runtime: { gte: ... }\\")
              runtime_IN: [Int!] @deprecated(reason: \\"Please use the relevant generic filter runtime: { in: ... }\\")
              runtime_LT: Int @deprecated(reason: \\"Please use the relevant generic filter runtime: { lt: ... }\\")
              runtime_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter runtime: { lte: ... }\\")
              title: StringScalarFilters
              title_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter title: { contains: ... }\\")
              title_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter title: { endsWith: ... }\\")
              title_EQ: String @deprecated(reason: \\"Please use the relevant generic filter title: { eq: ... }\\")
              title_IN: [String!] @deprecated(reason: \\"Please use the relevant generic filter title: { in: ... }\\")
              title_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter title: { startsWith: ... }\\")
            }

            type MoviesConnection {
              aggregate: MovieAggregate!
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
              count: IntScalarFilters
              count_EQ: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { eq: ... } } }' instead.\\")
              count_GT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gt: ... } } }' instead.\\")
              count_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gte: ... } } }' instead.\\")
              count_LT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lt: ... } } }' instead.\\")
              count_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lte: ... } } }' instead.\\")
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

            input ProductionActorsConnectionAggregateInput {
              AND: [ProductionActorsConnectionAggregateInput!]
              NOT: ProductionActorsConnectionAggregateInput
              OR: [ProductionActorsConnectionAggregateInput!]
              count: ConnectionAggregationCountFilterInput
              edge: ProductionActorsEdgeAggregationWhereInput
              node: ProductionActorsNodeAggregationWhereInput
            }

            input ProductionActorsConnectionFilters {
              \\"\\"\\"
              Filter Productions by aggregating results on related ProductionActorsConnections
              \\"\\"\\"
              aggregate: ProductionActorsConnectionAggregateInput
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
              name: StringScalarAggregationFilters
              name_AVERAGE_LENGTH_EQUAL: Float @deprecated(reason: \\"Please use the relevant generic filter 'name: { averageLength: { eq: ... } } }' instead.\\")
              name_AVERAGE_LENGTH_GT: Float @deprecated(reason: \\"Please use the relevant generic filter 'name: { averageLength: { gt: ... } } }' instead.\\")
              name_AVERAGE_LENGTH_GTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'name: { averageLength: { gte: ... } } }' instead.\\")
              name_AVERAGE_LENGTH_LT: Float @deprecated(reason: \\"Please use the relevant generic filter 'name: { averageLength: { lt: ... } } }' instead.\\")
              name_AVERAGE_LENGTH_LTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'name: { averageLength: { lte: ... } } }' instead.\\")
              name_LONGEST_LENGTH_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'name: { longestLength: { eq: ... } } }' instead.\\")
              name_LONGEST_LENGTH_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'name: { longestLength: { gt: ... } } }' instead.\\")
              name_LONGEST_LENGTH_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'name: { longestLength: { gte: ... } } }' instead.\\")
              name_LONGEST_LENGTH_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'name: { longestLength: { lt: ... } } }' instead.\\")
              name_LONGEST_LENGTH_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'name: { longestLength: { lte: ... } } }' instead.\\")
              name_SHORTEST_LENGTH_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'name: { shortestLength: { eq: ... } } }' instead.\\")
              name_SHORTEST_LENGTH_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'name: { shortestLength: { gt: ... } } }' instead.\\")
              name_SHORTEST_LENGTH_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'name: { shortestLength: { gte: ... } } }' instead.\\")
              name_SHORTEST_LENGTH_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'name: { shortestLength: { lt: ... } } }' instead.\\")
              name_SHORTEST_LENGTH_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'name: { shortestLength: { lte: ... } } }' instead.\\")
            }

            type ProductionActorsRelationship {
              cursor: String!
              node: Actor!
              properties: ProductionActorsRelationshipProperties!
            }

            union ProductionActorsRelationshipProperties = ActedIn

            input ProductionActorsUpdateConnectionInput {
              edge: ProductionActorsEdgeUpdateInput
              node: ActorUpdateInput
              where: ProductionActorsConnectionWhere
            }

            input ProductionActorsUpdateFieldInput {
              connect: [ProductionActorsConnectFieldInput!]
              create: [ProductionActorsCreateFieldInput!]
              delete: [ProductionActorsDeleteFieldInput!]
              disconnect: [ProductionActorsDisconnectFieldInput!]
              update: ProductionActorsUpdateConnectionInput
            }

            type ProductionAggregate {
              count: Count!
              node: ProductionAggregateNode!
            }

            type ProductionAggregateNode {
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

            input ProductionRelationshipFilters {
              \\"\\"\\"Filter type where all of the related Productions match this filter\\"\\"\\"
              all: ProductionWhere
              \\"\\"\\"Filter type where none of the related Productions match this filter\\"\\"\\"
              none: ProductionWhere
              \\"\\"\\"Filter type where one of the related Productions match this filter\\"\\"\\"
              single: ProductionWhere
              \\"\\"\\"Filter type where some of the related Productions match this filter\\"\\"\\"
              some: ProductionWhere
            }

            \\"\\"\\"
            Fields to sort Productions by. The order in which sorts are applied is not guaranteed when specifying many fields in one ProductionSort object.
            \\"\\"\\"
            input ProductionSort {
              title: SortDirection
            }

            input ProductionUpdateInput {
              actors: [ProductionActorsUpdateFieldInput!]
              title: StringScalarMutations
              title_SET: String @deprecated(reason: \\"Please use the generic mutation 'title: { set: ... } }' instead.\\")
            }

            input ProductionWhere {
              AND: [ProductionWhere!]
              NOT: ProductionWhere
              OR: [ProductionWhere!]
              actors: ActorRelationshipFilters
              actorsAggregate: ProductionActorsAggregateInput @deprecated(reason: \\"Aggregate filters are moved inside the actorsConnection filter, please use { actorsConnection: { aggregate: {...} } } instead\\")
              actorsConnection: ProductionActorsConnectionFilters
              \\"\\"\\"
              Return Productions where all of the related ProductionActorsConnections match this filter
              \\"\\"\\"
              actorsConnection_ALL: ProductionActorsConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actorsConnection: { all: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Productions where none of the related ProductionActorsConnections match this filter
              \\"\\"\\"
              actorsConnection_NONE: ProductionActorsConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actorsConnection: { none: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Productions where one of the related ProductionActorsConnections match this filter
              \\"\\"\\"
              actorsConnection_SINGLE: ProductionActorsConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actorsConnection: { single: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Productions where some of the related ProductionActorsConnections match this filter
              \\"\\"\\"
              actorsConnection_SOME: ProductionActorsConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actorsConnection: { some: { node: ... } } }' instead.\\")
              \\"\\"\\"Return Productions where all of the related Actors match this filter\\"\\"\\"
              actors_ALL: ActorWhere @deprecated(reason: \\"Please use the relevant generic filter 'actors: { all: ... }' instead.\\")
              \\"\\"\\"Return Productions where none of the related Actors match this filter\\"\\"\\"
              actors_NONE: ActorWhere @deprecated(reason: \\"Please use the relevant generic filter 'actors: { none: ... }' instead.\\")
              \\"\\"\\"Return Productions where one of the related Actors match this filter\\"\\"\\"
              actors_SINGLE: ActorWhere @deprecated(reason: \\"Please use the relevant generic filter 'actors: {  single: ... }' instead.\\")
              \\"\\"\\"Return Productions where some of the related Actors match this filter\\"\\"\\"
              actors_SOME: ActorWhere @deprecated(reason: \\"Please use the relevant generic filter 'actors: {  some: ... }' instead.\\")
              title: StringScalarFilters
              title_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter title: { contains: ... }\\")
              title_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter title: { endsWith: ... }\\")
              title_EQ: String @deprecated(reason: \\"Please use the relevant generic filter title: { eq: ... }\\")
              title_IN: [String!] @deprecated(reason: \\"Please use the relevant generic filter title: { in: ... }\\")
              title_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter title: { startsWith: ... }\\")
              typename: [ProductionImplementation!]
            }

            type ProductionsConnection {
              aggregate: ProductionAggregate!
              edges: [ProductionEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            type Query {
              actors(limit: Int, offset: Int, sort: [ActorSort!], where: ActorWhere): [Actor!]!
              actorsConnection(after: String, first: Int, sort: [ActorSort!], where: ActorWhere): ActorsConnection!
              episodes(limit: Int, offset: Int, sort: [EpisodeSort!], where: EpisodeWhere): [Episode!]!
              episodesConnection(after: String, first: Int, sort: [EpisodeSort!], where: EpisodeWhere): EpisodesConnection!
              movies(limit: Int, offset: Int, sort: [MovieSort!], where: MovieWhere): [Movie!]!
              moviesConnection(after: String, first: Int, sort: [MovieSort!], where: MovieWhere): MoviesConnection!
              productions(limit: Int, offset: Int, sort: [ProductionSort!], where: ProductionWhere): [Production!]!
              productionsConnection(after: String, first: Int, sort: [ProductionSort!], where: ProductionWhere): ProductionsConnection!
              series(limit: Int, offset: Int, sort: [SeriesSort!], where: SeriesWhere): [Series!]!
              seriesConnection(after: String, first: Int, sort: [SeriesSort!], where: SeriesWhere): SeriesConnection!
            }

            type Series implements Production {
              actors(limit: Int, offset: Int, sort: [ActorSort!], where: ActorWhere): [Actor!]!
              actorsConnection(after: String, first: Int, sort: [ProductionActorsConnectionSort!], where: ProductionActorsConnectionWhere): ProductionActorsConnection!
              episodeCount: Int!
              episodes(limit: Int, offset: Int, sort: [EpisodeSort!], where: EpisodeWhere): [Episode!]!
              episodesConnection(after: String, first: Int, sort: [SeriesEpisodesConnectionSort!], where: SeriesEpisodesConnectionWhere): SeriesEpisodesConnection!
              title: String!
            }

            input SeriesActorsAggregateInput {
              AND: [SeriesActorsAggregateInput!]
              NOT: SeriesActorsAggregateInput
              OR: [SeriesActorsAggregateInput!]
              count: IntScalarFilters
              count_EQ: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { eq: ... } } }' instead.\\")
              count_GT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gt: ... } } }' instead.\\")
              count_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gte: ... } } }' instead.\\")
              count_LT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lt: ... } } }' instead.\\")
              count_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lte: ... } } }' instead.\\")
              edge: ActedInAggregationWhereInput
              node: SeriesActorsNodeAggregationWhereInput
            }

            input SeriesActorsConnectFieldInput {
              connect: [ActorConnectInput!]
              edge: ActedInCreateInput!
              where: ActorConnectWhere
            }

            input SeriesActorsConnectionAggregateInput {
              AND: [SeriesActorsConnectionAggregateInput!]
              NOT: SeriesActorsConnectionAggregateInput
              OR: [SeriesActorsConnectionAggregateInput!]
              count: ConnectionAggregationCountFilterInput
              edge: ActedInAggregationWhereInput
              node: SeriesActorsNodeAggregationWhereInput
            }

            input SeriesActorsConnectionFilters {
              \\"\\"\\"
              Filter Series by aggregating results on related ProductionActorsConnections
              \\"\\"\\"
              aggregate: SeriesActorsConnectionAggregateInput
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
              name: StringScalarAggregationFilters
              name_AVERAGE_LENGTH_EQUAL: Float @deprecated(reason: \\"Please use the relevant generic filter 'name: { averageLength: { eq: ... } } }' instead.\\")
              name_AVERAGE_LENGTH_GT: Float @deprecated(reason: \\"Please use the relevant generic filter 'name: { averageLength: { gt: ... } } }' instead.\\")
              name_AVERAGE_LENGTH_GTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'name: { averageLength: { gte: ... } } }' instead.\\")
              name_AVERAGE_LENGTH_LT: Float @deprecated(reason: \\"Please use the relevant generic filter 'name: { averageLength: { lt: ... } } }' instead.\\")
              name_AVERAGE_LENGTH_LTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'name: { averageLength: { lte: ... } } }' instead.\\")
              name_LONGEST_LENGTH_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'name: { longestLength: { eq: ... } } }' instead.\\")
              name_LONGEST_LENGTH_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'name: { longestLength: { gt: ... } } }' instead.\\")
              name_LONGEST_LENGTH_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'name: { longestLength: { gte: ... } } }' instead.\\")
              name_LONGEST_LENGTH_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'name: { longestLength: { lt: ... } } }' instead.\\")
              name_LONGEST_LENGTH_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'name: { longestLength: { lte: ... } } }' instead.\\")
              name_SHORTEST_LENGTH_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'name: { shortestLength: { eq: ... } } }' instead.\\")
              name_SHORTEST_LENGTH_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'name: { shortestLength: { gt: ... } } }' instead.\\")
              name_SHORTEST_LENGTH_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'name: { shortestLength: { gte: ... } } }' instead.\\")
              name_SHORTEST_LENGTH_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'name: { shortestLength: { lt: ... } } }' instead.\\")
              name_SHORTEST_LENGTH_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'name: { shortestLength: { lte: ... } } }' instead.\\")
            }

            input SeriesActorsUpdateConnectionInput {
              edge: ActedInUpdateInput
              node: ActorUpdateInput
              where: ProductionActorsConnectionWhere
            }

            input SeriesActorsUpdateFieldInput {
              connect: [SeriesActorsConnectFieldInput!]
              create: [SeriesActorsCreateFieldInput!]
              delete: [ProductionActorsDeleteFieldInput!]
              disconnect: [ProductionActorsDisconnectFieldInput!]
              update: SeriesActorsUpdateConnectionInput
            }

            type SeriesAggregate {
              count: Count!
              node: SeriesAggregateNode!
            }

            type SeriesAggregateNode {
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
              aggregate: SeriesAggregate!
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

            type SeriesEpisodeEpisodesAggregateSelection {
              count: CountConnection!
              node: SeriesEpisodeEpisodesNodeAggregateSelection
            }

            type SeriesEpisodeEpisodesNodeAggregateSelection {
              runtime: IntAggregateSelection!
            }

            input SeriesEpisodesAggregateInput {
              AND: [SeriesEpisodesAggregateInput!]
              NOT: SeriesEpisodesAggregateInput
              OR: [SeriesEpisodesAggregateInput!]
              count: IntScalarFilters
              count_EQ: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { eq: ... } } }' instead.\\")
              count_GT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gt: ... } } }' instead.\\")
              count_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gte: ... } } }' instead.\\")
              count_LT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lt: ... } } }' instead.\\")
              count_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lte: ... } } }' instead.\\")
              node: SeriesEpisodesNodeAggregationWhereInput
            }

            input SeriesEpisodesConnectFieldInput {
              connect: [EpisodeConnectInput!]
              where: EpisodeConnectWhere
            }

            type SeriesEpisodesConnection {
              aggregate: SeriesEpisodeEpisodesAggregateSelection!
              edges: [SeriesEpisodesRelationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input SeriesEpisodesConnectionAggregateInput {
              AND: [SeriesEpisodesConnectionAggregateInput!]
              NOT: SeriesEpisodesConnectionAggregateInput
              OR: [SeriesEpisodesConnectionAggregateInput!]
              count: ConnectionAggregationCountFilterInput
              node: SeriesEpisodesNodeAggregationWhereInput
            }

            input SeriesEpisodesConnectionFilters {
              \\"\\"\\"
              Filter Series by aggregating results on related SeriesEpisodesConnections
              \\"\\"\\"
              aggregate: SeriesEpisodesConnectionAggregateInput
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
              runtime: IntScalarAggregationFilters
              runtime_AVERAGE_EQUAL: Float @deprecated(reason: \\"Please use the relevant generic filter 'runtime: { average: { eq: ... } } }' instead.\\")
              runtime_AVERAGE_GT: Float @deprecated(reason: \\"Please use the relevant generic filter 'runtime: { average: { gt: ... } } }' instead.\\")
              runtime_AVERAGE_GTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'runtime: { average: { gte: ... } } }' instead.\\")
              runtime_AVERAGE_LT: Float @deprecated(reason: \\"Please use the relevant generic filter 'runtime: { average: { lt: ... } } }' instead.\\")
              runtime_AVERAGE_LTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'runtime: { average: { lte: ... } } }' instead.\\")
              runtime_MAX_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'runtime: { max: { eq: ... } } }' instead.\\")
              runtime_MAX_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'runtime: { max: { gt: ... } } }' instead.\\")
              runtime_MAX_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'runtime: { max: { gte: ... } } }' instead.\\")
              runtime_MAX_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'runtime: { max: { lt: ... } } }' instead.\\")
              runtime_MAX_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'runtime: { max: { lte: ... } } }' instead.\\")
              runtime_MIN_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'runtime: { min: { eq: ... } } }' instead.\\")
              runtime_MIN_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'runtime: { min: { gt: ... } } }' instead.\\")
              runtime_MIN_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'runtime: { min: { gte: ... } } }' instead.\\")
              runtime_MIN_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'runtime: { min: { lt: ... } } }' instead.\\")
              runtime_MIN_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'runtime: { min: { lte: ... } } }' instead.\\")
              runtime_SUM_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'runtime: { sum: { eq: ... } } }' instead.\\")
              runtime_SUM_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'runtime: { sum: { gt: ... } } }' instead.\\")
              runtime_SUM_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'runtime: { sum: { gte: ... } } }' instead.\\")
              runtime_SUM_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'runtime: { sum: { lt: ... } } }' instead.\\")
              runtime_SUM_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'runtime: { sum: { lte: ... } } }' instead.\\")
            }

            type SeriesEpisodesRelationship {
              cursor: String!
              node: Episode!
            }

            input SeriesEpisodesUpdateConnectionInput {
              node: EpisodeUpdateInput
              where: SeriesEpisodesConnectionWhere
            }

            input SeriesEpisodesUpdateFieldInput {
              connect: [SeriesEpisodesConnectFieldInput!]
              create: [SeriesEpisodesCreateFieldInput!]
              delete: [SeriesEpisodesDeleteFieldInput!]
              disconnect: [SeriesEpisodesDisconnectFieldInput!]
              update: SeriesEpisodesUpdateConnectionInput
            }

            input SeriesRelationshipFilters {
              \\"\\"\\"Filter type where all of the related Series match this filter\\"\\"\\"
              all: SeriesWhere
              \\"\\"\\"Filter type where none of the related Series match this filter\\"\\"\\"
              none: SeriesWhere
              \\"\\"\\"Filter type where one of the related Series match this filter\\"\\"\\"
              single: SeriesWhere
              \\"\\"\\"Filter type where some of the related Series match this filter\\"\\"\\"
              some: SeriesWhere
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
              episodeCount: IntScalarMutations
              episodeCount_DECREMENT: Int @deprecated(reason: \\"Please use the relevant generic mutation 'episodeCount: { decrement: ... } }' instead.\\")
              episodeCount_INCREMENT: Int @deprecated(reason: \\"Please use the relevant generic mutation 'episodeCount: { increment: ... } }' instead.\\")
              episodeCount_SET: Int @deprecated(reason: \\"Please use the generic mutation 'episodeCount: { set: ... } }' instead.\\")
              episodes: [SeriesEpisodesUpdateFieldInput!]
              title: StringScalarMutations
              title_SET: String @deprecated(reason: \\"Please use the generic mutation 'title: { set: ... } }' instead.\\")
            }

            input SeriesWhere {
              AND: [SeriesWhere!]
              NOT: SeriesWhere
              OR: [SeriesWhere!]
              actors: ActorRelationshipFilters
              actorsAggregate: SeriesActorsAggregateInput @deprecated(reason: \\"Aggregate filters are moved inside the actorsConnection filter, please use { actorsConnection: { aggregate: {...} } } instead\\")
              actorsConnection: SeriesActorsConnectionFilters
              \\"\\"\\"
              Return Series where all of the related ProductionActorsConnections match this filter
              \\"\\"\\"
              actorsConnection_ALL: ProductionActorsConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actorsConnection: { all: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Series where none of the related ProductionActorsConnections match this filter
              \\"\\"\\"
              actorsConnection_NONE: ProductionActorsConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actorsConnection: { none: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Series where one of the related ProductionActorsConnections match this filter
              \\"\\"\\"
              actorsConnection_SINGLE: ProductionActorsConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actorsConnection: { single: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Series where some of the related ProductionActorsConnections match this filter
              \\"\\"\\"
              actorsConnection_SOME: ProductionActorsConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actorsConnection: { some: { node: ... } } }' instead.\\")
              \\"\\"\\"Return Series where all of the related Actors match this filter\\"\\"\\"
              actors_ALL: ActorWhere @deprecated(reason: \\"Please use the relevant generic filter 'actors: { all: ... }' instead.\\")
              \\"\\"\\"Return Series where none of the related Actors match this filter\\"\\"\\"
              actors_NONE: ActorWhere @deprecated(reason: \\"Please use the relevant generic filter 'actors: { none: ... }' instead.\\")
              \\"\\"\\"Return Series where one of the related Actors match this filter\\"\\"\\"
              actors_SINGLE: ActorWhere @deprecated(reason: \\"Please use the relevant generic filter 'actors: {  single: ... }' instead.\\")
              \\"\\"\\"Return Series where some of the related Actors match this filter\\"\\"\\"
              actors_SOME: ActorWhere @deprecated(reason: \\"Please use the relevant generic filter 'actors: {  some: ... }' instead.\\")
              episodeCount: IntScalarFilters
              episodeCount_EQ: Int @deprecated(reason: \\"Please use the relevant generic filter episodeCount: { eq: ... }\\")
              episodeCount_GT: Int @deprecated(reason: \\"Please use the relevant generic filter episodeCount: { gt: ... }\\")
              episodeCount_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter episodeCount: { gte: ... }\\")
              episodeCount_IN: [Int!] @deprecated(reason: \\"Please use the relevant generic filter episodeCount: { in: ... }\\")
              episodeCount_LT: Int @deprecated(reason: \\"Please use the relevant generic filter episodeCount: { lt: ... }\\")
              episodeCount_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter episodeCount: { lte: ... }\\")
              episodes: EpisodeRelationshipFilters
              episodesAggregate: SeriesEpisodesAggregateInput @deprecated(reason: \\"Aggregate filters are moved inside the episodesConnection filter, please use { episodesConnection: { aggregate: {...} } } instead\\")
              episodesConnection: SeriesEpisodesConnectionFilters
              \\"\\"\\"
              Return Series where all of the related SeriesEpisodesConnections match this filter
              \\"\\"\\"
              episodesConnection_ALL: SeriesEpisodesConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'episodesConnection: { all: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Series where none of the related SeriesEpisodesConnections match this filter
              \\"\\"\\"
              episodesConnection_NONE: SeriesEpisodesConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'episodesConnection: { none: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Series where one of the related SeriesEpisodesConnections match this filter
              \\"\\"\\"
              episodesConnection_SINGLE: SeriesEpisodesConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'episodesConnection: { single: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Series where some of the related SeriesEpisodesConnections match this filter
              \\"\\"\\"
              episodesConnection_SOME: SeriesEpisodesConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'episodesConnection: { some: { node: ... } } }' instead.\\")
              \\"\\"\\"Return Series where all of the related Episodes match this filter\\"\\"\\"
              episodes_ALL: EpisodeWhere @deprecated(reason: \\"Please use the relevant generic filter 'episodes: { all: ... }' instead.\\")
              \\"\\"\\"Return Series where none of the related Episodes match this filter\\"\\"\\"
              episodes_NONE: EpisodeWhere @deprecated(reason: \\"Please use the relevant generic filter 'episodes: { none: ... }' instead.\\")
              \\"\\"\\"Return Series where one of the related Episodes match this filter\\"\\"\\"
              episodes_SINGLE: EpisodeWhere @deprecated(reason: \\"Please use the relevant generic filter 'episodes: {  single: ... }' instead.\\")
              \\"\\"\\"Return Series where some of the related Episodes match this filter\\"\\"\\"
              episodes_SOME: EpisodeWhere @deprecated(reason: \\"Please use the relevant generic filter 'episodes: {  some: ... }' instead.\\")
              title: StringScalarFilters
              title_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter title: { contains: ... }\\")
              title_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter title: { endsWith: ... }\\")
              title_EQ: String @deprecated(reason: \\"Please use the relevant generic filter title: { eq: ... }\\")
              title_IN: [String!] @deprecated(reason: \\"Please use the relevant generic filter title: { in: ... }\\")
              title_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter title: { startsWith: ... }\\")
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

            \\"\\"\\"Filters for an aggregation of a string field\\"\\"\\"
            input StringScalarAggregationFilters {
              averageLength: FloatScalarFilters
              longestLength: IntScalarFilters
              shortestLength: IntScalarFilters
            }

            \\"\\"\\"String filters\\"\\"\\"
            input StringScalarFilters {
              contains: String
              endsWith: String
              eq: String
              in: [String!]
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
              screenTime: IntScalarAggregationFilters
              screenTime_AVERAGE_EQUAL: Float @deprecated(reason: \\"Please use the relevant generic filter 'screenTime: { average: { eq: ... } } }' instead.\\")
              screenTime_AVERAGE_GT: Float @deprecated(reason: \\"Please use the relevant generic filter 'screenTime: { average: { gt: ... } } }' instead.\\")
              screenTime_AVERAGE_GTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'screenTime: { average: { gte: ... } } }' instead.\\")
              screenTime_AVERAGE_LT: Float @deprecated(reason: \\"Please use the relevant generic filter 'screenTime: { average: { lt: ... } } }' instead.\\")
              screenTime_AVERAGE_LTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'screenTime: { average: { lte: ... } } }' instead.\\")
              screenTime_MAX_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'screenTime: { max: { eq: ... } } }' instead.\\")
              screenTime_MAX_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'screenTime: { max: { gt: ... } } }' instead.\\")
              screenTime_MAX_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'screenTime: { max: { gte: ... } } }' instead.\\")
              screenTime_MAX_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'screenTime: { max: { lt: ... } } }' instead.\\")
              screenTime_MAX_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'screenTime: { max: { lte: ... } } }' instead.\\")
              screenTime_MIN_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'screenTime: { min: { eq: ... } } }' instead.\\")
              screenTime_MIN_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'screenTime: { min: { gt: ... } } }' instead.\\")
              screenTime_MIN_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'screenTime: { min: { gte: ... } } }' instead.\\")
              screenTime_MIN_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'screenTime: { min: { lt: ... } } }' instead.\\")
              screenTime_MIN_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'screenTime: { min: { lte: ... } } }' instead.\\")
              screenTime_SUM_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'screenTime: { sum: { eq: ... } } }' instead.\\")
              screenTime_SUM_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'screenTime: { sum: { gt: ... } } }' instead.\\")
              screenTime_SUM_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'screenTime: { sum: { gte: ... } } }' instead.\\")
              screenTime_SUM_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'screenTime: { sum: { lt: ... } } }' instead.\\")
              screenTime_SUM_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'screenTime: { sum: { lte: ... } } }' instead.\\")
            }

            input ActedInCreateInput {
              screenTime: Int!
            }

            input ActedInSort {
              screenTime: SortDirection
            }

            input ActedInUpdateInput {
              screenTime: IntScalarMutations
              screenTime_DECREMENT: Int @deprecated(reason: \\"Please use the relevant generic mutation 'screenTime: { decrement: ... } }' instead.\\")
              screenTime_INCREMENT: Int @deprecated(reason: \\"Please use the relevant generic mutation 'screenTime: { increment: ... } }' instead.\\")
              screenTime_SET: Int @deprecated(reason: \\"Please use the generic mutation 'screenTime: { set: ... } }' instead.\\")
            }

            input ActedInWhere {
              AND: [ActedInWhere!]
              NOT: ActedInWhere
              OR: [ActedInWhere!]
              screenTime: IntScalarFilters
              screenTime_EQ: Int @deprecated(reason: \\"Please use the relevant generic filter screenTime: { eq: ... }\\")
              screenTime_GT: Int @deprecated(reason: \\"Please use the relevant generic filter screenTime: { gt: ... }\\")
              screenTime_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter screenTime: { gte: ... }\\")
              screenTime_IN: [Int!] @deprecated(reason: \\"Please use the relevant generic filter screenTime: { in: ... }\\")
              screenTime_LT: Int @deprecated(reason: \\"Please use the relevant generic filter screenTime: { lt: ... }\\")
              screenTime_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter screenTime: { lte: ... }\\")
            }

            type Actor {
              actedIn(limit: Int, offset: Int, sort: [ProductionSort!], where: ProductionWhere): [Production!]!
              actedInConnection(after: String, first: Int, sort: [ActorActedInConnectionSort!], where: ActorActedInConnectionWhere): ActorActedInConnection!
              name: String!
            }

            input ActorActedInAggregateInput {
              AND: [ActorActedInAggregateInput!]
              NOT: ActorActedInAggregateInput
              OR: [ActorActedInAggregateInput!]
              count: IntScalarFilters
              count_EQ: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { eq: ... } } }' instead.\\")
              count_GT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gt: ... } } }' instead.\\")
              count_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gte: ... } } }' instead.\\")
              count_LT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lt: ... } } }' instead.\\")
              count_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lte: ... } } }' instead.\\")
              edge: ActedInAggregationWhereInput
              node: ActorActedInNodeAggregationWhereInput
            }

            input ActorActedInConnectFieldInput {
              connect: ProductionConnectInput
              edge: ActedInCreateInput!
              where: ProductionConnectWhere
            }

            type ActorActedInConnection {
              aggregate: ActorProductionActedInAggregateSelection!
              edges: [ActorActedInRelationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input ActorActedInConnectionAggregateInput {
              AND: [ActorActedInConnectionAggregateInput!]
              NOT: ActorActedInConnectionAggregateInput
              OR: [ActorActedInConnectionAggregateInput!]
              count: ConnectionAggregationCountFilterInput
              edge: ActedInAggregationWhereInput
              node: ActorActedInNodeAggregationWhereInput
            }

            input ActorActedInConnectionFilters {
              \\"\\"\\"
              Filter Actors by aggregating results on related ActorActedInConnections
              \\"\\"\\"
              aggregate: ActorActedInConnectionAggregateInput
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
              title: StringScalarAggregationFilters
              title_AVERAGE_LENGTH_EQUAL: Float @deprecated(reason: \\"Please use the relevant generic filter 'title: { averageLength: { eq: ... } } }' instead.\\")
              title_AVERAGE_LENGTH_GT: Float @deprecated(reason: \\"Please use the relevant generic filter 'title: { averageLength: { gt: ... } } }' instead.\\")
              title_AVERAGE_LENGTH_GTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'title: { averageLength: { gte: ... } } }' instead.\\")
              title_AVERAGE_LENGTH_LT: Float @deprecated(reason: \\"Please use the relevant generic filter 'title: { averageLength: { lt: ... } } }' instead.\\")
              title_AVERAGE_LENGTH_LTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'title: { averageLength: { lte: ... } } }' instead.\\")
              title_LONGEST_LENGTH_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { longestLength: { eq: ... } } }' instead.\\")
              title_LONGEST_LENGTH_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { longestLength: { gt: ... } } }' instead.\\")
              title_LONGEST_LENGTH_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { longestLength: { gte: ... } } }' instead.\\")
              title_LONGEST_LENGTH_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { longestLength: { lt: ... } } }' instead.\\")
              title_LONGEST_LENGTH_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { longestLength: { lte: ... } } }' instead.\\")
              title_SHORTEST_LENGTH_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { shortestLength: { eq: ... } } }' instead.\\")
              title_SHORTEST_LENGTH_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { shortestLength: { gt: ... } } }' instead.\\")
              title_SHORTEST_LENGTH_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { shortestLength: { gte: ... } } }' instead.\\")
              title_SHORTEST_LENGTH_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { shortestLength: { lt: ... } } }' instead.\\")
              title_SHORTEST_LENGTH_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { shortestLength: { lte: ... } } }' instead.\\")
            }

            type ActorActedInRelationship {
              cursor: String!
              node: Production!
              properties: ActedIn!
            }

            input ActorActedInUpdateConnectionInput {
              edge: ActedInUpdateInput
              node: ProductionUpdateInput
              where: ActorActedInConnectionWhere
            }

            input ActorActedInUpdateFieldInput {
              connect: [ActorActedInConnectFieldInput!]
              create: [ActorActedInCreateFieldInput!]
              delete: [ActorActedInDeleteFieldInput!]
              disconnect: [ActorActedInDisconnectFieldInput!]
              update: ActorActedInUpdateConnectionInput
            }

            type ActorAggregate {
              count: Count!
              node: ActorAggregateNode!
            }

            type ActorAggregateNode {
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

            type ActorProductionActedInAggregateSelection {
              count: CountConnection!
              edge: ActorProductionActedInEdgeAggregateSelection
              node: ActorProductionActedInNodeAggregateSelection
            }

            type ActorProductionActedInEdgeAggregateSelection {
              screenTime: IntAggregateSelection!
            }

            type ActorProductionActedInNodeAggregateSelection {
              title: StringAggregateSelection!
            }

            input ActorRelationshipFilters {
              \\"\\"\\"Filter type where all of the related Actors match this filter\\"\\"\\"
              all: ActorWhere
              \\"\\"\\"Filter type where none of the related Actors match this filter\\"\\"\\"
              none: ActorWhere
              \\"\\"\\"Filter type where one of the related Actors match this filter\\"\\"\\"
              single: ActorWhere
              \\"\\"\\"Filter type where some of the related Actors match this filter\\"\\"\\"
              some: ActorWhere
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
              name_SET: String @deprecated(reason: \\"Please use the generic mutation 'name: { set: ... } }' instead.\\")
            }

            input ActorWhere {
              AND: [ActorWhere!]
              NOT: ActorWhere
              OR: [ActorWhere!]
              actedIn: ProductionRelationshipFilters
              actedInAggregate: ActorActedInAggregateInput @deprecated(reason: \\"Aggregate filters are moved inside the actedInConnection filter, please use { actedInConnection: { aggregate: {...} } } instead\\")
              actedInConnection: ActorActedInConnectionFilters
              \\"\\"\\"
              Return Actors where all of the related ActorActedInConnections match this filter
              \\"\\"\\"
              actedInConnection_ALL: ActorActedInConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actedInConnection: { all: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Actors where none of the related ActorActedInConnections match this filter
              \\"\\"\\"
              actedInConnection_NONE: ActorActedInConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actedInConnection: { none: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Actors where one of the related ActorActedInConnections match this filter
              \\"\\"\\"
              actedInConnection_SINGLE: ActorActedInConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actedInConnection: { single: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Actors where some of the related ActorActedInConnections match this filter
              \\"\\"\\"
              actedInConnection_SOME: ActorActedInConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actedInConnection: { some: { node: ... } } }' instead.\\")
              \\"\\"\\"Return Actors where all of the related Productions match this filter\\"\\"\\"
              actedIn_ALL: ProductionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actedIn: { all: ... }' instead.\\")
              \\"\\"\\"Return Actors where none of the related Productions match this filter\\"\\"\\"
              actedIn_NONE: ProductionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actedIn: { none: ... }' instead.\\")
              \\"\\"\\"Return Actors where one of the related Productions match this filter\\"\\"\\"
              actedIn_SINGLE: ProductionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actedIn: {  single: ... }' instead.\\")
              \\"\\"\\"Return Actors where some of the related Productions match this filter\\"\\"\\"
              actedIn_SOME: ProductionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actedIn: {  some: ... }' instead.\\")
              name: StringScalarFilters
              name_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter name: { contains: ... }\\")
              name_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter name: { endsWith: ... }\\")
              name_EQ: String @deprecated(reason: \\"Please use the relevant generic filter name: { eq: ... }\\")
              name_IN: [String!] @deprecated(reason: \\"Please use the relevant generic filter name: { in: ... }\\")
              name_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter name: { startsWith: ... }\\")
            }

            type ActorsConnection {
              aggregate: ActorAggregate!
              edges: [ActorEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input ConnectionAggregationCountFilterInput {
              edges: IntScalarFilters
              nodes: IntScalarFilters
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
              seriesConnection(after: String, first: Int, sort: [EpisodeSeriesConnectionSort!], where: EpisodeSeriesConnectionWhere): EpisodeSeriesConnection!
            }

            type EpisodeAggregate {
              count: Count!
              node: EpisodeAggregateNode!
            }

            type EpisodeAggregateNode {
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

            input EpisodeRelationshipFilters {
              \\"\\"\\"Filter type where all of the related Episodes match this filter\\"\\"\\"
              all: EpisodeWhere
              \\"\\"\\"Filter type where none of the related Episodes match this filter\\"\\"\\"
              none: EpisodeWhere
              \\"\\"\\"Filter type where one of the related Episodes match this filter\\"\\"\\"
              single: EpisodeWhere
              \\"\\"\\"Filter type where some of the related Episodes match this filter\\"\\"\\"
              some: EpisodeWhere
            }

            input EpisodeSeriesAggregateInput {
              AND: [EpisodeSeriesAggregateInput!]
              NOT: EpisodeSeriesAggregateInput
              OR: [EpisodeSeriesAggregateInput!]
              count: IntScalarFilters
              count_EQ: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { eq: ... } } }' instead.\\")
              count_GT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gt: ... } } }' instead.\\")
              count_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gte: ... } } }' instead.\\")
              count_LT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lt: ... } } }' instead.\\")
              count_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lte: ... } } }' instead.\\")
              node: EpisodeSeriesNodeAggregationWhereInput
            }

            input EpisodeSeriesConnectFieldInput {
              connect: [SeriesConnectInput!]
              where: SeriesConnectWhere
            }

            type EpisodeSeriesConnection {
              aggregate: EpisodeSeriesSeriesAggregateSelection!
              edges: [EpisodeSeriesRelationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input EpisodeSeriesConnectionAggregateInput {
              AND: [EpisodeSeriesConnectionAggregateInput!]
              NOT: EpisodeSeriesConnectionAggregateInput
              OR: [EpisodeSeriesConnectionAggregateInput!]
              count: ConnectionAggregationCountFilterInput
              node: EpisodeSeriesNodeAggregationWhereInput
            }

            input EpisodeSeriesConnectionFilters {
              \\"\\"\\"
              Filter Episodes by aggregating results on related EpisodeSeriesConnections
              \\"\\"\\"
              aggregate: EpisodeSeriesConnectionAggregateInput
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
              episodeCount: IntScalarAggregationFilters
              episodeCount_AVERAGE_EQUAL: Float @deprecated(reason: \\"Please use the relevant generic filter 'episodeCount: { average: { eq: ... } } }' instead.\\")
              episodeCount_AVERAGE_GT: Float @deprecated(reason: \\"Please use the relevant generic filter 'episodeCount: { average: { gt: ... } } }' instead.\\")
              episodeCount_AVERAGE_GTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'episodeCount: { average: { gte: ... } } }' instead.\\")
              episodeCount_AVERAGE_LT: Float @deprecated(reason: \\"Please use the relevant generic filter 'episodeCount: { average: { lt: ... } } }' instead.\\")
              episodeCount_AVERAGE_LTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'episodeCount: { average: { lte: ... } } }' instead.\\")
              episodeCount_MAX_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'episodeCount: { max: { eq: ... } } }' instead.\\")
              episodeCount_MAX_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'episodeCount: { max: { gt: ... } } }' instead.\\")
              episodeCount_MAX_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'episodeCount: { max: { gte: ... } } }' instead.\\")
              episodeCount_MAX_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'episodeCount: { max: { lt: ... } } }' instead.\\")
              episodeCount_MAX_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'episodeCount: { max: { lte: ... } } }' instead.\\")
              episodeCount_MIN_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'episodeCount: { min: { eq: ... } } }' instead.\\")
              episodeCount_MIN_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'episodeCount: { min: { gt: ... } } }' instead.\\")
              episodeCount_MIN_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'episodeCount: { min: { gte: ... } } }' instead.\\")
              episodeCount_MIN_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'episodeCount: { min: { lt: ... } } }' instead.\\")
              episodeCount_MIN_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'episodeCount: { min: { lte: ... } } }' instead.\\")
              episodeCount_SUM_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'episodeCount: { sum: { eq: ... } } }' instead.\\")
              episodeCount_SUM_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'episodeCount: { sum: { gt: ... } } }' instead.\\")
              episodeCount_SUM_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'episodeCount: { sum: { gte: ... } } }' instead.\\")
              episodeCount_SUM_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'episodeCount: { sum: { lt: ... } } }' instead.\\")
              episodeCount_SUM_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'episodeCount: { sum: { lte: ... } } }' instead.\\")
              title: StringScalarAggregationFilters
              title_AVERAGE_LENGTH_EQUAL: Float @deprecated(reason: \\"Please use the relevant generic filter 'title: { averageLength: { eq: ... } } }' instead.\\")
              title_AVERAGE_LENGTH_GT: Float @deprecated(reason: \\"Please use the relevant generic filter 'title: { averageLength: { gt: ... } } }' instead.\\")
              title_AVERAGE_LENGTH_GTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'title: { averageLength: { gte: ... } } }' instead.\\")
              title_AVERAGE_LENGTH_LT: Float @deprecated(reason: \\"Please use the relevant generic filter 'title: { averageLength: { lt: ... } } }' instead.\\")
              title_AVERAGE_LENGTH_LTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'title: { averageLength: { lte: ... } } }' instead.\\")
              title_LONGEST_LENGTH_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { longestLength: { eq: ... } } }' instead.\\")
              title_LONGEST_LENGTH_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { longestLength: { gt: ... } } }' instead.\\")
              title_LONGEST_LENGTH_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { longestLength: { gte: ... } } }' instead.\\")
              title_LONGEST_LENGTH_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { longestLength: { lt: ... } } }' instead.\\")
              title_LONGEST_LENGTH_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { longestLength: { lte: ... } } }' instead.\\")
              title_SHORTEST_LENGTH_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { shortestLength: { eq: ... } } }' instead.\\")
              title_SHORTEST_LENGTH_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { shortestLength: { gt: ... } } }' instead.\\")
              title_SHORTEST_LENGTH_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { shortestLength: { gte: ... } } }' instead.\\")
              title_SHORTEST_LENGTH_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { shortestLength: { lt: ... } } }' instead.\\")
              title_SHORTEST_LENGTH_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { shortestLength: { lte: ... } } }' instead.\\")
            }

            type EpisodeSeriesRelationship {
              cursor: String!
              node: Series!
            }

            type EpisodeSeriesSeriesAggregateSelection {
              count: CountConnection!
              node: EpisodeSeriesSeriesNodeAggregateSelection
            }

            type EpisodeSeriesSeriesNodeAggregateSelection {
              episodeCount: IntAggregateSelection!
              title: StringAggregateSelection!
            }

            input EpisodeSeriesUpdateConnectionInput {
              node: SeriesUpdateInput
              where: EpisodeSeriesConnectionWhere
            }

            input EpisodeSeriesUpdateFieldInput {
              connect: [EpisodeSeriesConnectFieldInput!]
              create: [EpisodeSeriesCreateFieldInput!]
              delete: [EpisodeSeriesDeleteFieldInput!]
              disconnect: [EpisodeSeriesDisconnectFieldInput!]
              update: EpisodeSeriesUpdateConnectionInput
            }

            \\"\\"\\"
            Fields to sort Episodes by. The order in which sorts are applied is not guaranteed when specifying many fields in one EpisodeSort object.
            \\"\\"\\"
            input EpisodeSort {
              runtime: SortDirection
            }

            input EpisodeUpdateInput {
              runtime: IntScalarMutations
              runtime_DECREMENT: Int @deprecated(reason: \\"Please use the relevant generic mutation 'runtime: { decrement: ... } }' instead.\\")
              runtime_INCREMENT: Int @deprecated(reason: \\"Please use the relevant generic mutation 'runtime: { increment: ... } }' instead.\\")
              runtime_SET: Int @deprecated(reason: \\"Please use the generic mutation 'runtime: { set: ... } }' instead.\\")
              series: [EpisodeSeriesUpdateFieldInput!]
            }

            input EpisodeWhere {
              AND: [EpisodeWhere!]
              NOT: EpisodeWhere
              OR: [EpisodeWhere!]
              runtime: IntScalarFilters
              runtime_EQ: Int @deprecated(reason: \\"Please use the relevant generic filter runtime: { eq: ... }\\")
              runtime_GT: Int @deprecated(reason: \\"Please use the relevant generic filter runtime: { gt: ... }\\")
              runtime_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter runtime: { gte: ... }\\")
              runtime_IN: [Int!] @deprecated(reason: \\"Please use the relevant generic filter runtime: { in: ... }\\")
              runtime_LT: Int @deprecated(reason: \\"Please use the relevant generic filter runtime: { lt: ... }\\")
              runtime_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter runtime: { lte: ... }\\")
              series: SeriesRelationshipFilters
              seriesAggregate: EpisodeSeriesAggregateInput @deprecated(reason: \\"Aggregate filters are moved inside the seriesConnection filter, please use { seriesConnection: { aggregate: {...} } } instead\\")
              seriesConnection: EpisodeSeriesConnectionFilters
              \\"\\"\\"
              Return Episodes where all of the related EpisodeSeriesConnections match this filter
              \\"\\"\\"
              seriesConnection_ALL: EpisodeSeriesConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'seriesConnection: { all: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Episodes where none of the related EpisodeSeriesConnections match this filter
              \\"\\"\\"
              seriesConnection_NONE: EpisodeSeriesConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'seriesConnection: { none: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Episodes where one of the related EpisodeSeriesConnections match this filter
              \\"\\"\\"
              seriesConnection_SINGLE: EpisodeSeriesConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'seriesConnection: { single: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Episodes where some of the related EpisodeSeriesConnections match this filter
              \\"\\"\\"
              seriesConnection_SOME: EpisodeSeriesConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'seriesConnection: { some: { node: ... } } }' instead.\\")
              \\"\\"\\"Return Episodes where all of the related Series match this filter\\"\\"\\"
              series_ALL: SeriesWhere @deprecated(reason: \\"Please use the relevant generic filter 'series: { all: ... }' instead.\\")
              \\"\\"\\"Return Episodes where none of the related Series match this filter\\"\\"\\"
              series_NONE: SeriesWhere @deprecated(reason: \\"Please use the relevant generic filter 'series: { none: ... }' instead.\\")
              \\"\\"\\"Return Episodes where one of the related Series match this filter\\"\\"\\"
              series_SINGLE: SeriesWhere @deprecated(reason: \\"Please use the relevant generic filter 'series: {  single: ... }' instead.\\")
              \\"\\"\\"Return Episodes where some of the related Series match this filter\\"\\"\\"
              series_SOME: SeriesWhere @deprecated(reason: \\"Please use the relevant generic filter 'series: {  some: ... }' instead.\\")
            }

            type EpisodesConnection {
              aggregate: EpisodeAggregate!
              edges: [EpisodeEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            \\"\\"\\"Float filters\\"\\"\\"
            input FloatScalarFilters {
              eq: Float
              gt: Float
              gte: Float
              in: [Float!]
              lt: Float
              lte: Float
            }

            type IntAggregateSelection {
              average: Float
              max: Int
              min: Int
              sum: Int
            }

            \\"\\"\\"Filters for an aggregation of an int field\\"\\"\\"
            input IntScalarAggregationFilters {
              average: FloatScalarFilters
              max: IntScalarFilters
              min: IntScalarFilters
              sum: IntScalarFilters
            }

            \\"\\"\\"Int filters\\"\\"\\"
            input IntScalarFilters {
              eq: Int
              gt: Int
              gte: Int
              in: [Int!]
              lt: Int
              lte: Int
            }

            \\"\\"\\"Int mutations\\"\\"\\"
            input IntScalarMutations {
              add: Int
              set: Int
              subtract: Int
            }

            type Movie implements Production {
              actors(limit: Int, offset: Int, sort: [ActorSort!], where: ActorWhere): [Actor!]!
              actorsConnection(after: String, first: Int, sort: [ProductionActorsConnectionSort!], where: ProductionActorsConnectionWhere): ProductionActorsConnection!
              runtime: Int!
              title: String!
            }

            input MovieActorsAggregateInput {
              AND: [MovieActorsAggregateInput!]
              NOT: MovieActorsAggregateInput
              OR: [MovieActorsAggregateInput!]
              count: IntScalarFilters
              count_EQ: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { eq: ... } } }' instead.\\")
              count_GT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gt: ... } } }' instead.\\")
              count_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gte: ... } } }' instead.\\")
              count_LT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lt: ... } } }' instead.\\")
              count_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lte: ... } } }' instead.\\")
              edge: ActedInAggregationWhereInput
              node: MovieActorsNodeAggregationWhereInput
            }

            input MovieActorsConnectFieldInput {
              connect: [ActorConnectInput!]
              edge: ActedInCreateInput!
              where: ActorConnectWhere
            }

            input MovieActorsConnectionAggregateInput {
              AND: [MovieActorsConnectionAggregateInput!]
              NOT: MovieActorsConnectionAggregateInput
              OR: [MovieActorsConnectionAggregateInput!]
              count: ConnectionAggregationCountFilterInput
              edge: ActedInAggregationWhereInput
              node: MovieActorsNodeAggregationWhereInput
            }

            input MovieActorsConnectionFilters {
              \\"\\"\\"
              Filter Movies by aggregating results on related ProductionActorsConnections
              \\"\\"\\"
              aggregate: MovieActorsConnectionAggregateInput
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
              name: StringScalarAggregationFilters
              name_AVERAGE_LENGTH_EQUAL: Float @deprecated(reason: \\"Please use the relevant generic filter 'name: { averageLength: { eq: ... } } }' instead.\\")
              name_AVERAGE_LENGTH_GT: Float @deprecated(reason: \\"Please use the relevant generic filter 'name: { averageLength: { gt: ... } } }' instead.\\")
              name_AVERAGE_LENGTH_GTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'name: { averageLength: { gte: ... } } }' instead.\\")
              name_AVERAGE_LENGTH_LT: Float @deprecated(reason: \\"Please use the relevant generic filter 'name: { averageLength: { lt: ... } } }' instead.\\")
              name_AVERAGE_LENGTH_LTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'name: { averageLength: { lte: ... } } }' instead.\\")
              name_LONGEST_LENGTH_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'name: { longestLength: { eq: ... } } }' instead.\\")
              name_LONGEST_LENGTH_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'name: { longestLength: { gt: ... } } }' instead.\\")
              name_LONGEST_LENGTH_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'name: { longestLength: { gte: ... } } }' instead.\\")
              name_LONGEST_LENGTH_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'name: { longestLength: { lt: ... } } }' instead.\\")
              name_LONGEST_LENGTH_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'name: { longestLength: { lte: ... } } }' instead.\\")
              name_SHORTEST_LENGTH_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'name: { shortestLength: { eq: ... } } }' instead.\\")
              name_SHORTEST_LENGTH_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'name: { shortestLength: { gt: ... } } }' instead.\\")
              name_SHORTEST_LENGTH_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'name: { shortestLength: { gte: ... } } }' instead.\\")
              name_SHORTEST_LENGTH_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'name: { shortestLength: { lt: ... } } }' instead.\\")
              name_SHORTEST_LENGTH_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'name: { shortestLength: { lte: ... } } }' instead.\\")
            }

            input MovieActorsUpdateConnectionInput {
              edge: ActedInUpdateInput
              node: ActorUpdateInput
              where: ProductionActorsConnectionWhere
            }

            input MovieActorsUpdateFieldInput {
              connect: [MovieActorsConnectFieldInput!]
              create: [MovieActorsCreateFieldInput!]
              delete: [ProductionActorsDeleteFieldInput!]
              disconnect: [ProductionActorsDisconnectFieldInput!]
              update: MovieActorsUpdateConnectionInput
            }

            type MovieAggregate {
              count: Count!
              node: MovieAggregateNode!
            }

            type MovieAggregateNode {
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
              runtime: IntScalarMutations
              runtime_DECREMENT: Int @deprecated(reason: \\"Please use the relevant generic mutation 'runtime: { decrement: ... } }' instead.\\")
              runtime_INCREMENT: Int @deprecated(reason: \\"Please use the relevant generic mutation 'runtime: { increment: ... } }' instead.\\")
              runtime_SET: Int @deprecated(reason: \\"Please use the generic mutation 'runtime: { set: ... } }' instead.\\")
              title: StringScalarMutations
              title_SET: String @deprecated(reason: \\"Please use the generic mutation 'title: { set: ... } }' instead.\\")
            }

            input MovieWhere {
              AND: [MovieWhere!]
              NOT: MovieWhere
              OR: [MovieWhere!]
              actors: ActorRelationshipFilters
              actorsAggregate: MovieActorsAggregateInput @deprecated(reason: \\"Aggregate filters are moved inside the actorsConnection filter, please use { actorsConnection: { aggregate: {...} } } instead\\")
              actorsConnection: MovieActorsConnectionFilters
              \\"\\"\\"
              Return Movies where all of the related ProductionActorsConnections match this filter
              \\"\\"\\"
              actorsConnection_ALL: ProductionActorsConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actorsConnection: { all: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Movies where none of the related ProductionActorsConnections match this filter
              \\"\\"\\"
              actorsConnection_NONE: ProductionActorsConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actorsConnection: { none: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Movies where one of the related ProductionActorsConnections match this filter
              \\"\\"\\"
              actorsConnection_SINGLE: ProductionActorsConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actorsConnection: { single: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Movies where some of the related ProductionActorsConnections match this filter
              \\"\\"\\"
              actorsConnection_SOME: ProductionActorsConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actorsConnection: { some: { node: ... } } }' instead.\\")
              \\"\\"\\"Return Movies where all of the related Actors match this filter\\"\\"\\"
              actors_ALL: ActorWhere @deprecated(reason: \\"Please use the relevant generic filter 'actors: { all: ... }' instead.\\")
              \\"\\"\\"Return Movies where none of the related Actors match this filter\\"\\"\\"
              actors_NONE: ActorWhere @deprecated(reason: \\"Please use the relevant generic filter 'actors: { none: ... }' instead.\\")
              \\"\\"\\"Return Movies where one of the related Actors match this filter\\"\\"\\"
              actors_SINGLE: ActorWhere @deprecated(reason: \\"Please use the relevant generic filter 'actors: {  single: ... }' instead.\\")
              \\"\\"\\"Return Movies where some of the related Actors match this filter\\"\\"\\"
              actors_SOME: ActorWhere @deprecated(reason: \\"Please use the relevant generic filter 'actors: {  some: ... }' instead.\\")
              runtime: IntScalarFilters
              runtime_EQ: Int @deprecated(reason: \\"Please use the relevant generic filter runtime: { eq: ... }\\")
              runtime_GT: Int @deprecated(reason: \\"Please use the relevant generic filter runtime: { gt: ... }\\")
              runtime_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter runtime: { gte: ... }\\")
              runtime_IN: [Int!] @deprecated(reason: \\"Please use the relevant generic filter runtime: { in: ... }\\")
              runtime_LT: Int @deprecated(reason: \\"Please use the relevant generic filter runtime: { lt: ... }\\")
              runtime_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter runtime: { lte: ... }\\")
              title: StringScalarFilters
              title_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter title: { contains: ... }\\")
              title_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter title: { endsWith: ... }\\")
              title_EQ: String @deprecated(reason: \\"Please use the relevant generic filter title: { eq: ... }\\")
              title_IN: [String!] @deprecated(reason: \\"Please use the relevant generic filter title: { in: ... }\\")
              title_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter title: { startsWith: ... }\\")
            }

            type MoviesConnection {
              aggregate: MovieAggregate!
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
              count: IntScalarFilters
              count_EQ: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { eq: ... } } }' instead.\\")
              count_GT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gt: ... } } }' instead.\\")
              count_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gte: ... } } }' instead.\\")
              count_LT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lt: ... } } }' instead.\\")
              count_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lte: ... } } }' instead.\\")
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

            input ProductionActorsConnectionAggregateInput {
              AND: [ProductionActorsConnectionAggregateInput!]
              NOT: ProductionActorsConnectionAggregateInput
              OR: [ProductionActorsConnectionAggregateInput!]
              count: ConnectionAggregationCountFilterInput
              edge: ProductionActorsEdgeAggregationWhereInput
              node: ProductionActorsNodeAggregationWhereInput
            }

            input ProductionActorsConnectionFilters {
              \\"\\"\\"
              Filter Productions by aggregating results on related ProductionActorsConnections
              \\"\\"\\"
              aggregate: ProductionActorsConnectionAggregateInput
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
              name: StringScalarAggregationFilters
              name_AVERAGE_LENGTH_EQUAL: Float @deprecated(reason: \\"Please use the relevant generic filter 'name: { averageLength: { eq: ... } } }' instead.\\")
              name_AVERAGE_LENGTH_GT: Float @deprecated(reason: \\"Please use the relevant generic filter 'name: { averageLength: { gt: ... } } }' instead.\\")
              name_AVERAGE_LENGTH_GTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'name: { averageLength: { gte: ... } } }' instead.\\")
              name_AVERAGE_LENGTH_LT: Float @deprecated(reason: \\"Please use the relevant generic filter 'name: { averageLength: { lt: ... } } }' instead.\\")
              name_AVERAGE_LENGTH_LTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'name: { averageLength: { lte: ... } } }' instead.\\")
              name_LONGEST_LENGTH_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'name: { longestLength: { eq: ... } } }' instead.\\")
              name_LONGEST_LENGTH_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'name: { longestLength: { gt: ... } } }' instead.\\")
              name_LONGEST_LENGTH_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'name: { longestLength: { gte: ... } } }' instead.\\")
              name_LONGEST_LENGTH_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'name: { longestLength: { lt: ... } } }' instead.\\")
              name_LONGEST_LENGTH_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'name: { longestLength: { lte: ... } } }' instead.\\")
              name_SHORTEST_LENGTH_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'name: { shortestLength: { eq: ... } } }' instead.\\")
              name_SHORTEST_LENGTH_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'name: { shortestLength: { gt: ... } } }' instead.\\")
              name_SHORTEST_LENGTH_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'name: { shortestLength: { gte: ... } } }' instead.\\")
              name_SHORTEST_LENGTH_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'name: { shortestLength: { lt: ... } } }' instead.\\")
              name_SHORTEST_LENGTH_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'name: { shortestLength: { lte: ... } } }' instead.\\")
            }

            type ProductionActorsRelationship {
              cursor: String!
              node: Actor!
              properties: ProductionActorsRelationshipProperties!
            }

            union ProductionActorsRelationshipProperties = ActedIn | StarredIn

            input ProductionActorsUpdateConnectionInput {
              edge: ProductionActorsEdgeUpdateInput
              node: ActorUpdateInput
              where: ProductionActorsConnectionWhere
            }

            input ProductionActorsUpdateFieldInput {
              connect: [ProductionActorsConnectFieldInput!]
              create: [ProductionActorsCreateFieldInput!]
              delete: [ProductionActorsDeleteFieldInput!]
              disconnect: [ProductionActorsDisconnectFieldInput!]
              update: ProductionActorsUpdateConnectionInput
            }

            type ProductionAggregate {
              count: Count!
              node: ProductionAggregateNode!
            }

            type ProductionAggregateNode {
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

            input ProductionRelationshipFilters {
              \\"\\"\\"Filter type where all of the related Productions match this filter\\"\\"\\"
              all: ProductionWhere
              \\"\\"\\"Filter type where none of the related Productions match this filter\\"\\"\\"
              none: ProductionWhere
              \\"\\"\\"Filter type where one of the related Productions match this filter\\"\\"\\"
              single: ProductionWhere
              \\"\\"\\"Filter type where some of the related Productions match this filter\\"\\"\\"
              some: ProductionWhere
            }

            \\"\\"\\"
            Fields to sort Productions by. The order in which sorts are applied is not guaranteed when specifying many fields in one ProductionSort object.
            \\"\\"\\"
            input ProductionSort {
              title: SortDirection
            }

            input ProductionUpdateInput {
              actors: [ProductionActorsUpdateFieldInput!]
              title: StringScalarMutations
              title_SET: String @deprecated(reason: \\"Please use the generic mutation 'title: { set: ... } }' instead.\\")
            }

            input ProductionWhere {
              AND: [ProductionWhere!]
              NOT: ProductionWhere
              OR: [ProductionWhere!]
              actors: ActorRelationshipFilters
              actorsAggregate: ProductionActorsAggregateInput @deprecated(reason: \\"Aggregate filters are moved inside the actorsConnection filter, please use { actorsConnection: { aggregate: {...} } } instead\\")
              actorsConnection: ProductionActorsConnectionFilters
              \\"\\"\\"
              Return Productions where all of the related ProductionActorsConnections match this filter
              \\"\\"\\"
              actorsConnection_ALL: ProductionActorsConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actorsConnection: { all: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Productions where none of the related ProductionActorsConnections match this filter
              \\"\\"\\"
              actorsConnection_NONE: ProductionActorsConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actorsConnection: { none: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Productions where one of the related ProductionActorsConnections match this filter
              \\"\\"\\"
              actorsConnection_SINGLE: ProductionActorsConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actorsConnection: { single: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Productions where some of the related ProductionActorsConnections match this filter
              \\"\\"\\"
              actorsConnection_SOME: ProductionActorsConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actorsConnection: { some: { node: ... } } }' instead.\\")
              \\"\\"\\"Return Productions where all of the related Actors match this filter\\"\\"\\"
              actors_ALL: ActorWhere @deprecated(reason: \\"Please use the relevant generic filter 'actors: { all: ... }' instead.\\")
              \\"\\"\\"Return Productions where none of the related Actors match this filter\\"\\"\\"
              actors_NONE: ActorWhere @deprecated(reason: \\"Please use the relevant generic filter 'actors: { none: ... }' instead.\\")
              \\"\\"\\"Return Productions where one of the related Actors match this filter\\"\\"\\"
              actors_SINGLE: ActorWhere @deprecated(reason: \\"Please use the relevant generic filter 'actors: {  single: ... }' instead.\\")
              \\"\\"\\"Return Productions where some of the related Actors match this filter\\"\\"\\"
              actors_SOME: ActorWhere @deprecated(reason: \\"Please use the relevant generic filter 'actors: {  some: ... }' instead.\\")
              title: StringScalarFilters
              title_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter title: { contains: ... }\\")
              title_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter title: { endsWith: ... }\\")
              title_EQ: String @deprecated(reason: \\"Please use the relevant generic filter title: { eq: ... }\\")
              title_IN: [String!] @deprecated(reason: \\"Please use the relevant generic filter title: { in: ... }\\")
              title_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter title: { startsWith: ... }\\")
              typename: [ProductionImplementation!]
            }

            type ProductionsConnection {
              aggregate: ProductionAggregate!
              edges: [ProductionEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            type Query {
              actors(limit: Int, offset: Int, sort: [ActorSort!], where: ActorWhere): [Actor!]!
              actorsConnection(after: String, first: Int, sort: [ActorSort!], where: ActorWhere): ActorsConnection!
              episodes(limit: Int, offset: Int, sort: [EpisodeSort!], where: EpisodeWhere): [Episode!]!
              episodesConnection(after: String, first: Int, sort: [EpisodeSort!], where: EpisodeWhere): EpisodesConnection!
              movies(limit: Int, offset: Int, sort: [MovieSort!], where: MovieWhere): [Movie!]!
              moviesConnection(after: String, first: Int, sort: [MovieSort!], where: MovieWhere): MoviesConnection!
              productions(limit: Int, offset: Int, sort: [ProductionSort!], where: ProductionWhere): [Production!]!
              productionsConnection(after: String, first: Int, sort: [ProductionSort!], where: ProductionWhere): ProductionsConnection!
              series(limit: Int, offset: Int, sort: [SeriesSort!], where: SeriesWhere): [Series!]!
              seriesConnection(after: String, first: Int, sort: [SeriesSort!], where: SeriesWhere): SeriesConnection!
            }

            type Series implements Production {
              actors(limit: Int, offset: Int, sort: [ActorSort!], where: ActorWhere): [Actor!]!
              actorsConnection(after: String, first: Int, sort: [ProductionActorsConnectionSort!], where: ProductionActorsConnectionWhere): ProductionActorsConnection!
              episodeCount: Int!
              episodes(limit: Int, offset: Int, sort: [EpisodeSort!], where: EpisodeWhere): [Episode!]!
              episodesConnection(after: String, first: Int, sort: [SeriesEpisodesConnectionSort!], where: SeriesEpisodesConnectionWhere): SeriesEpisodesConnection!
              title: String!
            }

            input SeriesActorsAggregateInput {
              AND: [SeriesActorsAggregateInput!]
              NOT: SeriesActorsAggregateInput
              OR: [SeriesActorsAggregateInput!]
              count: IntScalarFilters
              count_EQ: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { eq: ... } } }' instead.\\")
              count_GT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gt: ... } } }' instead.\\")
              count_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gte: ... } } }' instead.\\")
              count_LT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lt: ... } } }' instead.\\")
              count_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lte: ... } } }' instead.\\")
              edge: StarredInAggregationWhereInput
              node: SeriesActorsNodeAggregationWhereInput
            }

            input SeriesActorsConnectFieldInput {
              connect: [ActorConnectInput!]
              edge: StarredInCreateInput!
              where: ActorConnectWhere
            }

            input SeriesActorsConnectionAggregateInput {
              AND: [SeriesActorsConnectionAggregateInput!]
              NOT: SeriesActorsConnectionAggregateInput
              OR: [SeriesActorsConnectionAggregateInput!]
              count: ConnectionAggregationCountFilterInput
              edge: StarredInAggregationWhereInput
              node: SeriesActorsNodeAggregationWhereInput
            }

            input SeriesActorsConnectionFilters {
              \\"\\"\\"
              Filter Series by aggregating results on related ProductionActorsConnections
              \\"\\"\\"
              aggregate: SeriesActorsConnectionAggregateInput
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
              name: StringScalarAggregationFilters
              name_AVERAGE_LENGTH_EQUAL: Float @deprecated(reason: \\"Please use the relevant generic filter 'name: { averageLength: { eq: ... } } }' instead.\\")
              name_AVERAGE_LENGTH_GT: Float @deprecated(reason: \\"Please use the relevant generic filter 'name: { averageLength: { gt: ... } } }' instead.\\")
              name_AVERAGE_LENGTH_GTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'name: { averageLength: { gte: ... } } }' instead.\\")
              name_AVERAGE_LENGTH_LT: Float @deprecated(reason: \\"Please use the relevant generic filter 'name: { averageLength: { lt: ... } } }' instead.\\")
              name_AVERAGE_LENGTH_LTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'name: { averageLength: { lte: ... } } }' instead.\\")
              name_LONGEST_LENGTH_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'name: { longestLength: { eq: ... } } }' instead.\\")
              name_LONGEST_LENGTH_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'name: { longestLength: { gt: ... } } }' instead.\\")
              name_LONGEST_LENGTH_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'name: { longestLength: { gte: ... } } }' instead.\\")
              name_LONGEST_LENGTH_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'name: { longestLength: { lt: ... } } }' instead.\\")
              name_LONGEST_LENGTH_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'name: { longestLength: { lte: ... } } }' instead.\\")
              name_SHORTEST_LENGTH_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'name: { shortestLength: { eq: ... } } }' instead.\\")
              name_SHORTEST_LENGTH_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'name: { shortestLength: { gt: ... } } }' instead.\\")
              name_SHORTEST_LENGTH_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'name: { shortestLength: { gte: ... } } }' instead.\\")
              name_SHORTEST_LENGTH_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'name: { shortestLength: { lt: ... } } }' instead.\\")
              name_SHORTEST_LENGTH_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'name: { shortestLength: { lte: ... } } }' instead.\\")
            }

            input SeriesActorsUpdateConnectionInput {
              edge: StarredInUpdateInput
              node: ActorUpdateInput
              where: ProductionActorsConnectionWhere
            }

            input SeriesActorsUpdateFieldInput {
              connect: [SeriesActorsConnectFieldInput!]
              create: [SeriesActorsCreateFieldInput!]
              delete: [ProductionActorsDeleteFieldInput!]
              disconnect: [ProductionActorsDisconnectFieldInput!]
              update: SeriesActorsUpdateConnectionInput
            }

            type SeriesAggregate {
              count: Count!
              node: SeriesAggregateNode!
            }

            type SeriesAggregateNode {
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
              aggregate: SeriesAggregate!
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

            type SeriesEpisodeEpisodesAggregateSelection {
              count: CountConnection!
              node: SeriesEpisodeEpisodesNodeAggregateSelection
            }

            type SeriesEpisodeEpisodesNodeAggregateSelection {
              runtime: IntAggregateSelection!
            }

            input SeriesEpisodesAggregateInput {
              AND: [SeriesEpisodesAggregateInput!]
              NOT: SeriesEpisodesAggregateInput
              OR: [SeriesEpisodesAggregateInput!]
              count: IntScalarFilters
              count_EQ: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { eq: ... } } }' instead.\\")
              count_GT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gt: ... } } }' instead.\\")
              count_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gte: ... } } }' instead.\\")
              count_LT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lt: ... } } }' instead.\\")
              count_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lte: ... } } }' instead.\\")
              node: SeriesEpisodesNodeAggregationWhereInput
            }

            input SeriesEpisodesConnectFieldInput {
              connect: [EpisodeConnectInput!]
              where: EpisodeConnectWhere
            }

            type SeriesEpisodesConnection {
              aggregate: SeriesEpisodeEpisodesAggregateSelection!
              edges: [SeriesEpisodesRelationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input SeriesEpisodesConnectionAggregateInput {
              AND: [SeriesEpisodesConnectionAggregateInput!]
              NOT: SeriesEpisodesConnectionAggregateInput
              OR: [SeriesEpisodesConnectionAggregateInput!]
              count: ConnectionAggregationCountFilterInput
              node: SeriesEpisodesNodeAggregationWhereInput
            }

            input SeriesEpisodesConnectionFilters {
              \\"\\"\\"
              Filter Series by aggregating results on related SeriesEpisodesConnections
              \\"\\"\\"
              aggregate: SeriesEpisodesConnectionAggregateInput
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
              runtime: IntScalarAggregationFilters
              runtime_AVERAGE_EQUAL: Float @deprecated(reason: \\"Please use the relevant generic filter 'runtime: { average: { eq: ... } } }' instead.\\")
              runtime_AVERAGE_GT: Float @deprecated(reason: \\"Please use the relevant generic filter 'runtime: { average: { gt: ... } } }' instead.\\")
              runtime_AVERAGE_GTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'runtime: { average: { gte: ... } } }' instead.\\")
              runtime_AVERAGE_LT: Float @deprecated(reason: \\"Please use the relevant generic filter 'runtime: { average: { lt: ... } } }' instead.\\")
              runtime_AVERAGE_LTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'runtime: { average: { lte: ... } } }' instead.\\")
              runtime_MAX_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'runtime: { max: { eq: ... } } }' instead.\\")
              runtime_MAX_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'runtime: { max: { gt: ... } } }' instead.\\")
              runtime_MAX_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'runtime: { max: { gte: ... } } }' instead.\\")
              runtime_MAX_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'runtime: { max: { lt: ... } } }' instead.\\")
              runtime_MAX_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'runtime: { max: { lte: ... } } }' instead.\\")
              runtime_MIN_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'runtime: { min: { eq: ... } } }' instead.\\")
              runtime_MIN_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'runtime: { min: { gt: ... } } }' instead.\\")
              runtime_MIN_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'runtime: { min: { gte: ... } } }' instead.\\")
              runtime_MIN_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'runtime: { min: { lt: ... } } }' instead.\\")
              runtime_MIN_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'runtime: { min: { lte: ... } } }' instead.\\")
              runtime_SUM_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'runtime: { sum: { eq: ... } } }' instead.\\")
              runtime_SUM_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'runtime: { sum: { gt: ... } } }' instead.\\")
              runtime_SUM_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'runtime: { sum: { gte: ... } } }' instead.\\")
              runtime_SUM_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'runtime: { sum: { lt: ... } } }' instead.\\")
              runtime_SUM_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'runtime: { sum: { lte: ... } } }' instead.\\")
            }

            type SeriesEpisodesRelationship {
              cursor: String!
              node: Episode!
            }

            input SeriesEpisodesUpdateConnectionInput {
              node: EpisodeUpdateInput
              where: SeriesEpisodesConnectionWhere
            }

            input SeriesEpisodesUpdateFieldInput {
              connect: [SeriesEpisodesConnectFieldInput!]
              create: [SeriesEpisodesCreateFieldInput!]
              delete: [SeriesEpisodesDeleteFieldInput!]
              disconnect: [SeriesEpisodesDisconnectFieldInput!]
              update: SeriesEpisodesUpdateConnectionInput
            }

            input SeriesRelationshipFilters {
              \\"\\"\\"Filter type where all of the related Series match this filter\\"\\"\\"
              all: SeriesWhere
              \\"\\"\\"Filter type where none of the related Series match this filter\\"\\"\\"
              none: SeriesWhere
              \\"\\"\\"Filter type where one of the related Series match this filter\\"\\"\\"
              single: SeriesWhere
              \\"\\"\\"Filter type where some of the related Series match this filter\\"\\"\\"
              some: SeriesWhere
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
              episodeCount: IntScalarMutations
              episodeCount_DECREMENT: Int @deprecated(reason: \\"Please use the relevant generic mutation 'episodeCount: { decrement: ... } }' instead.\\")
              episodeCount_INCREMENT: Int @deprecated(reason: \\"Please use the relevant generic mutation 'episodeCount: { increment: ... } }' instead.\\")
              episodeCount_SET: Int @deprecated(reason: \\"Please use the generic mutation 'episodeCount: { set: ... } }' instead.\\")
              episodes: [SeriesEpisodesUpdateFieldInput!]
              title: StringScalarMutations
              title_SET: String @deprecated(reason: \\"Please use the generic mutation 'title: { set: ... } }' instead.\\")
            }

            input SeriesWhere {
              AND: [SeriesWhere!]
              NOT: SeriesWhere
              OR: [SeriesWhere!]
              actors: ActorRelationshipFilters
              actorsAggregate: SeriesActorsAggregateInput @deprecated(reason: \\"Aggregate filters are moved inside the actorsConnection filter, please use { actorsConnection: { aggregate: {...} } } instead\\")
              actorsConnection: SeriesActorsConnectionFilters
              \\"\\"\\"
              Return Series where all of the related ProductionActorsConnections match this filter
              \\"\\"\\"
              actorsConnection_ALL: ProductionActorsConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actorsConnection: { all: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Series where none of the related ProductionActorsConnections match this filter
              \\"\\"\\"
              actorsConnection_NONE: ProductionActorsConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actorsConnection: { none: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Series where one of the related ProductionActorsConnections match this filter
              \\"\\"\\"
              actorsConnection_SINGLE: ProductionActorsConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actorsConnection: { single: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Series where some of the related ProductionActorsConnections match this filter
              \\"\\"\\"
              actorsConnection_SOME: ProductionActorsConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actorsConnection: { some: { node: ... } } }' instead.\\")
              \\"\\"\\"Return Series where all of the related Actors match this filter\\"\\"\\"
              actors_ALL: ActorWhere @deprecated(reason: \\"Please use the relevant generic filter 'actors: { all: ... }' instead.\\")
              \\"\\"\\"Return Series where none of the related Actors match this filter\\"\\"\\"
              actors_NONE: ActorWhere @deprecated(reason: \\"Please use the relevant generic filter 'actors: { none: ... }' instead.\\")
              \\"\\"\\"Return Series where one of the related Actors match this filter\\"\\"\\"
              actors_SINGLE: ActorWhere @deprecated(reason: \\"Please use the relevant generic filter 'actors: {  single: ... }' instead.\\")
              \\"\\"\\"Return Series where some of the related Actors match this filter\\"\\"\\"
              actors_SOME: ActorWhere @deprecated(reason: \\"Please use the relevant generic filter 'actors: {  some: ... }' instead.\\")
              episodeCount: IntScalarFilters
              episodeCount_EQ: Int @deprecated(reason: \\"Please use the relevant generic filter episodeCount: { eq: ... }\\")
              episodeCount_GT: Int @deprecated(reason: \\"Please use the relevant generic filter episodeCount: { gt: ... }\\")
              episodeCount_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter episodeCount: { gte: ... }\\")
              episodeCount_IN: [Int!] @deprecated(reason: \\"Please use the relevant generic filter episodeCount: { in: ... }\\")
              episodeCount_LT: Int @deprecated(reason: \\"Please use the relevant generic filter episodeCount: { lt: ... }\\")
              episodeCount_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter episodeCount: { lte: ... }\\")
              episodes: EpisodeRelationshipFilters
              episodesAggregate: SeriesEpisodesAggregateInput @deprecated(reason: \\"Aggregate filters are moved inside the episodesConnection filter, please use { episodesConnection: { aggregate: {...} } } instead\\")
              episodesConnection: SeriesEpisodesConnectionFilters
              \\"\\"\\"
              Return Series where all of the related SeriesEpisodesConnections match this filter
              \\"\\"\\"
              episodesConnection_ALL: SeriesEpisodesConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'episodesConnection: { all: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Series where none of the related SeriesEpisodesConnections match this filter
              \\"\\"\\"
              episodesConnection_NONE: SeriesEpisodesConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'episodesConnection: { none: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Series where one of the related SeriesEpisodesConnections match this filter
              \\"\\"\\"
              episodesConnection_SINGLE: SeriesEpisodesConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'episodesConnection: { single: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Series where some of the related SeriesEpisodesConnections match this filter
              \\"\\"\\"
              episodesConnection_SOME: SeriesEpisodesConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'episodesConnection: { some: { node: ... } } }' instead.\\")
              \\"\\"\\"Return Series where all of the related Episodes match this filter\\"\\"\\"
              episodes_ALL: EpisodeWhere @deprecated(reason: \\"Please use the relevant generic filter 'episodes: { all: ... }' instead.\\")
              \\"\\"\\"Return Series where none of the related Episodes match this filter\\"\\"\\"
              episodes_NONE: EpisodeWhere @deprecated(reason: \\"Please use the relevant generic filter 'episodes: { none: ... }' instead.\\")
              \\"\\"\\"Return Series where one of the related Episodes match this filter\\"\\"\\"
              episodes_SINGLE: EpisodeWhere @deprecated(reason: \\"Please use the relevant generic filter 'episodes: {  single: ... }' instead.\\")
              \\"\\"\\"Return Series where some of the related Episodes match this filter\\"\\"\\"
              episodes_SOME: EpisodeWhere @deprecated(reason: \\"Please use the relevant generic filter 'episodes: {  some: ... }' instead.\\")
              title: StringScalarFilters
              title_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter title: { contains: ... }\\")
              title_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter title: { endsWith: ... }\\")
              title_EQ: String @deprecated(reason: \\"Please use the relevant generic filter title: { eq: ... }\\")
              title_IN: [String!] @deprecated(reason: \\"Please use the relevant generic filter title: { in: ... }\\")
              title_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter title: { startsWith: ... }\\")
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
              seasons: IntScalarAggregationFilters
              seasons_AVERAGE_EQUAL: Float @deprecated(reason: \\"Please use the relevant generic filter 'seasons: { average: { eq: ... } } }' instead.\\")
              seasons_AVERAGE_GT: Float @deprecated(reason: \\"Please use the relevant generic filter 'seasons: { average: { gt: ... } } }' instead.\\")
              seasons_AVERAGE_GTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'seasons: { average: { gte: ... } } }' instead.\\")
              seasons_AVERAGE_LT: Float @deprecated(reason: \\"Please use the relevant generic filter 'seasons: { average: { lt: ... } } }' instead.\\")
              seasons_AVERAGE_LTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'seasons: { average: { lte: ... } } }' instead.\\")
              seasons_MAX_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'seasons: { max: { eq: ... } } }' instead.\\")
              seasons_MAX_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'seasons: { max: { gt: ... } } }' instead.\\")
              seasons_MAX_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'seasons: { max: { gte: ... } } }' instead.\\")
              seasons_MAX_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'seasons: { max: { lt: ... } } }' instead.\\")
              seasons_MAX_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'seasons: { max: { lte: ... } } }' instead.\\")
              seasons_MIN_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'seasons: { min: { eq: ... } } }' instead.\\")
              seasons_MIN_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'seasons: { min: { gt: ... } } }' instead.\\")
              seasons_MIN_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'seasons: { min: { gte: ... } } }' instead.\\")
              seasons_MIN_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'seasons: { min: { lt: ... } } }' instead.\\")
              seasons_MIN_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'seasons: { min: { lte: ... } } }' instead.\\")
              seasons_SUM_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'seasons: { sum: { eq: ... } } }' instead.\\")
              seasons_SUM_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'seasons: { sum: { gt: ... } } }' instead.\\")
              seasons_SUM_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'seasons: { sum: { gte: ... } } }' instead.\\")
              seasons_SUM_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'seasons: { sum: { lt: ... } } }' instead.\\")
              seasons_SUM_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'seasons: { sum: { lte: ... } } }' instead.\\")
            }

            input StarredInCreateInput {
              seasons: Int!
            }

            input StarredInSort {
              seasons: SortDirection
            }

            input StarredInUpdateInput {
              seasons: IntScalarMutations
              seasons_DECREMENT: Int @deprecated(reason: \\"Please use the relevant generic mutation 'seasons: { decrement: ... } }' instead.\\")
              seasons_INCREMENT: Int @deprecated(reason: \\"Please use the relevant generic mutation 'seasons: { increment: ... } }' instead.\\")
              seasons_SET: Int @deprecated(reason: \\"Please use the generic mutation 'seasons: { set: ... } }' instead.\\")
            }

            input StarredInWhere {
              AND: [StarredInWhere!]
              NOT: StarredInWhere
              OR: [StarredInWhere!]
              seasons: IntScalarFilters
              seasons_EQ: Int @deprecated(reason: \\"Please use the relevant generic filter seasons: { eq: ... }\\")
              seasons_GT: Int @deprecated(reason: \\"Please use the relevant generic filter seasons: { gt: ... }\\")
              seasons_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter seasons: { gte: ... }\\")
              seasons_IN: [Int!] @deprecated(reason: \\"Please use the relevant generic filter seasons: { in: ... }\\")
              seasons_LT: Int @deprecated(reason: \\"Please use the relevant generic filter seasons: { lt: ... }\\")
              seasons_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter seasons: { lte: ... }\\")
            }

            type StringAggregateSelection {
              longest: String
              shortest: String
            }

            \\"\\"\\"Filters for an aggregation of a string field\\"\\"\\"
            input StringScalarAggregationFilters {
              averageLength: FloatScalarFilters
              longestLength: IntScalarFilters
              shortestLength: IntScalarFilters
            }

            \\"\\"\\"String filters\\"\\"\\"
            input StringScalarFilters {
              contains: String
              endsWith: String
              eq: String
              in: [String!]
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

            input ConnectionAggregationCountFilterInput {
              edges: IntScalarFilters
              nodes: IntScalarFilters
            }

            type Count {
              nodes: Int!
            }

            type CountConnection {
              edges: Int!
              nodes: Int!
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

            \\"\\"\\"Float filters\\"\\"\\"
            input FloatScalarFilters {
              eq: Float
              gt: Float
              gte: Float
              in: [Float!]
              lt: Float
              lte: Float
            }

            \\"\\"\\"Int filters\\"\\"\\"
            input IntScalarFilters {
              eq: Int
              gt: Int
              gte: Int
              in: [Int!]
              lt: Int
              lte: Int
            }

            interface Interface1 {
              field1: String!
              interface2(limit: Int, offset: Int, sort: [Interface2Sort!], where: Interface2Where): [Interface2!]!
              interface2Connection(after: String, first: Int, sort: [Interface1Interface2ConnectionSort!], where: Interface1Interface2ConnectionWhere): Interface1Interface2Connection!
            }

            type Interface1Aggregate {
              count: Count!
              node: Interface1AggregateNode!
            }

            type Interface1AggregateNode {
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
              count: IntScalarFilters
              count_EQ: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { eq: ... } } }' instead.\\")
              count_GT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gt: ... } } }' instead.\\")
              count_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gte: ... } } }' instead.\\")
              count_LT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lt: ... } } }' instead.\\")
              count_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lte: ... } } }' instead.\\")
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

            input Interface1Interface2ConnectionAggregateInput {
              AND: [Interface1Interface2ConnectionAggregateInput!]
              NOT: Interface1Interface2ConnectionAggregateInput
              OR: [Interface1Interface2ConnectionAggregateInput!]
              count: ConnectionAggregationCountFilterInput
              node: Interface1Interface2NodeAggregationWhereInput
            }

            input Interface1Interface2ConnectionFilters {
              \\"\\"\\"
              Filter Interface1s by aggregating results on related Interface1Interface2Connections
              \\"\\"\\"
              aggregate: Interface1Interface2ConnectionAggregateInput
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
              field2: StringScalarAggregationFilters
              field2_AVERAGE_LENGTH_EQUAL: Float @deprecated(reason: \\"Please use the relevant generic filter 'field2: { averageLength: { eq: ... } } }' instead.\\")
              field2_AVERAGE_LENGTH_GT: Float @deprecated(reason: \\"Please use the relevant generic filter 'field2: { averageLength: { gt: ... } } }' instead.\\")
              field2_AVERAGE_LENGTH_GTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'field2: { averageLength: { gte: ... } } }' instead.\\")
              field2_AVERAGE_LENGTH_LT: Float @deprecated(reason: \\"Please use the relevant generic filter 'field2: { averageLength: { lt: ... } } }' instead.\\")
              field2_AVERAGE_LENGTH_LTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'field2: { averageLength: { lte: ... } } }' instead.\\")
              field2_LONGEST_LENGTH_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'field2: { longestLength: { eq: ... } } }' instead.\\")
              field2_LONGEST_LENGTH_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'field2: { longestLength: { gt: ... } } }' instead.\\")
              field2_LONGEST_LENGTH_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'field2: { longestLength: { gte: ... } } }' instead.\\")
              field2_LONGEST_LENGTH_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'field2: { longestLength: { lt: ... } } }' instead.\\")
              field2_LONGEST_LENGTH_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'field2: { longestLength: { lte: ... } } }' instead.\\")
              field2_SHORTEST_LENGTH_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'field2: { shortestLength: { eq: ... } } }' instead.\\")
              field2_SHORTEST_LENGTH_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'field2: { shortestLength: { gt: ... } } }' instead.\\")
              field2_SHORTEST_LENGTH_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'field2: { shortestLength: { gte: ... } } }' instead.\\")
              field2_SHORTEST_LENGTH_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'field2: { shortestLength: { lt: ... } } }' instead.\\")
              field2_SHORTEST_LENGTH_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'field2: { shortestLength: { lte: ... } } }' instead.\\")
            }

            type Interface1Interface2Relationship {
              cursor: String!
              node: Interface2!
            }

            input Interface1Interface2UpdateConnectionInput {
              node: Interface2UpdateInput
              where: Interface1Interface2ConnectionWhere
            }

            input Interface1Interface2UpdateFieldInput {
              connect: [Interface1Interface2ConnectFieldInput!]
              create: [Interface1Interface2CreateFieldInput!]
              delete: [Interface1Interface2DeleteFieldInput!]
              disconnect: [Interface1Interface2DisconnectFieldInput!]
              update: Interface1Interface2UpdateConnectionInput
            }

            input Interface1RelationshipFilters {
              \\"\\"\\"Filter type where all of the related Interface1s match this filter\\"\\"\\"
              all: Interface1Where
              \\"\\"\\"Filter type where none of the related Interface1s match this filter\\"\\"\\"
              none: Interface1Where
              \\"\\"\\"Filter type where one of the related Interface1s match this filter\\"\\"\\"
              single: Interface1Where
              \\"\\"\\"Filter type where some of the related Interface1s match this filter\\"\\"\\"
              some: Interface1Where
            }

            \\"\\"\\"
            Fields to sort Interface1s by. The order in which sorts are applied is not guaranteed when specifying many fields in one Interface1Sort object.
            \\"\\"\\"
            input Interface1Sort {
              field1: SortDirection
            }

            input Interface1UpdateInput {
              field1: StringScalarMutations
              field1_SET: String @deprecated(reason: \\"Please use the generic mutation 'field1: { set: ... } }' instead.\\")
              interface2: [Interface1Interface2UpdateFieldInput!]
            }

            input Interface1Where {
              AND: [Interface1Where!]
              NOT: Interface1Where
              OR: [Interface1Where!]
              field1: StringScalarFilters
              field1_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter field1: { contains: ... }\\")
              field1_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter field1: { endsWith: ... }\\")
              field1_EQ: String @deprecated(reason: \\"Please use the relevant generic filter field1: { eq: ... }\\")
              field1_IN: [String!] @deprecated(reason: \\"Please use the relevant generic filter field1: { in: ... }\\")
              field1_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter field1: { startsWith: ... }\\")
              interface2: Interface2RelationshipFilters
              interface2Aggregate: Interface1Interface2AggregateInput @deprecated(reason: \\"Aggregate filters are moved inside the interface2Connection filter, please use { interface2Connection: { aggregate: {...} } } instead\\")
              interface2Connection: Interface1Interface2ConnectionFilters
              \\"\\"\\"
              Return Interface1s where all of the related Interface1Interface2Connections match this filter
              \\"\\"\\"
              interface2Connection_ALL: Interface1Interface2ConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'interface2Connection: { all: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Interface1s where none of the related Interface1Interface2Connections match this filter
              \\"\\"\\"
              interface2Connection_NONE: Interface1Interface2ConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'interface2Connection: { none: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Interface1s where one of the related Interface1Interface2Connections match this filter
              \\"\\"\\"
              interface2Connection_SINGLE: Interface1Interface2ConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'interface2Connection: { single: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Interface1s where some of the related Interface1Interface2Connections match this filter
              \\"\\"\\"
              interface2Connection_SOME: Interface1Interface2ConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'interface2Connection: { some: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Interface1s where all of the related Interface2s match this filter
              \\"\\"\\"
              interface2_ALL: Interface2Where @deprecated(reason: \\"Please use the relevant generic filter 'interface2: { all: ... }' instead.\\")
              \\"\\"\\"
              Return Interface1s where none of the related Interface2s match this filter
              \\"\\"\\"
              interface2_NONE: Interface2Where @deprecated(reason: \\"Please use the relevant generic filter 'interface2: { none: ... }' instead.\\")
              \\"\\"\\"
              Return Interface1s where one of the related Interface2s match this filter
              \\"\\"\\"
              interface2_SINGLE: Interface2Where @deprecated(reason: \\"Please use the relevant generic filter 'interface2: {  single: ... }' instead.\\")
              \\"\\"\\"
              Return Interface1s where some of the related Interface2s match this filter
              \\"\\"\\"
              interface2_SOME: Interface2Where @deprecated(reason: \\"Please use the relevant generic filter 'interface2: {  some: ... }' instead.\\")
              typename: [Interface1Implementation!]
            }

            type Interface1sConnection {
              aggregate: Interface1Aggregate!
              edges: [Interface1Edge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            interface Interface2 {
              field2: String
            }

            type Interface2Aggregate {
              count: Count!
              node: Interface2AggregateNode!
            }

            type Interface2AggregateNode {
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

            input Interface2RelationshipFilters {
              \\"\\"\\"Filter type where all of the related Interface2s match this filter\\"\\"\\"
              all: Interface2Where
              \\"\\"\\"Filter type where none of the related Interface2s match this filter\\"\\"\\"
              none: Interface2Where
              \\"\\"\\"Filter type where one of the related Interface2s match this filter\\"\\"\\"
              single: Interface2Where
              \\"\\"\\"Filter type where some of the related Interface2s match this filter\\"\\"\\"
              some: Interface2Where
            }

            \\"\\"\\"
            Fields to sort Interface2s by. The order in which sorts are applied is not guaranteed when specifying many fields in one Interface2Sort object.
            \\"\\"\\"
            input Interface2Sort {
              field2: SortDirection
            }

            input Interface2UpdateInput {
              field2: StringScalarMutations
              field2_SET: String @deprecated(reason: \\"Please use the generic mutation 'field2: { set: ... } }' instead.\\")
            }

            input Interface2Where {
              AND: [Interface2Where!]
              NOT: Interface2Where
              OR: [Interface2Where!]
              field2: StringScalarFilters
              field2_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter field2: { contains: ... }\\")
              field2_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter field2: { endsWith: ... }\\")
              field2_EQ: String @deprecated(reason: \\"Please use the relevant generic filter field2: { eq: ... }\\")
              field2_IN: [String] @deprecated(reason: \\"Please use the relevant generic filter field2: { in: ... }\\")
              field2_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter field2: { startsWith: ... }\\")
              typename: [Interface2Implementation!]
            }

            type Interface2sConnection {
              aggregate: Interface2Aggregate!
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
              interface1sConnection(after: String, first: Int, sort: [Interface1Sort!], where: Interface1Where): Interface1sConnection!
              interface2s(limit: Int, offset: Int, sort: [Interface2Sort!], where: Interface2Where): [Interface2!]!
              interface2sConnection(after: String, first: Int, sort: [Interface2Sort!], where: Interface2Where): Interface2sConnection!
              type1Interface1s(limit: Int, offset: Int, sort: [Type1Interface1Sort!], where: Type1Interface1Where): [Type1Interface1!]!
              type1Interface1sConnection(after: String, first: Int, sort: [Type1Interface1Sort!], where: Type1Interface1Where): Type1Interface1sConnection!
              type1Interface2s(limit: Int, offset: Int, sort: [Type1Interface2Sort!], where: Type1Interface2Where): [Type1Interface2!]!
              type1Interface2sConnection(after: String, first: Int, sort: [Type1Interface2Sort!], where: Type1Interface2Where): Type1Interface2sConnection!
              type1s(limit: Int, offset: Int, sort: [Type1Sort!], where: Type1Where): [Type1!]!
              type1sConnection(after: String, first: Int, sort: [Type1Sort!], where: Type1Where): Type1sConnection!
              type2Interface1s(limit: Int, offset: Int, sort: [Type2Interface1Sort!], where: Type2Interface1Where): [Type2Interface1!]!
              type2Interface1sConnection(after: String, first: Int, sort: [Type2Interface1Sort!], where: Type2Interface1Where): Type2Interface1sConnection!
              type2Interface2s(limit: Int, offset: Int, sort: [Type2Interface2Sort!], where: Type2Interface2Where): [Type2Interface2!]!
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

            \\"\\"\\"Filters for an aggregation of a string field\\"\\"\\"
            input StringScalarAggregationFilters {
              averageLength: FloatScalarFilters
              longestLength: IntScalarFilters
              shortestLength: IntScalarFilters
            }

            \\"\\"\\"String filters\\"\\"\\"
            input StringScalarFilters {
              contains: String
              endsWith: String
              eq: String
              in: [String!]
              startsWith: String
            }

            \\"\\"\\"String mutations\\"\\"\\"
            input StringScalarMutations {
              set: String
            }

            type Type1 {
              field1: String!
              interface1(limit: Int, offset: Int, sort: [Interface1Sort!], where: Interface1Where): [Interface1!]!
              interface1Connection(after: String, first: Int, sort: [Type1Interface1ConnectionSort!], where: Type1Interface1ConnectionWhere): Type1Interface1Connection!
            }

            type Type1Aggregate {
              count: Count!
              node: Type1AggregateNode!
            }

            type Type1AggregateNode {
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
              interface2Connection(after: String, first: Int, sort: [Interface1Interface2ConnectionSort!], where: Interface1Interface2ConnectionWhere): Interface1Interface2Connection!
            }

            type Type1Interface1Aggregate {
              count: Count!
              node: Type1Interface1AggregateNode!
            }

            input Type1Interface1AggregateInput {
              AND: [Type1Interface1AggregateInput!]
              NOT: Type1Interface1AggregateInput
              OR: [Type1Interface1AggregateInput!]
              count: IntScalarFilters
              count_EQ: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { eq: ... } } }' instead.\\")
              count_GT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gt: ... } } }' instead.\\")
              count_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gte: ... } } }' instead.\\")
              count_LT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lt: ... } } }' instead.\\")
              count_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lte: ... } } }' instead.\\")
              node: Type1Interface1NodeAggregationWhereInput
            }

            type Type1Interface1AggregateNode {
              field1: StringAggregateSelection!
            }

            input Type1Interface1ConnectFieldInput {
              connect: Interface1ConnectInput
              where: Interface1ConnectWhere
            }

            type Type1Interface1Connection {
              aggregate: Type1Interface1Interface1AggregateSelection!
              edges: [Type1Interface1Relationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input Type1Interface1ConnectionAggregateInput {
              AND: [Type1Interface1ConnectionAggregateInput!]
              NOT: Type1Interface1ConnectionAggregateInput
              OR: [Type1Interface1ConnectionAggregateInput!]
              count: ConnectionAggregationCountFilterInput
              node: Type1Interface1NodeAggregationWhereInput
            }

            input Type1Interface1ConnectionFilters {
              \\"\\"\\"
              Filter Type1s by aggregating results on related Type1Interface1Connections
              \\"\\"\\"
              aggregate: Type1Interface1ConnectionAggregateInput
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

            type Type1Interface1Interface1AggregateSelection {
              count: CountConnection!
              node: Type1Interface1Interface1NodeAggregateSelection
            }

            type Type1Interface1Interface1NodeAggregateSelection {
              field1: StringAggregateSelection!
            }

            input Type1Interface1Interface2AggregateInput {
              AND: [Type1Interface1Interface2AggregateInput!]
              NOT: Type1Interface1Interface2AggregateInput
              OR: [Type1Interface1Interface2AggregateInput!]
              count: IntScalarFilters
              count_EQ: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { eq: ... } } }' instead.\\")
              count_GT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gt: ... } } }' instead.\\")
              count_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gte: ... } } }' instead.\\")
              count_LT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lt: ... } } }' instead.\\")
              count_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lte: ... } } }' instead.\\")
              node: Type1Interface1Interface2NodeAggregationWhereInput
            }

            input Type1Interface1Interface2ConnectFieldInput {
              where: Interface2ConnectWhere
            }

            input Type1Interface1Interface2ConnectionAggregateInput {
              AND: [Type1Interface1Interface2ConnectionAggregateInput!]
              NOT: Type1Interface1Interface2ConnectionAggregateInput
              OR: [Type1Interface1Interface2ConnectionAggregateInput!]
              count: ConnectionAggregationCountFilterInput
              node: Type1Interface1Interface2NodeAggregationWhereInput
            }

            input Type1Interface1Interface2ConnectionFilters {
              \\"\\"\\"
              Filter Type1Interface1s by aggregating results on related Interface1Interface2Connections
              \\"\\"\\"
              aggregate: Type1Interface1Interface2ConnectionAggregateInput
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

            input Type1Interface1Interface2NodeAggregationWhereInput {
              AND: [Type1Interface1Interface2NodeAggregationWhereInput!]
              NOT: Type1Interface1Interface2NodeAggregationWhereInput
              OR: [Type1Interface1Interface2NodeAggregationWhereInput!]
              field2: StringScalarAggregationFilters
              field2_AVERAGE_LENGTH_EQUAL: Float @deprecated(reason: \\"Please use the relevant generic filter 'field2: { averageLength: { eq: ... } } }' instead.\\")
              field2_AVERAGE_LENGTH_GT: Float @deprecated(reason: \\"Please use the relevant generic filter 'field2: { averageLength: { gt: ... } } }' instead.\\")
              field2_AVERAGE_LENGTH_GTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'field2: { averageLength: { gte: ... } } }' instead.\\")
              field2_AVERAGE_LENGTH_LT: Float @deprecated(reason: \\"Please use the relevant generic filter 'field2: { averageLength: { lt: ... } } }' instead.\\")
              field2_AVERAGE_LENGTH_LTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'field2: { averageLength: { lte: ... } } }' instead.\\")
              field2_LONGEST_LENGTH_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'field2: { longestLength: { eq: ... } } }' instead.\\")
              field2_LONGEST_LENGTH_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'field2: { longestLength: { gt: ... } } }' instead.\\")
              field2_LONGEST_LENGTH_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'field2: { longestLength: { gte: ... } } }' instead.\\")
              field2_LONGEST_LENGTH_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'field2: { longestLength: { lt: ... } } }' instead.\\")
              field2_LONGEST_LENGTH_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'field2: { longestLength: { lte: ... } } }' instead.\\")
              field2_SHORTEST_LENGTH_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'field2: { shortestLength: { eq: ... } } }' instead.\\")
              field2_SHORTEST_LENGTH_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'field2: { shortestLength: { gt: ... } } }' instead.\\")
              field2_SHORTEST_LENGTH_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'field2: { shortestLength: { gte: ... } } }' instead.\\")
              field2_SHORTEST_LENGTH_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'field2: { shortestLength: { lt: ... } } }' instead.\\")
              field2_SHORTEST_LENGTH_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'field2: { shortestLength: { lte: ... } } }' instead.\\")
            }

            input Type1Interface1Interface2UpdateConnectionInput {
              node: Interface2UpdateInput
              where: Interface1Interface2ConnectionWhere
            }

            input Type1Interface1Interface2UpdateFieldInput {
              connect: [Type1Interface1Interface2ConnectFieldInput!]
              create: [Type1Interface1Interface2CreateFieldInput!]
              delete: [Type1Interface1Interface2DeleteFieldInput!]
              disconnect: [Type1Interface1Interface2DisconnectFieldInput!]
              update: Type1Interface1Interface2UpdateConnectionInput
            }

            input Type1Interface1NodeAggregationWhereInput {
              AND: [Type1Interface1NodeAggregationWhereInput!]
              NOT: Type1Interface1NodeAggregationWhereInput
              OR: [Type1Interface1NodeAggregationWhereInput!]
              field1: StringScalarAggregationFilters
              field1_AVERAGE_LENGTH_EQUAL: Float @deprecated(reason: \\"Please use the relevant generic filter 'field1: { averageLength: { eq: ... } } }' instead.\\")
              field1_AVERAGE_LENGTH_GT: Float @deprecated(reason: \\"Please use the relevant generic filter 'field1: { averageLength: { gt: ... } } }' instead.\\")
              field1_AVERAGE_LENGTH_GTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'field1: { averageLength: { gte: ... } } }' instead.\\")
              field1_AVERAGE_LENGTH_LT: Float @deprecated(reason: \\"Please use the relevant generic filter 'field1: { averageLength: { lt: ... } } }' instead.\\")
              field1_AVERAGE_LENGTH_LTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'field1: { averageLength: { lte: ... } } }' instead.\\")
              field1_LONGEST_LENGTH_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'field1: { longestLength: { eq: ... } } }' instead.\\")
              field1_LONGEST_LENGTH_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'field1: { longestLength: { gt: ... } } }' instead.\\")
              field1_LONGEST_LENGTH_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'field1: { longestLength: { gte: ... } } }' instead.\\")
              field1_LONGEST_LENGTH_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'field1: { longestLength: { lt: ... } } }' instead.\\")
              field1_LONGEST_LENGTH_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'field1: { longestLength: { lte: ... } } }' instead.\\")
              field1_SHORTEST_LENGTH_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'field1: { shortestLength: { eq: ... } } }' instead.\\")
              field1_SHORTEST_LENGTH_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'field1: { shortestLength: { gt: ... } } }' instead.\\")
              field1_SHORTEST_LENGTH_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'field1: { shortestLength: { gte: ... } } }' instead.\\")
              field1_SHORTEST_LENGTH_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'field1: { shortestLength: { lt: ... } } }' instead.\\")
              field1_SHORTEST_LENGTH_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'field1: { shortestLength: { lte: ... } } }' instead.\\")
            }

            type Type1Interface1Relationship {
              cursor: String!
              node: Interface1!
            }

            \\"\\"\\"
            Fields to sort Type1Interface1s by. The order in which sorts are applied is not guaranteed when specifying many fields in one Type1Interface1Sort object.
            \\"\\"\\"
            input Type1Interface1Sort {
              field1: SortDirection
            }

            input Type1Interface1UpdateConnectionInput {
              node: Interface1UpdateInput
              where: Type1Interface1ConnectionWhere
            }

            input Type1Interface1UpdateFieldInput {
              connect: [Type1Interface1ConnectFieldInput!]
              create: [Type1Interface1CreateFieldInput!]
              delete: [Type1Interface1DeleteFieldInput!]
              disconnect: [Type1Interface1DisconnectFieldInput!]
              update: Type1Interface1UpdateConnectionInput
            }

            input Type1Interface1UpdateInput {
              field1: StringScalarMutations
              field1_SET: String @deprecated(reason: \\"Please use the generic mutation 'field1: { set: ... } }' instead.\\")
              interface2: [Type1Interface1Interface2UpdateFieldInput!]
            }

            input Type1Interface1Where {
              AND: [Type1Interface1Where!]
              NOT: Type1Interface1Where
              OR: [Type1Interface1Where!]
              field1: StringScalarFilters
              field1_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter field1: { contains: ... }\\")
              field1_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter field1: { endsWith: ... }\\")
              field1_EQ: String @deprecated(reason: \\"Please use the relevant generic filter field1: { eq: ... }\\")
              field1_IN: [String!] @deprecated(reason: \\"Please use the relevant generic filter field1: { in: ... }\\")
              field1_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter field1: { startsWith: ... }\\")
              interface2: Interface2RelationshipFilters
              interface2Aggregate: Type1Interface1Interface2AggregateInput @deprecated(reason: \\"Aggregate filters are moved inside the interface2Connection filter, please use { interface2Connection: { aggregate: {...} } } instead\\")
              interface2Connection: Type1Interface1Interface2ConnectionFilters
              \\"\\"\\"
              Return Type1Interface1s where all of the related Interface1Interface2Connections match this filter
              \\"\\"\\"
              interface2Connection_ALL: Interface1Interface2ConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'interface2Connection: { all: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Type1Interface1s where none of the related Interface1Interface2Connections match this filter
              \\"\\"\\"
              interface2Connection_NONE: Interface1Interface2ConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'interface2Connection: { none: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Type1Interface1s where one of the related Interface1Interface2Connections match this filter
              \\"\\"\\"
              interface2Connection_SINGLE: Interface1Interface2ConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'interface2Connection: { single: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Type1Interface1s where some of the related Interface1Interface2Connections match this filter
              \\"\\"\\"
              interface2Connection_SOME: Interface1Interface2ConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'interface2Connection: { some: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Type1Interface1s where all of the related Interface2s match this filter
              \\"\\"\\"
              interface2_ALL: Interface2Where @deprecated(reason: \\"Please use the relevant generic filter 'interface2: { all: ... }' instead.\\")
              \\"\\"\\"
              Return Type1Interface1s where none of the related Interface2s match this filter
              \\"\\"\\"
              interface2_NONE: Interface2Where @deprecated(reason: \\"Please use the relevant generic filter 'interface2: { none: ... }' instead.\\")
              \\"\\"\\"
              Return Type1Interface1s where one of the related Interface2s match this filter
              \\"\\"\\"
              interface2_SINGLE: Interface2Where @deprecated(reason: \\"Please use the relevant generic filter 'interface2: {  single: ... }' instead.\\")
              \\"\\"\\"
              Return Type1Interface1s where some of the related Interface2s match this filter
              \\"\\"\\"
              interface2_SOME: Interface2Where @deprecated(reason: \\"Please use the relevant generic filter 'interface2: {  some: ... }' instead.\\")
            }

            type Type1Interface1sConnection {
              aggregate: Type1Interface1Aggregate!
              edges: [Type1Interface1Edge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            type Type1Interface2 implements Interface2 {
              field2: String!
            }

            type Type1Interface2Aggregate {
              count: Count!
              node: Type1Interface2AggregateNode!
            }

            type Type1Interface2AggregateNode {
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
              field2: StringScalarMutations
              field2_SET: String @deprecated(reason: \\"Please use the generic mutation 'field2: { set: ... } }' instead.\\")
            }

            input Type1Interface2Where {
              AND: [Type1Interface2Where!]
              NOT: Type1Interface2Where
              OR: [Type1Interface2Where!]
              field2: StringScalarFilters
              field2_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter field2: { contains: ... }\\")
              field2_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter field2: { endsWith: ... }\\")
              field2_EQ: String @deprecated(reason: \\"Please use the relevant generic filter field2: { eq: ... }\\")
              field2_IN: [String!] @deprecated(reason: \\"Please use the relevant generic filter field2: { in: ... }\\")
              field2_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter field2: { startsWith: ... }\\")
            }

            type Type1Interface2sConnection {
              aggregate: Type1Interface2Aggregate!
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
              field1: StringScalarMutations
              field1_SET: String @deprecated(reason: \\"Please use the generic mutation 'field1: { set: ... } }' instead.\\")
              interface1: [Type1Interface1UpdateFieldInput!]
            }

            input Type1Where {
              AND: [Type1Where!]
              NOT: Type1Where
              OR: [Type1Where!]
              field1: StringScalarFilters
              field1_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter field1: { contains: ... }\\")
              field1_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter field1: { endsWith: ... }\\")
              field1_EQ: String @deprecated(reason: \\"Please use the relevant generic filter field1: { eq: ... }\\")
              field1_IN: [String!] @deprecated(reason: \\"Please use the relevant generic filter field1: { in: ... }\\")
              field1_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter field1: { startsWith: ... }\\")
              interface1: Interface1RelationshipFilters
              interface1Aggregate: Type1Interface1AggregateInput @deprecated(reason: \\"Aggregate filters are moved inside the interface1Connection filter, please use { interface1Connection: { aggregate: {...} } } instead\\")
              interface1Connection: Type1Interface1ConnectionFilters
              \\"\\"\\"
              Return Type1s where all of the related Type1Interface1Connections match this filter
              \\"\\"\\"
              interface1Connection_ALL: Type1Interface1ConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'interface1Connection: { all: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Type1s where none of the related Type1Interface1Connections match this filter
              \\"\\"\\"
              interface1Connection_NONE: Type1Interface1ConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'interface1Connection: { none: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Type1s where one of the related Type1Interface1Connections match this filter
              \\"\\"\\"
              interface1Connection_SINGLE: Type1Interface1ConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'interface1Connection: { single: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Type1s where some of the related Type1Interface1Connections match this filter
              \\"\\"\\"
              interface1Connection_SOME: Type1Interface1ConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'interface1Connection: { some: { node: ... } } }' instead.\\")
              \\"\\"\\"Return Type1s where all of the related Interface1s match this filter\\"\\"\\"
              interface1_ALL: Interface1Where @deprecated(reason: \\"Please use the relevant generic filter 'interface1: { all: ... }' instead.\\")
              \\"\\"\\"Return Type1s where none of the related Interface1s match this filter\\"\\"\\"
              interface1_NONE: Interface1Where @deprecated(reason: \\"Please use the relevant generic filter 'interface1: { none: ... }' instead.\\")
              \\"\\"\\"Return Type1s where one of the related Interface1s match this filter\\"\\"\\"
              interface1_SINGLE: Interface1Where @deprecated(reason: \\"Please use the relevant generic filter 'interface1: {  single: ... }' instead.\\")
              \\"\\"\\"Return Type1s where some of the related Interface1s match this filter\\"\\"\\"
              interface1_SOME: Interface1Where @deprecated(reason: \\"Please use the relevant generic filter 'interface1: {  some: ... }' instead.\\")
            }

            type Type1sConnection {
              aggregate: Type1Aggregate!
              edges: [Type1Edge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            type Type2Interface1 implements Interface1 {
              field1: String!
              interface2(limit: Int, offset: Int, sort: [Interface2Sort!], where: Interface2Where): [Interface2!]!
              interface2Connection(after: String, first: Int, sort: [Interface1Interface2ConnectionSort!], where: Interface1Interface2ConnectionWhere): Interface1Interface2Connection!
            }

            type Type2Interface1Aggregate {
              count: Count!
              node: Type2Interface1AggregateNode!
            }

            type Type2Interface1AggregateNode {
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
              count: IntScalarFilters
              count_EQ: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { eq: ... } } }' instead.\\")
              count_GT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gt: ... } } }' instead.\\")
              count_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gte: ... } } }' instead.\\")
              count_LT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lt: ... } } }' instead.\\")
              count_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lte: ... } } }' instead.\\")
              node: Type2Interface1Interface2NodeAggregationWhereInput
            }

            input Type2Interface1Interface2ConnectFieldInput {
              where: Interface2ConnectWhere
            }

            input Type2Interface1Interface2ConnectionAggregateInput {
              AND: [Type2Interface1Interface2ConnectionAggregateInput!]
              NOT: Type2Interface1Interface2ConnectionAggregateInput
              OR: [Type2Interface1Interface2ConnectionAggregateInput!]
              count: ConnectionAggregationCountFilterInput
              node: Type2Interface1Interface2NodeAggregationWhereInput
            }

            input Type2Interface1Interface2ConnectionFilters {
              \\"\\"\\"
              Filter Type2Interface1s by aggregating results on related Interface1Interface2Connections
              \\"\\"\\"
              aggregate: Type2Interface1Interface2ConnectionAggregateInput
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

            input Type2Interface1Interface2NodeAggregationWhereInput {
              AND: [Type2Interface1Interface2NodeAggregationWhereInput!]
              NOT: Type2Interface1Interface2NodeAggregationWhereInput
              OR: [Type2Interface1Interface2NodeAggregationWhereInput!]
              field2: StringScalarAggregationFilters
              field2_AVERAGE_LENGTH_EQUAL: Float @deprecated(reason: \\"Please use the relevant generic filter 'field2: { averageLength: { eq: ... } } }' instead.\\")
              field2_AVERAGE_LENGTH_GT: Float @deprecated(reason: \\"Please use the relevant generic filter 'field2: { averageLength: { gt: ... } } }' instead.\\")
              field2_AVERAGE_LENGTH_GTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'field2: { averageLength: { gte: ... } } }' instead.\\")
              field2_AVERAGE_LENGTH_LT: Float @deprecated(reason: \\"Please use the relevant generic filter 'field2: { averageLength: { lt: ... } } }' instead.\\")
              field2_AVERAGE_LENGTH_LTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'field2: { averageLength: { lte: ... } } }' instead.\\")
              field2_LONGEST_LENGTH_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'field2: { longestLength: { eq: ... } } }' instead.\\")
              field2_LONGEST_LENGTH_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'field2: { longestLength: { gt: ... } } }' instead.\\")
              field2_LONGEST_LENGTH_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'field2: { longestLength: { gte: ... } } }' instead.\\")
              field2_LONGEST_LENGTH_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'field2: { longestLength: { lt: ... } } }' instead.\\")
              field2_LONGEST_LENGTH_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'field2: { longestLength: { lte: ... } } }' instead.\\")
              field2_SHORTEST_LENGTH_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'field2: { shortestLength: { eq: ... } } }' instead.\\")
              field2_SHORTEST_LENGTH_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'field2: { shortestLength: { gt: ... } } }' instead.\\")
              field2_SHORTEST_LENGTH_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'field2: { shortestLength: { gte: ... } } }' instead.\\")
              field2_SHORTEST_LENGTH_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'field2: { shortestLength: { lt: ... } } }' instead.\\")
              field2_SHORTEST_LENGTH_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'field2: { shortestLength: { lte: ... } } }' instead.\\")
            }

            input Type2Interface1Interface2UpdateConnectionInput {
              node: Interface2UpdateInput
              where: Interface1Interface2ConnectionWhere
            }

            input Type2Interface1Interface2UpdateFieldInput {
              connect: [Type2Interface1Interface2ConnectFieldInput!]
              create: [Type2Interface1Interface2CreateFieldInput!]
              delete: [Type2Interface1Interface2DeleteFieldInput!]
              disconnect: [Type2Interface1Interface2DisconnectFieldInput!]
              update: Type2Interface1Interface2UpdateConnectionInput
            }

            \\"\\"\\"
            Fields to sort Type2Interface1s by. The order in which sorts are applied is not guaranteed when specifying many fields in one Type2Interface1Sort object.
            \\"\\"\\"
            input Type2Interface1Sort {
              field1: SortDirection
            }

            input Type2Interface1UpdateInput {
              field1: StringScalarMutations
              field1_SET: String @deprecated(reason: \\"Please use the generic mutation 'field1: { set: ... } }' instead.\\")
              interface2: [Type2Interface1Interface2UpdateFieldInput!]
            }

            input Type2Interface1Where {
              AND: [Type2Interface1Where!]
              NOT: Type2Interface1Where
              OR: [Type2Interface1Where!]
              field1: StringScalarFilters
              field1_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter field1: { contains: ... }\\")
              field1_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter field1: { endsWith: ... }\\")
              field1_EQ: String @deprecated(reason: \\"Please use the relevant generic filter field1: { eq: ... }\\")
              field1_IN: [String!] @deprecated(reason: \\"Please use the relevant generic filter field1: { in: ... }\\")
              field1_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter field1: { startsWith: ... }\\")
              interface2: Interface2RelationshipFilters
              interface2Aggregate: Type2Interface1Interface2AggregateInput @deprecated(reason: \\"Aggregate filters are moved inside the interface2Connection filter, please use { interface2Connection: { aggregate: {...} } } instead\\")
              interface2Connection: Type2Interface1Interface2ConnectionFilters
              \\"\\"\\"
              Return Type2Interface1s where all of the related Interface1Interface2Connections match this filter
              \\"\\"\\"
              interface2Connection_ALL: Interface1Interface2ConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'interface2Connection: { all: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Type2Interface1s where none of the related Interface1Interface2Connections match this filter
              \\"\\"\\"
              interface2Connection_NONE: Interface1Interface2ConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'interface2Connection: { none: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Type2Interface1s where one of the related Interface1Interface2Connections match this filter
              \\"\\"\\"
              interface2Connection_SINGLE: Interface1Interface2ConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'interface2Connection: { single: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Type2Interface1s where some of the related Interface1Interface2Connections match this filter
              \\"\\"\\"
              interface2Connection_SOME: Interface1Interface2ConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'interface2Connection: { some: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Type2Interface1s where all of the related Interface2s match this filter
              \\"\\"\\"
              interface2_ALL: Interface2Where @deprecated(reason: \\"Please use the relevant generic filter 'interface2: { all: ... }' instead.\\")
              \\"\\"\\"
              Return Type2Interface1s where none of the related Interface2s match this filter
              \\"\\"\\"
              interface2_NONE: Interface2Where @deprecated(reason: \\"Please use the relevant generic filter 'interface2: { none: ... }' instead.\\")
              \\"\\"\\"
              Return Type2Interface1s where one of the related Interface2s match this filter
              \\"\\"\\"
              interface2_SINGLE: Interface2Where @deprecated(reason: \\"Please use the relevant generic filter 'interface2: {  single: ... }' instead.\\")
              \\"\\"\\"
              Return Type2Interface1s where some of the related Interface2s match this filter
              \\"\\"\\"
              interface2_SOME: Interface2Where @deprecated(reason: \\"Please use the relevant generic filter 'interface2: {  some: ... }' instead.\\")
            }

            type Type2Interface1sConnection {
              aggregate: Type2Interface1Aggregate!
              edges: [Type2Interface1Edge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            type Type2Interface2 implements Interface2 {
              field2: String!
            }

            type Type2Interface2Aggregate {
              count: Count!
              node: Type2Interface2AggregateNode!
            }

            type Type2Interface2AggregateNode {
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
              field2: StringScalarMutations
              field2_SET: String @deprecated(reason: \\"Please use the generic mutation 'field2: { set: ... } }' instead.\\")
            }

            input Type2Interface2Where {
              AND: [Type2Interface2Where!]
              NOT: Type2Interface2Where
              OR: [Type2Interface2Where!]
              field2: StringScalarFilters
              field2_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter field2: { contains: ... }\\")
              field2_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter field2: { endsWith: ... }\\")
              field2_EQ: String @deprecated(reason: \\"Please use the relevant generic filter field2: { eq: ... }\\")
              field2_IN: [String!] @deprecated(reason: \\"Please use the relevant generic filter field2: { in: ... }\\")
              field2_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter field2: { startsWith: ... }\\")
            }

            type Type2Interface2sConnection {
              aggregate: Type2Interface2Aggregate!
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

            input ConnectionAggregationCountFilterInput {
              edges: IntScalarFilters
              nodes: IntScalarFilters
            }

            type Count {
              nodes: Int!
            }

            type CountConnection {
              edges: Int!
              nodes: Int!
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

            \\"\\"\\"Float filters\\"\\"\\"
            input FloatScalarFilters {
              eq: Float
              gt: Float
              gte: Float
              in: [Float!]
              lt: Float
              lte: Float
            }

            \\"\\"\\"Filters for an aggregation of an int field\\"\\"\\"
            input IntScalarAggregationFilters {
              average: FloatScalarFilters
              max: IntScalarFilters
              min: IntScalarFilters
              sum: IntScalarFilters
            }

            \\"\\"\\"Int filters\\"\\"\\"
            input IntScalarFilters {
              eq: Int
              gt: Int
              gte: Int
              in: [Int!]
              lt: Int
              lte: Int
            }

            \\"\\"\\"Int mutations\\"\\"\\"
            input IntScalarMutations {
              add: Int
              set: Int
              subtract: Int
            }

            interface Interface1 {
              field1: String!
              interface2(limit: Int, offset: Int, sort: [Interface2Sort!], where: Interface2Where): [Interface2!]!
              interface2Connection(after: String, first: Int, sort: [Interface1Interface2ConnectionSort!], where: Interface1Interface2ConnectionWhere): Interface1Interface2Connection!
            }

            type Interface1Aggregate {
              count: Count!
              node: Interface1AggregateNode!
            }

            type Interface1AggregateNode {
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
              count: IntScalarFilters
              count_EQ: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { eq: ... } } }' instead.\\")
              count_GT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gt: ... } } }' instead.\\")
              count_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gte: ... } } }' instead.\\")
              count_LT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lt: ... } } }' instead.\\")
              count_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lte: ... } } }' instead.\\")
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

            input Interface1Interface2ConnectionAggregateInput {
              AND: [Interface1Interface2ConnectionAggregateInput!]
              NOT: Interface1Interface2ConnectionAggregateInput
              OR: [Interface1Interface2ConnectionAggregateInput!]
              count: ConnectionAggregationCountFilterInput
              edge: Interface1Interface2EdgeAggregationWhereInput
              node: Interface1Interface2NodeAggregationWhereInput
            }

            input Interface1Interface2ConnectionFilters {
              \\"\\"\\"
              Filter Interface1s by aggregating results on related Interface1Interface2Connections
              \\"\\"\\"
              aggregate: Interface1Interface2ConnectionAggregateInput
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
              field2: StringScalarAggregationFilters
              field2_AVERAGE_LENGTH_EQUAL: Float @deprecated(reason: \\"Please use the relevant generic filter 'field2: { averageLength: { eq: ... } } }' instead.\\")
              field2_AVERAGE_LENGTH_GT: Float @deprecated(reason: \\"Please use the relevant generic filter 'field2: { averageLength: { gt: ... } } }' instead.\\")
              field2_AVERAGE_LENGTH_GTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'field2: { averageLength: { gte: ... } } }' instead.\\")
              field2_AVERAGE_LENGTH_LT: Float @deprecated(reason: \\"Please use the relevant generic filter 'field2: { averageLength: { lt: ... } } }' instead.\\")
              field2_AVERAGE_LENGTH_LTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'field2: { averageLength: { lte: ... } } }' instead.\\")
              field2_LONGEST_LENGTH_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'field2: { longestLength: { eq: ... } } }' instead.\\")
              field2_LONGEST_LENGTH_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'field2: { longestLength: { gt: ... } } }' instead.\\")
              field2_LONGEST_LENGTH_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'field2: { longestLength: { gte: ... } } }' instead.\\")
              field2_LONGEST_LENGTH_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'field2: { longestLength: { lt: ... } } }' instead.\\")
              field2_LONGEST_LENGTH_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'field2: { longestLength: { lte: ... } } }' instead.\\")
              field2_SHORTEST_LENGTH_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'field2: { shortestLength: { eq: ... } } }' instead.\\")
              field2_SHORTEST_LENGTH_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'field2: { shortestLength: { gt: ... } } }' instead.\\")
              field2_SHORTEST_LENGTH_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'field2: { shortestLength: { gte: ... } } }' instead.\\")
              field2_SHORTEST_LENGTH_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'field2: { shortestLength: { lt: ... } } }' instead.\\")
              field2_SHORTEST_LENGTH_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'field2: { shortestLength: { lte: ... } } }' instead.\\")
            }

            type Interface1Interface2Relationship {
              cursor: String!
              node: Interface2!
              properties: Interface1Interface2RelationshipProperties!
            }

            union Interface1Interface2RelationshipProperties = Props

            input Interface1Interface2UpdateConnectionInput {
              edge: Interface1Interface2EdgeUpdateInput
              node: Interface2UpdateInput
              where: Interface1Interface2ConnectionWhere
            }

            input Interface1Interface2UpdateFieldInput {
              connect: [Interface1Interface2ConnectFieldInput!]
              create: [Interface1Interface2CreateFieldInput!]
              delete: [Interface1Interface2DeleteFieldInput!]
              disconnect: [Interface1Interface2DisconnectFieldInput!]
              update: Interface1Interface2UpdateConnectionInput
            }

            input Interface1RelationshipFilters {
              \\"\\"\\"Filter type where all of the related Interface1s match this filter\\"\\"\\"
              all: Interface1Where
              \\"\\"\\"Filter type where none of the related Interface1s match this filter\\"\\"\\"
              none: Interface1Where
              \\"\\"\\"Filter type where one of the related Interface1s match this filter\\"\\"\\"
              single: Interface1Where
              \\"\\"\\"Filter type where some of the related Interface1s match this filter\\"\\"\\"
              some: Interface1Where
            }

            \\"\\"\\"
            Fields to sort Interface1s by. The order in which sorts are applied is not guaranteed when specifying many fields in one Interface1Sort object.
            \\"\\"\\"
            input Interface1Sort {
              field1: SortDirection
            }

            input Interface1UpdateInput {
              field1: StringScalarMutations
              field1_SET: String @deprecated(reason: \\"Please use the generic mutation 'field1: { set: ... } }' instead.\\")
              interface2: [Interface1Interface2UpdateFieldInput!]
            }

            input Interface1Where {
              AND: [Interface1Where!]
              NOT: Interface1Where
              OR: [Interface1Where!]
              field1: StringScalarFilters
              field1_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter field1: { contains: ... }\\")
              field1_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter field1: { endsWith: ... }\\")
              field1_EQ: String @deprecated(reason: \\"Please use the relevant generic filter field1: { eq: ... }\\")
              field1_IN: [String!] @deprecated(reason: \\"Please use the relevant generic filter field1: { in: ... }\\")
              field1_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter field1: { startsWith: ... }\\")
              interface2: Interface2RelationshipFilters
              interface2Aggregate: Interface1Interface2AggregateInput @deprecated(reason: \\"Aggregate filters are moved inside the interface2Connection filter, please use { interface2Connection: { aggregate: {...} } } instead\\")
              interface2Connection: Interface1Interface2ConnectionFilters
              \\"\\"\\"
              Return Interface1s where all of the related Interface1Interface2Connections match this filter
              \\"\\"\\"
              interface2Connection_ALL: Interface1Interface2ConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'interface2Connection: { all: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Interface1s where none of the related Interface1Interface2Connections match this filter
              \\"\\"\\"
              interface2Connection_NONE: Interface1Interface2ConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'interface2Connection: { none: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Interface1s where one of the related Interface1Interface2Connections match this filter
              \\"\\"\\"
              interface2Connection_SINGLE: Interface1Interface2ConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'interface2Connection: { single: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Interface1s where some of the related Interface1Interface2Connections match this filter
              \\"\\"\\"
              interface2Connection_SOME: Interface1Interface2ConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'interface2Connection: { some: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Interface1s where all of the related Interface2s match this filter
              \\"\\"\\"
              interface2_ALL: Interface2Where @deprecated(reason: \\"Please use the relevant generic filter 'interface2: { all: ... }' instead.\\")
              \\"\\"\\"
              Return Interface1s where none of the related Interface2s match this filter
              \\"\\"\\"
              interface2_NONE: Interface2Where @deprecated(reason: \\"Please use the relevant generic filter 'interface2: { none: ... }' instead.\\")
              \\"\\"\\"
              Return Interface1s where one of the related Interface2s match this filter
              \\"\\"\\"
              interface2_SINGLE: Interface2Where @deprecated(reason: \\"Please use the relevant generic filter 'interface2: {  single: ... }' instead.\\")
              \\"\\"\\"
              Return Interface1s where some of the related Interface2s match this filter
              \\"\\"\\"
              interface2_SOME: Interface2Where @deprecated(reason: \\"Please use the relevant generic filter 'interface2: {  some: ... }' instead.\\")
              typename: [Interface1Implementation!]
            }

            type Interface1sConnection {
              aggregate: Interface1Aggregate!
              edges: [Interface1Edge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            interface Interface2 {
              field2: String
            }

            type Interface2Aggregate {
              count: Count!
              node: Interface2AggregateNode!
            }

            type Interface2AggregateNode {
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

            input Interface2RelationshipFilters {
              \\"\\"\\"Filter type where all of the related Interface2s match this filter\\"\\"\\"
              all: Interface2Where
              \\"\\"\\"Filter type where none of the related Interface2s match this filter\\"\\"\\"
              none: Interface2Where
              \\"\\"\\"Filter type where one of the related Interface2s match this filter\\"\\"\\"
              single: Interface2Where
              \\"\\"\\"Filter type where some of the related Interface2s match this filter\\"\\"\\"
              some: Interface2Where
            }

            \\"\\"\\"
            Fields to sort Interface2s by. The order in which sorts are applied is not guaranteed when specifying many fields in one Interface2Sort object.
            \\"\\"\\"
            input Interface2Sort {
              field2: SortDirection
            }

            input Interface2UpdateInput {
              field2: StringScalarMutations
              field2_SET: String @deprecated(reason: \\"Please use the generic mutation 'field2: { set: ... } }' instead.\\")
            }

            input Interface2Where {
              AND: [Interface2Where!]
              NOT: Interface2Where
              OR: [Interface2Where!]
              field2: StringScalarFilters
              field2_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter field2: { contains: ... }\\")
              field2_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter field2: { endsWith: ... }\\")
              field2_EQ: String @deprecated(reason: \\"Please use the relevant generic filter field2: { eq: ... }\\")
              field2_IN: [String] @deprecated(reason: \\"Please use the relevant generic filter field2: { in: ... }\\")
              field2_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter field2: { startsWith: ... }\\")
              typename: [Interface2Implementation!]
            }

            type Interface2sConnection {
              aggregate: Interface2Aggregate!
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
              propsField: IntScalarAggregationFilters
              propsField_AVERAGE_EQUAL: Float @deprecated(reason: \\"Please use the relevant generic filter 'propsField: { average: { eq: ... } } }' instead.\\")
              propsField_AVERAGE_GT: Float @deprecated(reason: \\"Please use the relevant generic filter 'propsField: { average: { gt: ... } } }' instead.\\")
              propsField_AVERAGE_GTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'propsField: { average: { gte: ... } } }' instead.\\")
              propsField_AVERAGE_LT: Float @deprecated(reason: \\"Please use the relevant generic filter 'propsField: { average: { lt: ... } } }' instead.\\")
              propsField_AVERAGE_LTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'propsField: { average: { lte: ... } } }' instead.\\")
              propsField_MAX_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'propsField: { max: { eq: ... } } }' instead.\\")
              propsField_MAX_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'propsField: { max: { gt: ... } } }' instead.\\")
              propsField_MAX_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'propsField: { max: { gte: ... } } }' instead.\\")
              propsField_MAX_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'propsField: { max: { lt: ... } } }' instead.\\")
              propsField_MAX_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'propsField: { max: { lte: ... } } }' instead.\\")
              propsField_MIN_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'propsField: { min: { eq: ... } } }' instead.\\")
              propsField_MIN_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'propsField: { min: { gt: ... } } }' instead.\\")
              propsField_MIN_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'propsField: { min: { gte: ... } } }' instead.\\")
              propsField_MIN_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'propsField: { min: { lt: ... } } }' instead.\\")
              propsField_MIN_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'propsField: { min: { lte: ... } } }' instead.\\")
              propsField_SUM_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'propsField: { sum: { eq: ... } } }' instead.\\")
              propsField_SUM_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'propsField: { sum: { gt: ... } } }' instead.\\")
              propsField_SUM_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'propsField: { sum: { gte: ... } } }' instead.\\")
              propsField_SUM_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'propsField: { sum: { lt: ... } } }' instead.\\")
              propsField_SUM_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'propsField: { sum: { lte: ... } } }' instead.\\")
            }

            input PropsCreateInput {
              propsField: Int!
            }

            input PropsSort {
              propsField: SortDirection
            }

            input PropsUpdateInput {
              propsField: IntScalarMutations
              propsField_DECREMENT: Int @deprecated(reason: \\"Please use the relevant generic mutation 'propsField: { decrement: ... } }' instead.\\")
              propsField_INCREMENT: Int @deprecated(reason: \\"Please use the relevant generic mutation 'propsField: { increment: ... } }' instead.\\")
              propsField_SET: Int @deprecated(reason: \\"Please use the generic mutation 'propsField: { set: ... } }' instead.\\")
            }

            input PropsWhere {
              AND: [PropsWhere!]
              NOT: PropsWhere
              OR: [PropsWhere!]
              propsField: IntScalarFilters
              propsField_EQ: Int @deprecated(reason: \\"Please use the relevant generic filter propsField: { eq: ... }\\")
              propsField_GT: Int @deprecated(reason: \\"Please use the relevant generic filter propsField: { gt: ... }\\")
              propsField_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter propsField: { gte: ... }\\")
              propsField_IN: [Int!] @deprecated(reason: \\"Please use the relevant generic filter propsField: { in: ... }\\")
              propsField_LT: Int @deprecated(reason: \\"Please use the relevant generic filter propsField: { lt: ... }\\")
              propsField_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter propsField: { lte: ... }\\")
            }

            type Query {
              interface1s(limit: Int, offset: Int, sort: [Interface1Sort!], where: Interface1Where): [Interface1!]!
              interface1sConnection(after: String, first: Int, sort: [Interface1Sort!], where: Interface1Where): Interface1sConnection!
              interface2s(limit: Int, offset: Int, sort: [Interface2Sort!], where: Interface2Where): [Interface2!]!
              interface2sConnection(after: String, first: Int, sort: [Interface2Sort!], where: Interface2Where): Interface2sConnection!
              type1Interface1s(limit: Int, offset: Int, sort: [Type1Interface1Sort!], where: Type1Interface1Where): [Type1Interface1!]!
              type1Interface1sConnection(after: String, first: Int, sort: [Type1Interface1Sort!], where: Type1Interface1Where): Type1Interface1sConnection!
              type1Interface2s(limit: Int, offset: Int, sort: [Type1Interface2Sort!], where: Type1Interface2Where): [Type1Interface2!]!
              type1Interface2sConnection(after: String, first: Int, sort: [Type1Interface2Sort!], where: Type1Interface2Where): Type1Interface2sConnection!
              type1s(limit: Int, offset: Int, sort: [Type1Sort!], where: Type1Where): [Type1!]!
              type1sConnection(after: String, first: Int, sort: [Type1Sort!], where: Type1Where): Type1sConnection!
              type2Interface1s(limit: Int, offset: Int, sort: [Type2Interface1Sort!], where: Type2Interface1Where): [Type2Interface1!]!
              type2Interface1sConnection(after: String, first: Int, sort: [Type2Interface1Sort!], where: Type2Interface1Where): Type2Interface1sConnection!
              type2Interface2s(limit: Int, offset: Int, sort: [Type2Interface2Sort!], where: Type2Interface2Where): [Type2Interface2!]!
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

            \\"\\"\\"Filters for an aggregation of a string field\\"\\"\\"
            input StringScalarAggregationFilters {
              averageLength: FloatScalarFilters
              longestLength: IntScalarFilters
              shortestLength: IntScalarFilters
            }

            \\"\\"\\"String filters\\"\\"\\"
            input StringScalarFilters {
              contains: String
              endsWith: String
              eq: String
              in: [String!]
              startsWith: String
            }

            \\"\\"\\"String mutations\\"\\"\\"
            input StringScalarMutations {
              set: String
            }

            type Type1 {
              field1: String!
              interface1(limit: Int, offset: Int, sort: [Interface1Sort!], where: Interface1Where): [Interface1!]!
              interface1Connection(after: String, first: Int, sort: [Type1Interface1ConnectionSort!], where: Type1Interface1ConnectionWhere): Type1Interface1Connection!
            }

            type Type1Aggregate {
              count: Count!
              node: Type1AggregateNode!
            }

            type Type1AggregateNode {
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
              interface2Connection(after: String, first: Int, sort: [Interface1Interface2ConnectionSort!], where: Interface1Interface2ConnectionWhere): Interface1Interface2Connection!
            }

            type Type1Interface1Aggregate {
              count: Count!
              node: Type1Interface1AggregateNode!
            }

            input Type1Interface1AggregateInput {
              AND: [Type1Interface1AggregateInput!]
              NOT: Type1Interface1AggregateInput
              OR: [Type1Interface1AggregateInput!]
              count: IntScalarFilters
              count_EQ: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { eq: ... } } }' instead.\\")
              count_GT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gt: ... } } }' instead.\\")
              count_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gte: ... } } }' instead.\\")
              count_LT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lt: ... } } }' instead.\\")
              count_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lte: ... } } }' instead.\\")
              node: Type1Interface1NodeAggregationWhereInput
            }

            type Type1Interface1AggregateNode {
              field1: StringAggregateSelection!
            }

            input Type1Interface1ConnectFieldInput {
              connect: Interface1ConnectInput
              where: Interface1ConnectWhere
            }

            type Type1Interface1Connection {
              aggregate: Type1Interface1Interface1AggregateSelection!
              edges: [Type1Interface1Relationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input Type1Interface1ConnectionAggregateInput {
              AND: [Type1Interface1ConnectionAggregateInput!]
              NOT: Type1Interface1ConnectionAggregateInput
              OR: [Type1Interface1ConnectionAggregateInput!]
              count: ConnectionAggregationCountFilterInput
              node: Type1Interface1NodeAggregationWhereInput
            }

            input Type1Interface1ConnectionFilters {
              \\"\\"\\"
              Filter Type1s by aggregating results on related Type1Interface1Connections
              \\"\\"\\"
              aggregate: Type1Interface1ConnectionAggregateInput
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

            type Type1Interface1Interface1AggregateSelection {
              count: CountConnection!
              node: Type1Interface1Interface1NodeAggregateSelection
            }

            type Type1Interface1Interface1NodeAggregateSelection {
              field1: StringAggregateSelection!
            }

            input Type1Interface1Interface2AggregateInput {
              AND: [Type1Interface1Interface2AggregateInput!]
              NOT: Type1Interface1Interface2AggregateInput
              OR: [Type1Interface1Interface2AggregateInput!]
              count: IntScalarFilters
              count_EQ: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { eq: ... } } }' instead.\\")
              count_GT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gt: ... } } }' instead.\\")
              count_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gte: ... } } }' instead.\\")
              count_LT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lt: ... } } }' instead.\\")
              count_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lte: ... } } }' instead.\\")
              edge: PropsAggregationWhereInput
              node: Type1Interface1Interface2NodeAggregationWhereInput
            }

            input Type1Interface1Interface2ConnectFieldInput {
              edge: PropsCreateInput!
              where: Interface2ConnectWhere
            }

            input Type1Interface1Interface2ConnectionAggregateInput {
              AND: [Type1Interface1Interface2ConnectionAggregateInput!]
              NOT: Type1Interface1Interface2ConnectionAggregateInput
              OR: [Type1Interface1Interface2ConnectionAggregateInput!]
              count: ConnectionAggregationCountFilterInput
              edge: PropsAggregationWhereInput
              node: Type1Interface1Interface2NodeAggregationWhereInput
            }

            input Type1Interface1Interface2ConnectionFilters {
              \\"\\"\\"
              Filter Type1Interface1s by aggregating results on related Interface1Interface2Connections
              \\"\\"\\"
              aggregate: Type1Interface1Interface2ConnectionAggregateInput
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

            input Type1Interface1Interface2NodeAggregationWhereInput {
              AND: [Type1Interface1Interface2NodeAggregationWhereInput!]
              NOT: Type1Interface1Interface2NodeAggregationWhereInput
              OR: [Type1Interface1Interface2NodeAggregationWhereInput!]
              field2: StringScalarAggregationFilters
              field2_AVERAGE_LENGTH_EQUAL: Float @deprecated(reason: \\"Please use the relevant generic filter 'field2: { averageLength: { eq: ... } } }' instead.\\")
              field2_AVERAGE_LENGTH_GT: Float @deprecated(reason: \\"Please use the relevant generic filter 'field2: { averageLength: { gt: ... } } }' instead.\\")
              field2_AVERAGE_LENGTH_GTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'field2: { averageLength: { gte: ... } } }' instead.\\")
              field2_AVERAGE_LENGTH_LT: Float @deprecated(reason: \\"Please use the relevant generic filter 'field2: { averageLength: { lt: ... } } }' instead.\\")
              field2_AVERAGE_LENGTH_LTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'field2: { averageLength: { lte: ... } } }' instead.\\")
              field2_LONGEST_LENGTH_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'field2: { longestLength: { eq: ... } } }' instead.\\")
              field2_LONGEST_LENGTH_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'field2: { longestLength: { gt: ... } } }' instead.\\")
              field2_LONGEST_LENGTH_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'field2: { longestLength: { gte: ... } } }' instead.\\")
              field2_LONGEST_LENGTH_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'field2: { longestLength: { lt: ... } } }' instead.\\")
              field2_LONGEST_LENGTH_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'field2: { longestLength: { lte: ... } } }' instead.\\")
              field2_SHORTEST_LENGTH_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'field2: { shortestLength: { eq: ... } } }' instead.\\")
              field2_SHORTEST_LENGTH_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'field2: { shortestLength: { gt: ... } } }' instead.\\")
              field2_SHORTEST_LENGTH_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'field2: { shortestLength: { gte: ... } } }' instead.\\")
              field2_SHORTEST_LENGTH_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'field2: { shortestLength: { lt: ... } } }' instead.\\")
              field2_SHORTEST_LENGTH_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'field2: { shortestLength: { lte: ... } } }' instead.\\")
            }

            input Type1Interface1Interface2UpdateConnectionInput {
              edge: PropsUpdateInput
              node: Interface2UpdateInput
              where: Interface1Interface2ConnectionWhere
            }

            input Type1Interface1Interface2UpdateFieldInput {
              connect: [Type1Interface1Interface2ConnectFieldInput!]
              create: [Type1Interface1Interface2CreateFieldInput!]
              delete: [Type1Interface1Interface2DeleteFieldInput!]
              disconnect: [Type1Interface1Interface2DisconnectFieldInput!]
              update: Type1Interface1Interface2UpdateConnectionInput
            }

            input Type1Interface1NodeAggregationWhereInput {
              AND: [Type1Interface1NodeAggregationWhereInput!]
              NOT: Type1Interface1NodeAggregationWhereInput
              OR: [Type1Interface1NodeAggregationWhereInput!]
              field1: StringScalarAggregationFilters
              field1_AVERAGE_LENGTH_EQUAL: Float @deprecated(reason: \\"Please use the relevant generic filter 'field1: { averageLength: { eq: ... } } }' instead.\\")
              field1_AVERAGE_LENGTH_GT: Float @deprecated(reason: \\"Please use the relevant generic filter 'field1: { averageLength: { gt: ... } } }' instead.\\")
              field1_AVERAGE_LENGTH_GTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'field1: { averageLength: { gte: ... } } }' instead.\\")
              field1_AVERAGE_LENGTH_LT: Float @deprecated(reason: \\"Please use the relevant generic filter 'field1: { averageLength: { lt: ... } } }' instead.\\")
              field1_AVERAGE_LENGTH_LTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'field1: { averageLength: { lte: ... } } }' instead.\\")
              field1_LONGEST_LENGTH_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'field1: { longestLength: { eq: ... } } }' instead.\\")
              field1_LONGEST_LENGTH_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'field1: { longestLength: { gt: ... } } }' instead.\\")
              field1_LONGEST_LENGTH_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'field1: { longestLength: { gte: ... } } }' instead.\\")
              field1_LONGEST_LENGTH_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'field1: { longestLength: { lt: ... } } }' instead.\\")
              field1_LONGEST_LENGTH_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'field1: { longestLength: { lte: ... } } }' instead.\\")
              field1_SHORTEST_LENGTH_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'field1: { shortestLength: { eq: ... } } }' instead.\\")
              field1_SHORTEST_LENGTH_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'field1: { shortestLength: { gt: ... } } }' instead.\\")
              field1_SHORTEST_LENGTH_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'field1: { shortestLength: { gte: ... } } }' instead.\\")
              field1_SHORTEST_LENGTH_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'field1: { shortestLength: { lt: ... } } }' instead.\\")
              field1_SHORTEST_LENGTH_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'field1: { shortestLength: { lte: ... } } }' instead.\\")
            }

            type Type1Interface1Relationship {
              cursor: String!
              node: Interface1!
            }

            \\"\\"\\"
            Fields to sort Type1Interface1s by. The order in which sorts are applied is not guaranteed when specifying many fields in one Type1Interface1Sort object.
            \\"\\"\\"
            input Type1Interface1Sort {
              field1: SortDirection
            }

            input Type1Interface1UpdateConnectionInput {
              node: Interface1UpdateInput
              where: Type1Interface1ConnectionWhere
            }

            input Type1Interface1UpdateFieldInput {
              connect: [Type1Interface1ConnectFieldInput!]
              create: [Type1Interface1CreateFieldInput!]
              delete: [Type1Interface1DeleteFieldInput!]
              disconnect: [Type1Interface1DisconnectFieldInput!]
              update: Type1Interface1UpdateConnectionInput
            }

            input Type1Interface1UpdateInput {
              field1: StringScalarMutations
              field1_SET: String @deprecated(reason: \\"Please use the generic mutation 'field1: { set: ... } }' instead.\\")
              interface2: [Type1Interface1Interface2UpdateFieldInput!]
            }

            input Type1Interface1Where {
              AND: [Type1Interface1Where!]
              NOT: Type1Interface1Where
              OR: [Type1Interface1Where!]
              field1: StringScalarFilters
              field1_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter field1: { contains: ... }\\")
              field1_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter field1: { endsWith: ... }\\")
              field1_EQ: String @deprecated(reason: \\"Please use the relevant generic filter field1: { eq: ... }\\")
              field1_IN: [String!] @deprecated(reason: \\"Please use the relevant generic filter field1: { in: ... }\\")
              field1_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter field1: { startsWith: ... }\\")
              interface2: Interface2RelationshipFilters
              interface2Aggregate: Type1Interface1Interface2AggregateInput @deprecated(reason: \\"Aggregate filters are moved inside the interface2Connection filter, please use { interface2Connection: { aggregate: {...} } } instead\\")
              interface2Connection: Type1Interface1Interface2ConnectionFilters
              \\"\\"\\"
              Return Type1Interface1s where all of the related Interface1Interface2Connections match this filter
              \\"\\"\\"
              interface2Connection_ALL: Interface1Interface2ConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'interface2Connection: { all: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Type1Interface1s where none of the related Interface1Interface2Connections match this filter
              \\"\\"\\"
              interface2Connection_NONE: Interface1Interface2ConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'interface2Connection: { none: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Type1Interface1s where one of the related Interface1Interface2Connections match this filter
              \\"\\"\\"
              interface2Connection_SINGLE: Interface1Interface2ConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'interface2Connection: { single: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Type1Interface1s where some of the related Interface1Interface2Connections match this filter
              \\"\\"\\"
              interface2Connection_SOME: Interface1Interface2ConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'interface2Connection: { some: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Type1Interface1s where all of the related Interface2s match this filter
              \\"\\"\\"
              interface2_ALL: Interface2Where @deprecated(reason: \\"Please use the relevant generic filter 'interface2: { all: ... }' instead.\\")
              \\"\\"\\"
              Return Type1Interface1s where none of the related Interface2s match this filter
              \\"\\"\\"
              interface2_NONE: Interface2Where @deprecated(reason: \\"Please use the relevant generic filter 'interface2: { none: ... }' instead.\\")
              \\"\\"\\"
              Return Type1Interface1s where one of the related Interface2s match this filter
              \\"\\"\\"
              interface2_SINGLE: Interface2Where @deprecated(reason: \\"Please use the relevant generic filter 'interface2: {  single: ... }' instead.\\")
              \\"\\"\\"
              Return Type1Interface1s where some of the related Interface2s match this filter
              \\"\\"\\"
              interface2_SOME: Interface2Where @deprecated(reason: \\"Please use the relevant generic filter 'interface2: {  some: ... }' instead.\\")
            }

            type Type1Interface1sConnection {
              aggregate: Type1Interface1Aggregate!
              edges: [Type1Interface1Edge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            type Type1Interface2 implements Interface2 {
              field2: String!
            }

            type Type1Interface2Aggregate {
              count: Count!
              node: Type1Interface2AggregateNode!
            }

            type Type1Interface2AggregateNode {
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
              field2: StringScalarMutations
              field2_SET: String @deprecated(reason: \\"Please use the generic mutation 'field2: { set: ... } }' instead.\\")
            }

            input Type1Interface2Where {
              AND: [Type1Interface2Where!]
              NOT: Type1Interface2Where
              OR: [Type1Interface2Where!]
              field2: StringScalarFilters
              field2_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter field2: { contains: ... }\\")
              field2_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter field2: { endsWith: ... }\\")
              field2_EQ: String @deprecated(reason: \\"Please use the relevant generic filter field2: { eq: ... }\\")
              field2_IN: [String!] @deprecated(reason: \\"Please use the relevant generic filter field2: { in: ... }\\")
              field2_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter field2: { startsWith: ... }\\")
            }

            type Type1Interface2sConnection {
              aggregate: Type1Interface2Aggregate!
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
              field1: StringScalarMutations
              field1_SET: String @deprecated(reason: \\"Please use the generic mutation 'field1: { set: ... } }' instead.\\")
              interface1: [Type1Interface1UpdateFieldInput!]
            }

            input Type1Where {
              AND: [Type1Where!]
              NOT: Type1Where
              OR: [Type1Where!]
              field1: StringScalarFilters
              field1_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter field1: { contains: ... }\\")
              field1_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter field1: { endsWith: ... }\\")
              field1_EQ: String @deprecated(reason: \\"Please use the relevant generic filter field1: { eq: ... }\\")
              field1_IN: [String!] @deprecated(reason: \\"Please use the relevant generic filter field1: { in: ... }\\")
              field1_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter field1: { startsWith: ... }\\")
              interface1: Interface1RelationshipFilters
              interface1Aggregate: Type1Interface1AggregateInput @deprecated(reason: \\"Aggregate filters are moved inside the interface1Connection filter, please use { interface1Connection: { aggregate: {...} } } instead\\")
              interface1Connection: Type1Interface1ConnectionFilters
              \\"\\"\\"
              Return Type1s where all of the related Type1Interface1Connections match this filter
              \\"\\"\\"
              interface1Connection_ALL: Type1Interface1ConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'interface1Connection: { all: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Type1s where none of the related Type1Interface1Connections match this filter
              \\"\\"\\"
              interface1Connection_NONE: Type1Interface1ConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'interface1Connection: { none: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Type1s where one of the related Type1Interface1Connections match this filter
              \\"\\"\\"
              interface1Connection_SINGLE: Type1Interface1ConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'interface1Connection: { single: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Type1s where some of the related Type1Interface1Connections match this filter
              \\"\\"\\"
              interface1Connection_SOME: Type1Interface1ConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'interface1Connection: { some: { node: ... } } }' instead.\\")
              \\"\\"\\"Return Type1s where all of the related Interface1s match this filter\\"\\"\\"
              interface1_ALL: Interface1Where @deprecated(reason: \\"Please use the relevant generic filter 'interface1: { all: ... }' instead.\\")
              \\"\\"\\"Return Type1s where none of the related Interface1s match this filter\\"\\"\\"
              interface1_NONE: Interface1Where @deprecated(reason: \\"Please use the relevant generic filter 'interface1: { none: ... }' instead.\\")
              \\"\\"\\"Return Type1s where one of the related Interface1s match this filter\\"\\"\\"
              interface1_SINGLE: Interface1Where @deprecated(reason: \\"Please use the relevant generic filter 'interface1: {  single: ... }' instead.\\")
              \\"\\"\\"Return Type1s where some of the related Interface1s match this filter\\"\\"\\"
              interface1_SOME: Interface1Where @deprecated(reason: \\"Please use the relevant generic filter 'interface1: {  some: ... }' instead.\\")
            }

            type Type1sConnection {
              aggregate: Type1Aggregate!
              edges: [Type1Edge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            type Type2Interface1 implements Interface1 {
              field1: String!
              interface2(limit: Int, offset: Int, sort: [Interface2Sort!], where: Interface2Where): [Interface2!]!
              interface2Connection(after: String, first: Int, sort: [Interface1Interface2ConnectionSort!], where: Interface1Interface2ConnectionWhere): Interface1Interface2Connection!
            }

            type Type2Interface1Aggregate {
              count: Count!
              node: Type2Interface1AggregateNode!
            }

            type Type2Interface1AggregateNode {
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
              count: IntScalarFilters
              count_EQ: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { eq: ... } } }' instead.\\")
              count_GT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gt: ... } } }' instead.\\")
              count_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gte: ... } } }' instead.\\")
              count_LT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lt: ... } } }' instead.\\")
              count_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lte: ... } } }' instead.\\")
              edge: PropsAggregationWhereInput
              node: Type2Interface1Interface2NodeAggregationWhereInput
            }

            input Type2Interface1Interface2ConnectFieldInput {
              edge: PropsCreateInput!
              where: Interface2ConnectWhere
            }

            input Type2Interface1Interface2ConnectionAggregateInput {
              AND: [Type2Interface1Interface2ConnectionAggregateInput!]
              NOT: Type2Interface1Interface2ConnectionAggregateInput
              OR: [Type2Interface1Interface2ConnectionAggregateInput!]
              count: ConnectionAggregationCountFilterInput
              edge: PropsAggregationWhereInput
              node: Type2Interface1Interface2NodeAggregationWhereInput
            }

            input Type2Interface1Interface2ConnectionFilters {
              \\"\\"\\"
              Filter Type2Interface1s by aggregating results on related Interface1Interface2Connections
              \\"\\"\\"
              aggregate: Type2Interface1Interface2ConnectionAggregateInput
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

            input Type2Interface1Interface2NodeAggregationWhereInput {
              AND: [Type2Interface1Interface2NodeAggregationWhereInput!]
              NOT: Type2Interface1Interface2NodeAggregationWhereInput
              OR: [Type2Interface1Interface2NodeAggregationWhereInput!]
              field2: StringScalarAggregationFilters
              field2_AVERAGE_LENGTH_EQUAL: Float @deprecated(reason: \\"Please use the relevant generic filter 'field2: { averageLength: { eq: ... } } }' instead.\\")
              field2_AVERAGE_LENGTH_GT: Float @deprecated(reason: \\"Please use the relevant generic filter 'field2: { averageLength: { gt: ... } } }' instead.\\")
              field2_AVERAGE_LENGTH_GTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'field2: { averageLength: { gte: ... } } }' instead.\\")
              field2_AVERAGE_LENGTH_LT: Float @deprecated(reason: \\"Please use the relevant generic filter 'field2: { averageLength: { lt: ... } } }' instead.\\")
              field2_AVERAGE_LENGTH_LTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'field2: { averageLength: { lte: ... } } }' instead.\\")
              field2_LONGEST_LENGTH_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'field2: { longestLength: { eq: ... } } }' instead.\\")
              field2_LONGEST_LENGTH_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'field2: { longestLength: { gt: ... } } }' instead.\\")
              field2_LONGEST_LENGTH_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'field2: { longestLength: { gte: ... } } }' instead.\\")
              field2_LONGEST_LENGTH_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'field2: { longestLength: { lt: ... } } }' instead.\\")
              field2_LONGEST_LENGTH_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'field2: { longestLength: { lte: ... } } }' instead.\\")
              field2_SHORTEST_LENGTH_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'field2: { shortestLength: { eq: ... } } }' instead.\\")
              field2_SHORTEST_LENGTH_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'field2: { shortestLength: { gt: ... } } }' instead.\\")
              field2_SHORTEST_LENGTH_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'field2: { shortestLength: { gte: ... } } }' instead.\\")
              field2_SHORTEST_LENGTH_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'field2: { shortestLength: { lt: ... } } }' instead.\\")
              field2_SHORTEST_LENGTH_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'field2: { shortestLength: { lte: ... } } }' instead.\\")
            }

            input Type2Interface1Interface2UpdateConnectionInput {
              edge: PropsUpdateInput
              node: Interface2UpdateInput
              where: Interface1Interface2ConnectionWhere
            }

            input Type2Interface1Interface2UpdateFieldInput {
              connect: [Type2Interface1Interface2ConnectFieldInput!]
              create: [Type2Interface1Interface2CreateFieldInput!]
              delete: [Type2Interface1Interface2DeleteFieldInput!]
              disconnect: [Type2Interface1Interface2DisconnectFieldInput!]
              update: Type2Interface1Interface2UpdateConnectionInput
            }

            \\"\\"\\"
            Fields to sort Type2Interface1s by. The order in which sorts are applied is not guaranteed when specifying many fields in one Type2Interface1Sort object.
            \\"\\"\\"
            input Type2Interface1Sort {
              field1: SortDirection
            }

            input Type2Interface1UpdateInput {
              field1: StringScalarMutations
              field1_SET: String @deprecated(reason: \\"Please use the generic mutation 'field1: { set: ... } }' instead.\\")
              interface2: [Type2Interface1Interface2UpdateFieldInput!]
            }

            input Type2Interface1Where {
              AND: [Type2Interface1Where!]
              NOT: Type2Interface1Where
              OR: [Type2Interface1Where!]
              field1: StringScalarFilters
              field1_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter field1: { contains: ... }\\")
              field1_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter field1: { endsWith: ... }\\")
              field1_EQ: String @deprecated(reason: \\"Please use the relevant generic filter field1: { eq: ... }\\")
              field1_IN: [String!] @deprecated(reason: \\"Please use the relevant generic filter field1: { in: ... }\\")
              field1_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter field1: { startsWith: ... }\\")
              interface2: Interface2RelationshipFilters
              interface2Aggregate: Type2Interface1Interface2AggregateInput @deprecated(reason: \\"Aggregate filters are moved inside the interface2Connection filter, please use { interface2Connection: { aggregate: {...} } } instead\\")
              interface2Connection: Type2Interface1Interface2ConnectionFilters
              \\"\\"\\"
              Return Type2Interface1s where all of the related Interface1Interface2Connections match this filter
              \\"\\"\\"
              interface2Connection_ALL: Interface1Interface2ConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'interface2Connection: { all: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Type2Interface1s where none of the related Interface1Interface2Connections match this filter
              \\"\\"\\"
              interface2Connection_NONE: Interface1Interface2ConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'interface2Connection: { none: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Type2Interface1s where one of the related Interface1Interface2Connections match this filter
              \\"\\"\\"
              interface2Connection_SINGLE: Interface1Interface2ConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'interface2Connection: { single: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Type2Interface1s where some of the related Interface1Interface2Connections match this filter
              \\"\\"\\"
              interface2Connection_SOME: Interface1Interface2ConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'interface2Connection: { some: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Type2Interface1s where all of the related Interface2s match this filter
              \\"\\"\\"
              interface2_ALL: Interface2Where @deprecated(reason: \\"Please use the relevant generic filter 'interface2: { all: ... }' instead.\\")
              \\"\\"\\"
              Return Type2Interface1s where none of the related Interface2s match this filter
              \\"\\"\\"
              interface2_NONE: Interface2Where @deprecated(reason: \\"Please use the relevant generic filter 'interface2: { none: ... }' instead.\\")
              \\"\\"\\"
              Return Type2Interface1s where one of the related Interface2s match this filter
              \\"\\"\\"
              interface2_SINGLE: Interface2Where @deprecated(reason: \\"Please use the relevant generic filter 'interface2: {  single: ... }' instead.\\")
              \\"\\"\\"
              Return Type2Interface1s where some of the related Interface2s match this filter
              \\"\\"\\"
              interface2_SOME: Interface2Where @deprecated(reason: \\"Please use the relevant generic filter 'interface2: {  some: ... }' instead.\\")
            }

            type Type2Interface1sConnection {
              aggregate: Type2Interface1Aggregate!
              edges: [Type2Interface1Edge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            type Type2Interface2 implements Interface2 {
              field2: String!
            }

            type Type2Interface2Aggregate {
              count: Count!
              node: Type2Interface2AggregateNode!
            }

            type Type2Interface2AggregateNode {
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
              field2: StringScalarMutations
              field2_SET: String @deprecated(reason: \\"Please use the generic mutation 'field2: { set: ... } }' instead.\\")
            }

            input Type2Interface2Where {
              AND: [Type2Interface2Where!]
              NOT: Type2Interface2Where
              OR: [Type2Interface2Where!]
              field2: StringScalarFilters
              field2_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter field2: { contains: ... }\\")
              field2_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter field2: { endsWith: ... }\\")
              field2_EQ: String @deprecated(reason: \\"Please use the relevant generic filter field2: { eq: ... }\\")
              field2_IN: [String!] @deprecated(reason: \\"Please use the relevant generic filter field2: { in: ... }\\")
              field2_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter field2: { startsWith: ... }\\")
            }

            type Type2Interface2sConnection {
              aggregate: Type2Interface2Aggregate!
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

            input ConnectionAggregationCountFilterInput {
              edges: IntScalarFilters
              nodes: IntScalarFilters
            }

            type Count {
              nodes: Int!
            }

            type CountConnection {
              edges: Int!
              nodes: Int!
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

            \\"\\"\\"Float filters\\"\\"\\"
            input FloatScalarFilters {
              eq: Float
              gt: Float
              gte: Float
              in: [Float!]
              lt: Float
              lte: Float
            }

            \\"\\"\\"Filters for an aggregation of an int field\\"\\"\\"
            input IntScalarAggregationFilters {
              average: FloatScalarFilters
              max: IntScalarFilters
              min: IntScalarFilters
              sum: IntScalarFilters
            }

            \\"\\"\\"Int filters\\"\\"\\"
            input IntScalarFilters {
              eq: Int
              gt: Int
              gte: Int
              in: [Int!]
              lt: Int
              lte: Int
            }

            \\"\\"\\"Int mutations\\"\\"\\"
            input IntScalarMutations {
              add: Int
              set: Int
              subtract: Int
            }

            interface Interface1 {
              field1: String!
              interface2(limit: Int, offset: Int, sort: [Interface2Sort!], where: Interface2Where): [Interface2!]!
              interface2Connection(after: String, first: Int, sort: [Interface1Interface2ConnectionSort!], where: Interface1Interface2ConnectionWhere): Interface1Interface2Connection!
            }

            type Interface1Aggregate {
              count: Count!
              node: Interface1AggregateNode!
            }

            type Interface1AggregateNode {
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
              count: IntScalarFilters
              count_EQ: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { eq: ... } } }' instead.\\")
              count_GT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gt: ... } } }' instead.\\")
              count_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gte: ... } } }' instead.\\")
              count_LT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lt: ... } } }' instead.\\")
              count_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lte: ... } } }' instead.\\")
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

            input Interface1Interface2ConnectionAggregateInput {
              AND: [Interface1Interface2ConnectionAggregateInput!]
              NOT: Interface1Interface2ConnectionAggregateInput
              OR: [Interface1Interface2ConnectionAggregateInput!]
              count: ConnectionAggregationCountFilterInput
              edge: Interface1Interface2EdgeAggregationWhereInput
              node: Interface1Interface2NodeAggregationWhereInput
            }

            input Interface1Interface2ConnectionFilters {
              \\"\\"\\"
              Filter Interface1s by aggregating results on related Interface1Interface2Connections
              \\"\\"\\"
              aggregate: Interface1Interface2ConnectionAggregateInput
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
              field2: StringScalarAggregationFilters
              field2_AVERAGE_LENGTH_EQUAL: Float @deprecated(reason: \\"Please use the relevant generic filter 'field2: { averageLength: { eq: ... } } }' instead.\\")
              field2_AVERAGE_LENGTH_GT: Float @deprecated(reason: \\"Please use the relevant generic filter 'field2: { averageLength: { gt: ... } } }' instead.\\")
              field2_AVERAGE_LENGTH_GTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'field2: { averageLength: { gte: ... } } }' instead.\\")
              field2_AVERAGE_LENGTH_LT: Float @deprecated(reason: \\"Please use the relevant generic filter 'field2: { averageLength: { lt: ... } } }' instead.\\")
              field2_AVERAGE_LENGTH_LTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'field2: { averageLength: { lte: ... } } }' instead.\\")
              field2_LONGEST_LENGTH_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'field2: { longestLength: { eq: ... } } }' instead.\\")
              field2_LONGEST_LENGTH_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'field2: { longestLength: { gt: ... } } }' instead.\\")
              field2_LONGEST_LENGTH_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'field2: { longestLength: { gte: ... } } }' instead.\\")
              field2_LONGEST_LENGTH_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'field2: { longestLength: { lt: ... } } }' instead.\\")
              field2_LONGEST_LENGTH_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'field2: { longestLength: { lte: ... } } }' instead.\\")
              field2_SHORTEST_LENGTH_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'field2: { shortestLength: { eq: ... } } }' instead.\\")
              field2_SHORTEST_LENGTH_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'field2: { shortestLength: { gt: ... } } }' instead.\\")
              field2_SHORTEST_LENGTH_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'field2: { shortestLength: { gte: ... } } }' instead.\\")
              field2_SHORTEST_LENGTH_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'field2: { shortestLength: { lt: ... } } }' instead.\\")
              field2_SHORTEST_LENGTH_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'field2: { shortestLength: { lte: ... } } }' instead.\\")
            }

            type Interface1Interface2Relationship {
              cursor: String!
              node: Interface2!
              properties: Interface1Interface2RelationshipProperties!
            }

            union Interface1Interface2RelationshipProperties = Type1Props | Type2Props

            input Interface1Interface2UpdateConnectionInput {
              edge: Interface1Interface2EdgeUpdateInput
              node: Interface2UpdateInput
              where: Interface1Interface2ConnectionWhere
            }

            input Interface1Interface2UpdateFieldInput {
              connect: [Interface1Interface2ConnectFieldInput!]
              create: [Interface1Interface2CreateFieldInput!]
              delete: [Interface1Interface2DeleteFieldInput!]
              disconnect: [Interface1Interface2DisconnectFieldInput!]
              update: Interface1Interface2UpdateConnectionInput
            }

            input Interface1RelationshipFilters {
              \\"\\"\\"Filter type where all of the related Interface1s match this filter\\"\\"\\"
              all: Interface1Where
              \\"\\"\\"Filter type where none of the related Interface1s match this filter\\"\\"\\"
              none: Interface1Where
              \\"\\"\\"Filter type where one of the related Interface1s match this filter\\"\\"\\"
              single: Interface1Where
              \\"\\"\\"Filter type where some of the related Interface1s match this filter\\"\\"\\"
              some: Interface1Where
            }

            \\"\\"\\"
            Fields to sort Interface1s by. The order in which sorts are applied is not guaranteed when specifying many fields in one Interface1Sort object.
            \\"\\"\\"
            input Interface1Sort {
              field1: SortDirection
            }

            input Interface1UpdateInput {
              field1: StringScalarMutations
              field1_SET: String @deprecated(reason: \\"Please use the generic mutation 'field1: { set: ... } }' instead.\\")
              interface2: [Interface1Interface2UpdateFieldInput!]
            }

            input Interface1Where {
              AND: [Interface1Where!]
              NOT: Interface1Where
              OR: [Interface1Where!]
              field1: StringScalarFilters
              field1_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter field1: { contains: ... }\\")
              field1_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter field1: { endsWith: ... }\\")
              field1_EQ: String @deprecated(reason: \\"Please use the relevant generic filter field1: { eq: ... }\\")
              field1_IN: [String!] @deprecated(reason: \\"Please use the relevant generic filter field1: { in: ... }\\")
              field1_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter field1: { startsWith: ... }\\")
              interface2: Interface2RelationshipFilters
              interface2Aggregate: Interface1Interface2AggregateInput @deprecated(reason: \\"Aggregate filters are moved inside the interface2Connection filter, please use { interface2Connection: { aggregate: {...} } } instead\\")
              interface2Connection: Interface1Interface2ConnectionFilters
              \\"\\"\\"
              Return Interface1s where all of the related Interface1Interface2Connections match this filter
              \\"\\"\\"
              interface2Connection_ALL: Interface1Interface2ConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'interface2Connection: { all: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Interface1s where none of the related Interface1Interface2Connections match this filter
              \\"\\"\\"
              interface2Connection_NONE: Interface1Interface2ConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'interface2Connection: { none: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Interface1s where one of the related Interface1Interface2Connections match this filter
              \\"\\"\\"
              interface2Connection_SINGLE: Interface1Interface2ConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'interface2Connection: { single: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Interface1s where some of the related Interface1Interface2Connections match this filter
              \\"\\"\\"
              interface2Connection_SOME: Interface1Interface2ConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'interface2Connection: { some: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Interface1s where all of the related Interface2s match this filter
              \\"\\"\\"
              interface2_ALL: Interface2Where @deprecated(reason: \\"Please use the relevant generic filter 'interface2: { all: ... }' instead.\\")
              \\"\\"\\"
              Return Interface1s where none of the related Interface2s match this filter
              \\"\\"\\"
              interface2_NONE: Interface2Where @deprecated(reason: \\"Please use the relevant generic filter 'interface2: { none: ... }' instead.\\")
              \\"\\"\\"
              Return Interface1s where one of the related Interface2s match this filter
              \\"\\"\\"
              interface2_SINGLE: Interface2Where @deprecated(reason: \\"Please use the relevant generic filter 'interface2: {  single: ... }' instead.\\")
              \\"\\"\\"
              Return Interface1s where some of the related Interface2s match this filter
              \\"\\"\\"
              interface2_SOME: Interface2Where @deprecated(reason: \\"Please use the relevant generic filter 'interface2: {  some: ... }' instead.\\")
              typename: [Interface1Implementation!]
            }

            type Interface1sConnection {
              aggregate: Interface1Aggregate!
              edges: [Interface1Edge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            interface Interface2 {
              field2: String
            }

            type Interface2Aggregate {
              count: Count!
              node: Interface2AggregateNode!
            }

            type Interface2AggregateNode {
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

            input Interface2RelationshipFilters {
              \\"\\"\\"Filter type where all of the related Interface2s match this filter\\"\\"\\"
              all: Interface2Where
              \\"\\"\\"Filter type where none of the related Interface2s match this filter\\"\\"\\"
              none: Interface2Where
              \\"\\"\\"Filter type where one of the related Interface2s match this filter\\"\\"\\"
              single: Interface2Where
              \\"\\"\\"Filter type where some of the related Interface2s match this filter\\"\\"\\"
              some: Interface2Where
            }

            \\"\\"\\"
            Fields to sort Interface2s by. The order in which sorts are applied is not guaranteed when specifying many fields in one Interface2Sort object.
            \\"\\"\\"
            input Interface2Sort {
              field2: SortDirection
            }

            input Interface2UpdateInput {
              field2: StringScalarMutations
              field2_SET: String @deprecated(reason: \\"Please use the generic mutation 'field2: { set: ... } }' instead.\\")
            }

            input Interface2Where {
              AND: [Interface2Where!]
              NOT: Interface2Where
              OR: [Interface2Where!]
              field2: StringScalarFilters
              field2_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter field2: { contains: ... }\\")
              field2_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter field2: { endsWith: ... }\\")
              field2_EQ: String @deprecated(reason: \\"Please use the relevant generic filter field2: { eq: ... }\\")
              field2_IN: [String] @deprecated(reason: \\"Please use the relevant generic filter field2: { in: ... }\\")
              field2_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter field2: { startsWith: ... }\\")
              typename: [Interface2Implementation!]
            }

            type Interface2sConnection {
              aggregate: Interface2Aggregate!
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
              interface1sConnection(after: String, first: Int, sort: [Interface1Sort!], where: Interface1Where): Interface1sConnection!
              interface2s(limit: Int, offset: Int, sort: [Interface2Sort!], where: Interface2Where): [Interface2!]!
              interface2sConnection(after: String, first: Int, sort: [Interface2Sort!], where: Interface2Where): Interface2sConnection!
              type1Interface1s(limit: Int, offset: Int, sort: [Type1Interface1Sort!], where: Type1Interface1Where): [Type1Interface1!]!
              type1Interface1sConnection(after: String, first: Int, sort: [Type1Interface1Sort!], where: Type1Interface1Where): Type1Interface1sConnection!
              type1Interface2s(limit: Int, offset: Int, sort: [Type1Interface2Sort!], where: Type1Interface2Where): [Type1Interface2!]!
              type1Interface2sConnection(after: String, first: Int, sort: [Type1Interface2Sort!], where: Type1Interface2Where): Type1Interface2sConnection!
              type1s(limit: Int, offset: Int, sort: [Type1Sort!], where: Type1Where): [Type1!]!
              type1sConnection(after: String, first: Int, sort: [Type1Sort!], where: Type1Where): Type1sConnection!
              type2Interface1s(limit: Int, offset: Int, sort: [Type2Interface1Sort!], where: Type2Interface1Where): [Type2Interface1!]!
              type2Interface1sConnection(after: String, first: Int, sort: [Type2Interface1Sort!], where: Type2Interface1Where): Type2Interface1sConnection!
              type2Interface2s(limit: Int, offset: Int, sort: [Type2Interface2Sort!], where: Type2Interface2Where): [Type2Interface2!]!
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

            \\"\\"\\"Filters for an aggregation of a string field\\"\\"\\"
            input StringScalarAggregationFilters {
              averageLength: FloatScalarFilters
              longestLength: IntScalarFilters
              shortestLength: IntScalarFilters
            }

            \\"\\"\\"String filters\\"\\"\\"
            input StringScalarFilters {
              contains: String
              endsWith: String
              eq: String
              in: [String!]
              startsWith: String
            }

            \\"\\"\\"String mutations\\"\\"\\"
            input StringScalarMutations {
              set: String
            }

            type Type1 {
              field1: String!
              interface1(limit: Int, offset: Int, sort: [Interface1Sort!], where: Interface1Where): [Interface1!]!
              interface1Connection(after: String, first: Int, sort: [Type1Interface1ConnectionSort!], where: Type1Interface1ConnectionWhere): Type1Interface1Connection!
            }

            type Type1Aggregate {
              count: Count!
              node: Type1AggregateNode!
            }

            type Type1AggregateNode {
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
              interface2Connection(after: String, first: Int, sort: [Interface1Interface2ConnectionSort!], where: Interface1Interface2ConnectionWhere): Interface1Interface2Connection!
            }

            type Type1Interface1Aggregate {
              count: Count!
              node: Type1Interface1AggregateNode!
            }

            input Type1Interface1AggregateInput {
              AND: [Type1Interface1AggregateInput!]
              NOT: Type1Interface1AggregateInput
              OR: [Type1Interface1AggregateInput!]
              count: IntScalarFilters
              count_EQ: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { eq: ... } } }' instead.\\")
              count_GT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gt: ... } } }' instead.\\")
              count_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gte: ... } } }' instead.\\")
              count_LT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lt: ... } } }' instead.\\")
              count_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lte: ... } } }' instead.\\")
              node: Type1Interface1NodeAggregationWhereInput
            }

            type Type1Interface1AggregateNode {
              field1: StringAggregateSelection!
            }

            input Type1Interface1ConnectFieldInput {
              connect: Interface1ConnectInput
              where: Interface1ConnectWhere
            }

            type Type1Interface1Connection {
              aggregate: Type1Interface1Interface1AggregateSelection!
              edges: [Type1Interface1Relationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input Type1Interface1ConnectionAggregateInput {
              AND: [Type1Interface1ConnectionAggregateInput!]
              NOT: Type1Interface1ConnectionAggregateInput
              OR: [Type1Interface1ConnectionAggregateInput!]
              count: ConnectionAggregationCountFilterInput
              node: Type1Interface1NodeAggregationWhereInput
            }

            input Type1Interface1ConnectionFilters {
              \\"\\"\\"
              Filter Type1s by aggregating results on related Type1Interface1Connections
              \\"\\"\\"
              aggregate: Type1Interface1ConnectionAggregateInput
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

            type Type1Interface1Interface1AggregateSelection {
              count: CountConnection!
              node: Type1Interface1Interface1NodeAggregateSelection
            }

            type Type1Interface1Interface1NodeAggregateSelection {
              field1: StringAggregateSelection!
            }

            input Type1Interface1Interface2AggregateInput {
              AND: [Type1Interface1Interface2AggregateInput!]
              NOT: Type1Interface1Interface2AggregateInput
              OR: [Type1Interface1Interface2AggregateInput!]
              count: IntScalarFilters
              count_EQ: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { eq: ... } } }' instead.\\")
              count_GT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gt: ... } } }' instead.\\")
              count_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gte: ... } } }' instead.\\")
              count_LT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lt: ... } } }' instead.\\")
              count_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lte: ... } } }' instead.\\")
              edge: Type1PropsAggregationWhereInput
              node: Type1Interface1Interface2NodeAggregationWhereInput
            }

            input Type1Interface1Interface2ConnectFieldInput {
              edge: Type1PropsCreateInput!
              where: Interface2ConnectWhere
            }

            input Type1Interface1Interface2ConnectionAggregateInput {
              AND: [Type1Interface1Interface2ConnectionAggregateInput!]
              NOT: Type1Interface1Interface2ConnectionAggregateInput
              OR: [Type1Interface1Interface2ConnectionAggregateInput!]
              count: ConnectionAggregationCountFilterInput
              edge: Type1PropsAggregationWhereInput
              node: Type1Interface1Interface2NodeAggregationWhereInput
            }

            input Type1Interface1Interface2ConnectionFilters {
              \\"\\"\\"
              Filter Type1Interface1s by aggregating results on related Interface1Interface2Connections
              \\"\\"\\"
              aggregate: Type1Interface1Interface2ConnectionAggregateInput
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

            input Type1Interface1Interface2NodeAggregationWhereInput {
              AND: [Type1Interface1Interface2NodeAggregationWhereInput!]
              NOT: Type1Interface1Interface2NodeAggregationWhereInput
              OR: [Type1Interface1Interface2NodeAggregationWhereInput!]
              field2: StringScalarAggregationFilters
              field2_AVERAGE_LENGTH_EQUAL: Float @deprecated(reason: \\"Please use the relevant generic filter 'field2: { averageLength: { eq: ... } } }' instead.\\")
              field2_AVERAGE_LENGTH_GT: Float @deprecated(reason: \\"Please use the relevant generic filter 'field2: { averageLength: { gt: ... } } }' instead.\\")
              field2_AVERAGE_LENGTH_GTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'field2: { averageLength: { gte: ... } } }' instead.\\")
              field2_AVERAGE_LENGTH_LT: Float @deprecated(reason: \\"Please use the relevant generic filter 'field2: { averageLength: { lt: ... } } }' instead.\\")
              field2_AVERAGE_LENGTH_LTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'field2: { averageLength: { lte: ... } } }' instead.\\")
              field2_LONGEST_LENGTH_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'field2: { longestLength: { eq: ... } } }' instead.\\")
              field2_LONGEST_LENGTH_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'field2: { longestLength: { gt: ... } } }' instead.\\")
              field2_LONGEST_LENGTH_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'field2: { longestLength: { gte: ... } } }' instead.\\")
              field2_LONGEST_LENGTH_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'field2: { longestLength: { lt: ... } } }' instead.\\")
              field2_LONGEST_LENGTH_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'field2: { longestLength: { lte: ... } } }' instead.\\")
              field2_SHORTEST_LENGTH_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'field2: { shortestLength: { eq: ... } } }' instead.\\")
              field2_SHORTEST_LENGTH_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'field2: { shortestLength: { gt: ... } } }' instead.\\")
              field2_SHORTEST_LENGTH_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'field2: { shortestLength: { gte: ... } } }' instead.\\")
              field2_SHORTEST_LENGTH_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'field2: { shortestLength: { lt: ... } } }' instead.\\")
              field2_SHORTEST_LENGTH_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'field2: { shortestLength: { lte: ... } } }' instead.\\")
            }

            input Type1Interface1Interface2UpdateConnectionInput {
              edge: Type1PropsUpdateInput
              node: Interface2UpdateInput
              where: Interface1Interface2ConnectionWhere
            }

            input Type1Interface1Interface2UpdateFieldInput {
              connect: [Type1Interface1Interface2ConnectFieldInput!]
              create: [Type1Interface1Interface2CreateFieldInput!]
              delete: [Type1Interface1Interface2DeleteFieldInput!]
              disconnect: [Type1Interface1Interface2DisconnectFieldInput!]
              update: Type1Interface1Interface2UpdateConnectionInput
            }

            input Type1Interface1NodeAggregationWhereInput {
              AND: [Type1Interface1NodeAggregationWhereInput!]
              NOT: Type1Interface1NodeAggregationWhereInput
              OR: [Type1Interface1NodeAggregationWhereInput!]
              field1: StringScalarAggregationFilters
              field1_AVERAGE_LENGTH_EQUAL: Float @deprecated(reason: \\"Please use the relevant generic filter 'field1: { averageLength: { eq: ... } } }' instead.\\")
              field1_AVERAGE_LENGTH_GT: Float @deprecated(reason: \\"Please use the relevant generic filter 'field1: { averageLength: { gt: ... } } }' instead.\\")
              field1_AVERAGE_LENGTH_GTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'field1: { averageLength: { gte: ... } } }' instead.\\")
              field1_AVERAGE_LENGTH_LT: Float @deprecated(reason: \\"Please use the relevant generic filter 'field1: { averageLength: { lt: ... } } }' instead.\\")
              field1_AVERAGE_LENGTH_LTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'field1: { averageLength: { lte: ... } } }' instead.\\")
              field1_LONGEST_LENGTH_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'field1: { longestLength: { eq: ... } } }' instead.\\")
              field1_LONGEST_LENGTH_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'field1: { longestLength: { gt: ... } } }' instead.\\")
              field1_LONGEST_LENGTH_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'field1: { longestLength: { gte: ... } } }' instead.\\")
              field1_LONGEST_LENGTH_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'field1: { longestLength: { lt: ... } } }' instead.\\")
              field1_LONGEST_LENGTH_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'field1: { longestLength: { lte: ... } } }' instead.\\")
              field1_SHORTEST_LENGTH_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'field1: { shortestLength: { eq: ... } } }' instead.\\")
              field1_SHORTEST_LENGTH_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'field1: { shortestLength: { gt: ... } } }' instead.\\")
              field1_SHORTEST_LENGTH_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'field1: { shortestLength: { gte: ... } } }' instead.\\")
              field1_SHORTEST_LENGTH_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'field1: { shortestLength: { lt: ... } } }' instead.\\")
              field1_SHORTEST_LENGTH_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'field1: { shortestLength: { lte: ... } } }' instead.\\")
            }

            type Type1Interface1Relationship {
              cursor: String!
              node: Interface1!
            }

            \\"\\"\\"
            Fields to sort Type1Interface1s by. The order in which sorts are applied is not guaranteed when specifying many fields in one Type1Interface1Sort object.
            \\"\\"\\"
            input Type1Interface1Sort {
              field1: SortDirection
            }

            input Type1Interface1UpdateConnectionInput {
              node: Interface1UpdateInput
              where: Type1Interface1ConnectionWhere
            }

            input Type1Interface1UpdateFieldInput {
              connect: [Type1Interface1ConnectFieldInput!]
              create: [Type1Interface1CreateFieldInput!]
              delete: [Type1Interface1DeleteFieldInput!]
              disconnect: [Type1Interface1DisconnectFieldInput!]
              update: Type1Interface1UpdateConnectionInput
            }

            input Type1Interface1UpdateInput {
              field1: StringScalarMutations
              field1_SET: String @deprecated(reason: \\"Please use the generic mutation 'field1: { set: ... } }' instead.\\")
              interface2: [Type1Interface1Interface2UpdateFieldInput!]
            }

            input Type1Interface1Where {
              AND: [Type1Interface1Where!]
              NOT: Type1Interface1Where
              OR: [Type1Interface1Where!]
              field1: StringScalarFilters
              field1_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter field1: { contains: ... }\\")
              field1_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter field1: { endsWith: ... }\\")
              field1_EQ: String @deprecated(reason: \\"Please use the relevant generic filter field1: { eq: ... }\\")
              field1_IN: [String!] @deprecated(reason: \\"Please use the relevant generic filter field1: { in: ... }\\")
              field1_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter field1: { startsWith: ... }\\")
              interface2: Interface2RelationshipFilters
              interface2Aggregate: Type1Interface1Interface2AggregateInput @deprecated(reason: \\"Aggregate filters are moved inside the interface2Connection filter, please use { interface2Connection: { aggregate: {...} } } instead\\")
              interface2Connection: Type1Interface1Interface2ConnectionFilters
              \\"\\"\\"
              Return Type1Interface1s where all of the related Interface1Interface2Connections match this filter
              \\"\\"\\"
              interface2Connection_ALL: Interface1Interface2ConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'interface2Connection: { all: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Type1Interface1s where none of the related Interface1Interface2Connections match this filter
              \\"\\"\\"
              interface2Connection_NONE: Interface1Interface2ConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'interface2Connection: { none: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Type1Interface1s where one of the related Interface1Interface2Connections match this filter
              \\"\\"\\"
              interface2Connection_SINGLE: Interface1Interface2ConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'interface2Connection: { single: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Type1Interface1s where some of the related Interface1Interface2Connections match this filter
              \\"\\"\\"
              interface2Connection_SOME: Interface1Interface2ConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'interface2Connection: { some: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Type1Interface1s where all of the related Interface2s match this filter
              \\"\\"\\"
              interface2_ALL: Interface2Where @deprecated(reason: \\"Please use the relevant generic filter 'interface2: { all: ... }' instead.\\")
              \\"\\"\\"
              Return Type1Interface1s where none of the related Interface2s match this filter
              \\"\\"\\"
              interface2_NONE: Interface2Where @deprecated(reason: \\"Please use the relevant generic filter 'interface2: { none: ... }' instead.\\")
              \\"\\"\\"
              Return Type1Interface1s where one of the related Interface2s match this filter
              \\"\\"\\"
              interface2_SINGLE: Interface2Where @deprecated(reason: \\"Please use the relevant generic filter 'interface2: {  single: ... }' instead.\\")
              \\"\\"\\"
              Return Type1Interface1s where some of the related Interface2s match this filter
              \\"\\"\\"
              interface2_SOME: Interface2Where @deprecated(reason: \\"Please use the relevant generic filter 'interface2: {  some: ... }' instead.\\")
            }

            type Type1Interface1sConnection {
              aggregate: Type1Interface1Aggregate!
              edges: [Type1Interface1Edge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            type Type1Interface2 implements Interface2 {
              field2: String!
            }

            type Type1Interface2Aggregate {
              count: Count!
              node: Type1Interface2AggregateNode!
            }

            type Type1Interface2AggregateNode {
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
              field2: StringScalarMutations
              field2_SET: String @deprecated(reason: \\"Please use the generic mutation 'field2: { set: ... } }' instead.\\")
            }

            input Type1Interface2Where {
              AND: [Type1Interface2Where!]
              NOT: Type1Interface2Where
              OR: [Type1Interface2Where!]
              field2: StringScalarFilters
              field2_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter field2: { contains: ... }\\")
              field2_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter field2: { endsWith: ... }\\")
              field2_EQ: String @deprecated(reason: \\"Please use the relevant generic filter field2: { eq: ... }\\")
              field2_IN: [String!] @deprecated(reason: \\"Please use the relevant generic filter field2: { in: ... }\\")
              field2_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter field2: { startsWith: ... }\\")
            }

            type Type1Interface2sConnection {
              aggregate: Type1Interface2Aggregate!
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
              type1Field: IntScalarAggregationFilters
              type1Field_AVERAGE_EQUAL: Float @deprecated(reason: \\"Please use the relevant generic filter 'type1Field: { average: { eq: ... } } }' instead.\\")
              type1Field_AVERAGE_GT: Float @deprecated(reason: \\"Please use the relevant generic filter 'type1Field: { average: { gt: ... } } }' instead.\\")
              type1Field_AVERAGE_GTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'type1Field: { average: { gte: ... } } }' instead.\\")
              type1Field_AVERAGE_LT: Float @deprecated(reason: \\"Please use the relevant generic filter 'type1Field: { average: { lt: ... } } }' instead.\\")
              type1Field_AVERAGE_LTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'type1Field: { average: { lte: ... } } }' instead.\\")
              type1Field_MAX_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'type1Field: { max: { eq: ... } } }' instead.\\")
              type1Field_MAX_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'type1Field: { max: { gt: ... } } }' instead.\\")
              type1Field_MAX_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'type1Field: { max: { gte: ... } } }' instead.\\")
              type1Field_MAX_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'type1Field: { max: { lt: ... } } }' instead.\\")
              type1Field_MAX_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'type1Field: { max: { lte: ... } } }' instead.\\")
              type1Field_MIN_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'type1Field: { min: { eq: ... } } }' instead.\\")
              type1Field_MIN_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'type1Field: { min: { gt: ... } } }' instead.\\")
              type1Field_MIN_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'type1Field: { min: { gte: ... } } }' instead.\\")
              type1Field_MIN_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'type1Field: { min: { lt: ... } } }' instead.\\")
              type1Field_MIN_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'type1Field: { min: { lte: ... } } }' instead.\\")
              type1Field_SUM_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'type1Field: { sum: { eq: ... } } }' instead.\\")
              type1Field_SUM_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'type1Field: { sum: { gt: ... } } }' instead.\\")
              type1Field_SUM_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'type1Field: { sum: { gte: ... } } }' instead.\\")
              type1Field_SUM_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'type1Field: { sum: { lt: ... } } }' instead.\\")
              type1Field_SUM_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'type1Field: { sum: { lte: ... } } }' instead.\\")
            }

            input Type1PropsCreateInput {
              type1Field: Int!
            }

            input Type1PropsSort {
              type1Field: SortDirection
            }

            input Type1PropsUpdateInput {
              type1Field: IntScalarMutations
              type1Field_DECREMENT: Int @deprecated(reason: \\"Please use the relevant generic mutation 'type1Field: { decrement: ... } }' instead.\\")
              type1Field_INCREMENT: Int @deprecated(reason: \\"Please use the relevant generic mutation 'type1Field: { increment: ... } }' instead.\\")
              type1Field_SET: Int @deprecated(reason: \\"Please use the generic mutation 'type1Field: { set: ... } }' instead.\\")
            }

            input Type1PropsWhere {
              AND: [Type1PropsWhere!]
              NOT: Type1PropsWhere
              OR: [Type1PropsWhere!]
              type1Field: IntScalarFilters
              type1Field_EQ: Int @deprecated(reason: \\"Please use the relevant generic filter type1Field: { eq: ... }\\")
              type1Field_GT: Int @deprecated(reason: \\"Please use the relevant generic filter type1Field: { gt: ... }\\")
              type1Field_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter type1Field: { gte: ... }\\")
              type1Field_IN: [Int!] @deprecated(reason: \\"Please use the relevant generic filter type1Field: { in: ... }\\")
              type1Field_LT: Int @deprecated(reason: \\"Please use the relevant generic filter type1Field: { lt: ... }\\")
              type1Field_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter type1Field: { lte: ... }\\")
            }

            \\"\\"\\"
            Fields to sort Type1s by. The order in which sorts are applied is not guaranteed when specifying many fields in one Type1Sort object.
            \\"\\"\\"
            input Type1Sort {
              field1: SortDirection
            }

            input Type1UpdateInput {
              field1: StringScalarMutations
              field1_SET: String @deprecated(reason: \\"Please use the generic mutation 'field1: { set: ... } }' instead.\\")
              interface1: [Type1Interface1UpdateFieldInput!]
            }

            input Type1Where {
              AND: [Type1Where!]
              NOT: Type1Where
              OR: [Type1Where!]
              field1: StringScalarFilters
              field1_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter field1: { contains: ... }\\")
              field1_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter field1: { endsWith: ... }\\")
              field1_EQ: String @deprecated(reason: \\"Please use the relevant generic filter field1: { eq: ... }\\")
              field1_IN: [String!] @deprecated(reason: \\"Please use the relevant generic filter field1: { in: ... }\\")
              field1_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter field1: { startsWith: ... }\\")
              interface1: Interface1RelationshipFilters
              interface1Aggregate: Type1Interface1AggregateInput @deprecated(reason: \\"Aggregate filters are moved inside the interface1Connection filter, please use { interface1Connection: { aggregate: {...} } } instead\\")
              interface1Connection: Type1Interface1ConnectionFilters
              \\"\\"\\"
              Return Type1s where all of the related Type1Interface1Connections match this filter
              \\"\\"\\"
              interface1Connection_ALL: Type1Interface1ConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'interface1Connection: { all: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Type1s where none of the related Type1Interface1Connections match this filter
              \\"\\"\\"
              interface1Connection_NONE: Type1Interface1ConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'interface1Connection: { none: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Type1s where one of the related Type1Interface1Connections match this filter
              \\"\\"\\"
              interface1Connection_SINGLE: Type1Interface1ConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'interface1Connection: { single: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Type1s where some of the related Type1Interface1Connections match this filter
              \\"\\"\\"
              interface1Connection_SOME: Type1Interface1ConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'interface1Connection: { some: { node: ... } } }' instead.\\")
              \\"\\"\\"Return Type1s where all of the related Interface1s match this filter\\"\\"\\"
              interface1_ALL: Interface1Where @deprecated(reason: \\"Please use the relevant generic filter 'interface1: { all: ... }' instead.\\")
              \\"\\"\\"Return Type1s where none of the related Interface1s match this filter\\"\\"\\"
              interface1_NONE: Interface1Where @deprecated(reason: \\"Please use the relevant generic filter 'interface1: { none: ... }' instead.\\")
              \\"\\"\\"Return Type1s where one of the related Interface1s match this filter\\"\\"\\"
              interface1_SINGLE: Interface1Where @deprecated(reason: \\"Please use the relevant generic filter 'interface1: {  single: ... }' instead.\\")
              \\"\\"\\"Return Type1s where some of the related Interface1s match this filter\\"\\"\\"
              interface1_SOME: Interface1Where @deprecated(reason: \\"Please use the relevant generic filter 'interface1: {  some: ... }' instead.\\")
            }

            type Type1sConnection {
              aggregate: Type1Aggregate!
              edges: [Type1Edge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            type Type2Interface1 implements Interface1 {
              field1: String!
              interface2(limit: Int, offset: Int, sort: [Interface2Sort!], where: Interface2Where): [Interface2!]!
              interface2Connection(after: String, first: Int, sort: [Interface1Interface2ConnectionSort!], where: Interface1Interface2ConnectionWhere): Interface1Interface2Connection!
            }

            type Type2Interface1Aggregate {
              count: Count!
              node: Type2Interface1AggregateNode!
            }

            type Type2Interface1AggregateNode {
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
              count: IntScalarFilters
              count_EQ: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { eq: ... } } }' instead.\\")
              count_GT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gt: ... } } }' instead.\\")
              count_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gte: ... } } }' instead.\\")
              count_LT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lt: ... } } }' instead.\\")
              count_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lte: ... } } }' instead.\\")
              edge: Type2PropsAggregationWhereInput
              node: Type2Interface1Interface2NodeAggregationWhereInput
            }

            input Type2Interface1Interface2ConnectFieldInput {
              edge: Type2PropsCreateInput!
              where: Interface2ConnectWhere
            }

            input Type2Interface1Interface2ConnectionAggregateInput {
              AND: [Type2Interface1Interface2ConnectionAggregateInput!]
              NOT: Type2Interface1Interface2ConnectionAggregateInput
              OR: [Type2Interface1Interface2ConnectionAggregateInput!]
              count: ConnectionAggregationCountFilterInput
              edge: Type2PropsAggregationWhereInput
              node: Type2Interface1Interface2NodeAggregationWhereInput
            }

            input Type2Interface1Interface2ConnectionFilters {
              \\"\\"\\"
              Filter Type2Interface1s by aggregating results on related Interface1Interface2Connections
              \\"\\"\\"
              aggregate: Type2Interface1Interface2ConnectionAggregateInput
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

            input Type2Interface1Interface2NodeAggregationWhereInput {
              AND: [Type2Interface1Interface2NodeAggregationWhereInput!]
              NOT: Type2Interface1Interface2NodeAggregationWhereInput
              OR: [Type2Interface1Interface2NodeAggregationWhereInput!]
              field2: StringScalarAggregationFilters
              field2_AVERAGE_LENGTH_EQUAL: Float @deprecated(reason: \\"Please use the relevant generic filter 'field2: { averageLength: { eq: ... } } }' instead.\\")
              field2_AVERAGE_LENGTH_GT: Float @deprecated(reason: \\"Please use the relevant generic filter 'field2: { averageLength: { gt: ... } } }' instead.\\")
              field2_AVERAGE_LENGTH_GTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'field2: { averageLength: { gte: ... } } }' instead.\\")
              field2_AVERAGE_LENGTH_LT: Float @deprecated(reason: \\"Please use the relevant generic filter 'field2: { averageLength: { lt: ... } } }' instead.\\")
              field2_AVERAGE_LENGTH_LTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'field2: { averageLength: { lte: ... } } }' instead.\\")
              field2_LONGEST_LENGTH_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'field2: { longestLength: { eq: ... } } }' instead.\\")
              field2_LONGEST_LENGTH_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'field2: { longestLength: { gt: ... } } }' instead.\\")
              field2_LONGEST_LENGTH_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'field2: { longestLength: { gte: ... } } }' instead.\\")
              field2_LONGEST_LENGTH_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'field2: { longestLength: { lt: ... } } }' instead.\\")
              field2_LONGEST_LENGTH_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'field2: { longestLength: { lte: ... } } }' instead.\\")
              field2_SHORTEST_LENGTH_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'field2: { shortestLength: { eq: ... } } }' instead.\\")
              field2_SHORTEST_LENGTH_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'field2: { shortestLength: { gt: ... } } }' instead.\\")
              field2_SHORTEST_LENGTH_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'field2: { shortestLength: { gte: ... } } }' instead.\\")
              field2_SHORTEST_LENGTH_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'field2: { shortestLength: { lt: ... } } }' instead.\\")
              field2_SHORTEST_LENGTH_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'field2: { shortestLength: { lte: ... } } }' instead.\\")
            }

            input Type2Interface1Interface2UpdateConnectionInput {
              edge: Type2PropsUpdateInput
              node: Interface2UpdateInput
              where: Interface1Interface2ConnectionWhere
            }

            input Type2Interface1Interface2UpdateFieldInput {
              connect: [Type2Interface1Interface2ConnectFieldInput!]
              create: [Type2Interface1Interface2CreateFieldInput!]
              delete: [Type2Interface1Interface2DeleteFieldInput!]
              disconnect: [Type2Interface1Interface2DisconnectFieldInput!]
              update: Type2Interface1Interface2UpdateConnectionInput
            }

            \\"\\"\\"
            Fields to sort Type2Interface1s by. The order in which sorts are applied is not guaranteed when specifying many fields in one Type2Interface1Sort object.
            \\"\\"\\"
            input Type2Interface1Sort {
              field1: SortDirection
            }

            input Type2Interface1UpdateInput {
              field1: StringScalarMutations
              field1_SET: String @deprecated(reason: \\"Please use the generic mutation 'field1: { set: ... } }' instead.\\")
              interface2: [Type2Interface1Interface2UpdateFieldInput!]
            }

            input Type2Interface1Where {
              AND: [Type2Interface1Where!]
              NOT: Type2Interface1Where
              OR: [Type2Interface1Where!]
              field1: StringScalarFilters
              field1_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter field1: { contains: ... }\\")
              field1_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter field1: { endsWith: ... }\\")
              field1_EQ: String @deprecated(reason: \\"Please use the relevant generic filter field1: { eq: ... }\\")
              field1_IN: [String!] @deprecated(reason: \\"Please use the relevant generic filter field1: { in: ... }\\")
              field1_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter field1: { startsWith: ... }\\")
              interface2: Interface2RelationshipFilters
              interface2Aggregate: Type2Interface1Interface2AggregateInput @deprecated(reason: \\"Aggregate filters are moved inside the interface2Connection filter, please use { interface2Connection: { aggregate: {...} } } instead\\")
              interface2Connection: Type2Interface1Interface2ConnectionFilters
              \\"\\"\\"
              Return Type2Interface1s where all of the related Interface1Interface2Connections match this filter
              \\"\\"\\"
              interface2Connection_ALL: Interface1Interface2ConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'interface2Connection: { all: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Type2Interface1s where none of the related Interface1Interface2Connections match this filter
              \\"\\"\\"
              interface2Connection_NONE: Interface1Interface2ConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'interface2Connection: { none: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Type2Interface1s where one of the related Interface1Interface2Connections match this filter
              \\"\\"\\"
              interface2Connection_SINGLE: Interface1Interface2ConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'interface2Connection: { single: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Type2Interface1s where some of the related Interface1Interface2Connections match this filter
              \\"\\"\\"
              interface2Connection_SOME: Interface1Interface2ConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'interface2Connection: { some: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Type2Interface1s where all of the related Interface2s match this filter
              \\"\\"\\"
              interface2_ALL: Interface2Where @deprecated(reason: \\"Please use the relevant generic filter 'interface2: { all: ... }' instead.\\")
              \\"\\"\\"
              Return Type2Interface1s where none of the related Interface2s match this filter
              \\"\\"\\"
              interface2_NONE: Interface2Where @deprecated(reason: \\"Please use the relevant generic filter 'interface2: { none: ... }' instead.\\")
              \\"\\"\\"
              Return Type2Interface1s where one of the related Interface2s match this filter
              \\"\\"\\"
              interface2_SINGLE: Interface2Where @deprecated(reason: \\"Please use the relevant generic filter 'interface2: {  single: ... }' instead.\\")
              \\"\\"\\"
              Return Type2Interface1s where some of the related Interface2s match this filter
              \\"\\"\\"
              interface2_SOME: Interface2Where @deprecated(reason: \\"Please use the relevant generic filter 'interface2: {  some: ... }' instead.\\")
            }

            type Type2Interface1sConnection {
              aggregate: Type2Interface1Aggregate!
              edges: [Type2Interface1Edge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            type Type2Interface2 implements Interface2 {
              field2: String!
            }

            type Type2Interface2Aggregate {
              count: Count!
              node: Type2Interface2AggregateNode!
            }

            type Type2Interface2AggregateNode {
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
              field2: StringScalarMutations
              field2_SET: String @deprecated(reason: \\"Please use the generic mutation 'field2: { set: ... } }' instead.\\")
            }

            input Type2Interface2Where {
              AND: [Type2Interface2Where!]
              NOT: Type2Interface2Where
              OR: [Type2Interface2Where!]
              field2: StringScalarFilters
              field2_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter field2: { contains: ... }\\")
              field2_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter field2: { endsWith: ... }\\")
              field2_EQ: String @deprecated(reason: \\"Please use the relevant generic filter field2: { eq: ... }\\")
              field2_IN: [String!] @deprecated(reason: \\"Please use the relevant generic filter field2: { in: ... }\\")
              field2_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter field2: { startsWith: ... }\\")
            }

            type Type2Interface2sConnection {
              aggregate: Type2Interface2Aggregate!
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
              type2Field: IntScalarAggregationFilters
              type2Field_AVERAGE_EQUAL: Float @deprecated(reason: \\"Please use the relevant generic filter 'type2Field: { average: { eq: ... } } }' instead.\\")
              type2Field_AVERAGE_GT: Float @deprecated(reason: \\"Please use the relevant generic filter 'type2Field: { average: { gt: ... } } }' instead.\\")
              type2Field_AVERAGE_GTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'type2Field: { average: { gte: ... } } }' instead.\\")
              type2Field_AVERAGE_LT: Float @deprecated(reason: \\"Please use the relevant generic filter 'type2Field: { average: { lt: ... } } }' instead.\\")
              type2Field_AVERAGE_LTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'type2Field: { average: { lte: ... } } }' instead.\\")
              type2Field_MAX_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'type2Field: { max: { eq: ... } } }' instead.\\")
              type2Field_MAX_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'type2Field: { max: { gt: ... } } }' instead.\\")
              type2Field_MAX_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'type2Field: { max: { gte: ... } } }' instead.\\")
              type2Field_MAX_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'type2Field: { max: { lt: ... } } }' instead.\\")
              type2Field_MAX_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'type2Field: { max: { lte: ... } } }' instead.\\")
              type2Field_MIN_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'type2Field: { min: { eq: ... } } }' instead.\\")
              type2Field_MIN_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'type2Field: { min: { gt: ... } } }' instead.\\")
              type2Field_MIN_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'type2Field: { min: { gte: ... } } }' instead.\\")
              type2Field_MIN_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'type2Field: { min: { lt: ... } } }' instead.\\")
              type2Field_MIN_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'type2Field: { min: { lte: ... } } }' instead.\\")
              type2Field_SUM_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'type2Field: { sum: { eq: ... } } }' instead.\\")
              type2Field_SUM_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'type2Field: { sum: { gt: ... } } }' instead.\\")
              type2Field_SUM_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'type2Field: { sum: { gte: ... } } }' instead.\\")
              type2Field_SUM_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'type2Field: { sum: { lt: ... } } }' instead.\\")
              type2Field_SUM_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'type2Field: { sum: { lte: ... } } }' instead.\\")
            }

            input Type2PropsCreateInput {
              type2Field: Int!
            }

            input Type2PropsSort {
              type2Field: SortDirection
            }

            input Type2PropsUpdateInput {
              type2Field: IntScalarMutations
              type2Field_DECREMENT: Int @deprecated(reason: \\"Please use the relevant generic mutation 'type2Field: { decrement: ... } }' instead.\\")
              type2Field_INCREMENT: Int @deprecated(reason: \\"Please use the relevant generic mutation 'type2Field: { increment: ... } }' instead.\\")
              type2Field_SET: Int @deprecated(reason: \\"Please use the generic mutation 'type2Field: { set: ... } }' instead.\\")
            }

            input Type2PropsWhere {
              AND: [Type2PropsWhere!]
              NOT: Type2PropsWhere
              OR: [Type2PropsWhere!]
              type2Field: IntScalarFilters
              type2Field_EQ: Int @deprecated(reason: \\"Please use the relevant generic filter type2Field: { eq: ... }\\")
              type2Field_GT: Int @deprecated(reason: \\"Please use the relevant generic filter type2Field: { gt: ... }\\")
              type2Field_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter type2Field: { gte: ... }\\")
              type2Field_IN: [Int!] @deprecated(reason: \\"Please use the relevant generic filter type2Field: { in: ... }\\")
              type2Field_LT: Int @deprecated(reason: \\"Please use the relevant generic filter type2Field: { lt: ... }\\")
              type2Field_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter type2Field: { lte: ... }\\")
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
              creatorConnection(after: String, first: Int, sort: [ContentCreatorConnectionSort!], where: ContentCreatorConnectionWhere): ContentCreatorConnection!
              id: ID
              post(limit: Int, offset: Int, sort: [PostSort!], where: PostWhere): [Post!]!
              postConnection(after: String, first: Int, sort: [CommentPostConnectionSort!], where: CommentPostConnectionWhere): CommentPostConnection!
            }

            type CommentAggregate {
              count: Count!
              node: CommentAggregateNode!
            }

            type CommentAggregateNode {
              content: StringAggregateSelection!
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
              count: IntScalarFilters
              count_EQ: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { eq: ... } } }' instead.\\")
              count_GT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gt: ... } } }' instead.\\")
              count_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gte: ... } } }' instead.\\")
              count_LT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lt: ... } } }' instead.\\")
              count_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lte: ... } } }' instead.\\")
              node: CommentCreatorNodeAggregationWhereInput
            }

            input CommentCreatorConnectFieldInput {
              connect: [UserConnectInput!]
              where: UserConnectWhere
            }

            input CommentCreatorConnectionAggregateInput {
              AND: [CommentCreatorConnectionAggregateInput!]
              NOT: CommentCreatorConnectionAggregateInput
              OR: [CommentCreatorConnectionAggregateInput!]
              count: ConnectionAggregationCountFilterInput
              node: CommentCreatorNodeAggregationWhereInput
            }

            input CommentCreatorConnectionFilters {
              \\"\\"\\"
              Filter Comments by aggregating results on related ContentCreatorConnections
              \\"\\"\\"
              aggregate: CommentCreatorConnectionAggregateInput
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
              name: StringScalarAggregationFilters
              name_AVERAGE_LENGTH_EQUAL: Float @deprecated(reason: \\"Please use the relevant generic filter 'name: { averageLength: { eq: ... } } }' instead.\\")
              name_AVERAGE_LENGTH_GT: Float @deprecated(reason: \\"Please use the relevant generic filter 'name: { averageLength: { gt: ... } } }' instead.\\")
              name_AVERAGE_LENGTH_GTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'name: { averageLength: { gte: ... } } }' instead.\\")
              name_AVERAGE_LENGTH_LT: Float @deprecated(reason: \\"Please use the relevant generic filter 'name: { averageLength: { lt: ... } } }' instead.\\")
              name_AVERAGE_LENGTH_LTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'name: { averageLength: { lte: ... } } }' instead.\\")
              name_LONGEST_LENGTH_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'name: { longestLength: { eq: ... } } }' instead.\\")
              name_LONGEST_LENGTH_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'name: { longestLength: { gt: ... } } }' instead.\\")
              name_LONGEST_LENGTH_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'name: { longestLength: { gte: ... } } }' instead.\\")
              name_LONGEST_LENGTH_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'name: { longestLength: { lt: ... } } }' instead.\\")
              name_LONGEST_LENGTH_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'name: { longestLength: { lte: ... } } }' instead.\\")
              name_SHORTEST_LENGTH_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'name: { shortestLength: { eq: ... } } }' instead.\\")
              name_SHORTEST_LENGTH_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'name: { shortestLength: { gt: ... } } }' instead.\\")
              name_SHORTEST_LENGTH_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'name: { shortestLength: { gte: ... } } }' instead.\\")
              name_SHORTEST_LENGTH_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'name: { shortestLength: { lt: ... } } }' instead.\\")
              name_SHORTEST_LENGTH_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'name: { shortestLength: { lte: ... } } }' instead.\\")
            }

            input CommentCreatorUpdateConnectionInput {
              node: UserUpdateInput
              where: ContentCreatorConnectionWhere
            }

            input CommentCreatorUpdateFieldInput {
              connect: [CommentCreatorConnectFieldInput!]
              create: [CommentCreatorCreateFieldInput!]
              delete: [ContentCreatorDeleteFieldInput!]
              disconnect: [ContentCreatorDisconnectFieldInput!]
              update: CommentCreatorUpdateConnectionInput
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
              count: IntScalarFilters
              count_EQ: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { eq: ... } } }' instead.\\")
              count_GT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gt: ... } } }' instead.\\")
              count_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gte: ... } } }' instead.\\")
              count_LT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lt: ... } } }' instead.\\")
              count_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lte: ... } } }' instead.\\")
              node: CommentPostNodeAggregationWhereInput
            }

            input CommentPostConnectFieldInput {
              connect: [PostConnectInput!]
              where: PostConnectWhere
            }

            type CommentPostConnection {
              aggregate: CommentPostPostAggregateSelection!
              edges: [CommentPostRelationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input CommentPostConnectionAggregateInput {
              AND: [CommentPostConnectionAggregateInput!]
              NOT: CommentPostConnectionAggregateInput
              OR: [CommentPostConnectionAggregateInput!]
              count: ConnectionAggregationCountFilterInput
              node: CommentPostNodeAggregationWhereInput
            }

            input CommentPostConnectionFilters {
              \\"\\"\\"
              Filter Comments by aggregating results on related CommentPostConnections
              \\"\\"\\"
              aggregate: CommentPostConnectionAggregateInput
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
              content: StringScalarAggregationFilters
              content_AVERAGE_LENGTH_EQUAL: Float @deprecated(reason: \\"Please use the relevant generic filter 'content: { averageLength: { eq: ... } } }' instead.\\")
              content_AVERAGE_LENGTH_GT: Float @deprecated(reason: \\"Please use the relevant generic filter 'content: { averageLength: { gt: ... } } }' instead.\\")
              content_AVERAGE_LENGTH_GTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'content: { averageLength: { gte: ... } } }' instead.\\")
              content_AVERAGE_LENGTH_LT: Float @deprecated(reason: \\"Please use the relevant generic filter 'content: { averageLength: { lt: ... } } }' instead.\\")
              content_AVERAGE_LENGTH_LTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'content: { averageLength: { lte: ... } } }' instead.\\")
              content_LONGEST_LENGTH_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'content: { longestLength: { eq: ... } } }' instead.\\")
              content_LONGEST_LENGTH_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'content: { longestLength: { gt: ... } } }' instead.\\")
              content_LONGEST_LENGTH_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'content: { longestLength: { gte: ... } } }' instead.\\")
              content_LONGEST_LENGTH_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'content: { longestLength: { lt: ... } } }' instead.\\")
              content_LONGEST_LENGTH_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'content: { longestLength: { lte: ... } } }' instead.\\")
              content_SHORTEST_LENGTH_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'content: { shortestLength: { eq: ... } } }' instead.\\")
              content_SHORTEST_LENGTH_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'content: { shortestLength: { gt: ... } } }' instead.\\")
              content_SHORTEST_LENGTH_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'content: { shortestLength: { gte: ... } } }' instead.\\")
              content_SHORTEST_LENGTH_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'content: { shortestLength: { lt: ... } } }' instead.\\")
              content_SHORTEST_LENGTH_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'content: { shortestLength: { lte: ... } } }' instead.\\")
            }

            type CommentPostPostAggregateSelection {
              count: CountConnection!
              node: CommentPostPostNodeAggregateSelection
            }

            type CommentPostPostNodeAggregateSelection {
              content: StringAggregateSelection!
            }

            type CommentPostRelationship {
              cursor: String!
              node: Post!
            }

            input CommentPostUpdateConnectionInput {
              node: PostUpdateInput
              where: CommentPostConnectionWhere
            }

            input CommentPostUpdateFieldInput {
              connect: [CommentPostConnectFieldInput!]
              create: [CommentPostCreateFieldInput!]
              delete: [CommentPostDeleteFieldInput!]
              disconnect: [CommentPostDisconnectFieldInput!]
              update: CommentPostUpdateConnectionInput
            }

            input CommentRelationshipFilters {
              \\"\\"\\"Filter type where all of the related Comments match this filter\\"\\"\\"
              all: CommentWhere
              \\"\\"\\"Filter type where none of the related Comments match this filter\\"\\"\\"
              none: CommentWhere
              \\"\\"\\"Filter type where one of the related Comments match this filter\\"\\"\\"
              single: CommentWhere
              \\"\\"\\"Filter type where some of the related Comments match this filter\\"\\"\\"
              some: CommentWhere
            }

            \\"\\"\\"
            Fields to sort Comments by. The order in which sorts are applied is not guaranteed when specifying many fields in one CommentSort object.
            \\"\\"\\"
            input CommentSort {
              content: SortDirection
              id: SortDirection
            }

            input CommentUpdateInput {
              content: StringScalarMutations
              content_SET: String @deprecated(reason: \\"Please use the generic mutation 'content: { set: ... } }' instead.\\")
              creator: [CommentCreatorUpdateFieldInput!]
              id: IDScalarMutations
              id_SET: ID @deprecated(reason: \\"Please use the generic mutation 'id: { set: ... } }' instead.\\")
              post: [CommentPostUpdateFieldInput!]
            }

            input CommentWhere {
              AND: [CommentWhere!]
              NOT: CommentWhere
              OR: [CommentWhere!]
              content: StringScalarFilters
              content_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter content: { contains: ... }\\")
              content_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter content: { endsWith: ... }\\")
              content_EQ: String @deprecated(reason: \\"Please use the relevant generic filter content: { eq: ... }\\")
              content_IN: [String] @deprecated(reason: \\"Please use the relevant generic filter content: { in: ... }\\")
              content_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter content: { startsWith: ... }\\")
              creator: UserRelationshipFilters
              creatorAggregate: CommentCreatorAggregateInput @deprecated(reason: \\"Aggregate filters are moved inside the creatorConnection filter, please use { creatorConnection: { aggregate: {...} } } instead\\")
              creatorConnection: CommentCreatorConnectionFilters
              \\"\\"\\"
              Return Comments where all of the related ContentCreatorConnections match this filter
              \\"\\"\\"
              creatorConnection_ALL: ContentCreatorConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'creatorConnection: { all: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Comments where none of the related ContentCreatorConnections match this filter
              \\"\\"\\"
              creatorConnection_NONE: ContentCreatorConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'creatorConnection: { none: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Comments where one of the related ContentCreatorConnections match this filter
              \\"\\"\\"
              creatorConnection_SINGLE: ContentCreatorConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'creatorConnection: { single: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Comments where some of the related ContentCreatorConnections match this filter
              \\"\\"\\"
              creatorConnection_SOME: ContentCreatorConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'creatorConnection: { some: { node: ... } } }' instead.\\")
              \\"\\"\\"Return Comments where all of the related Users match this filter\\"\\"\\"
              creator_ALL: UserWhere @deprecated(reason: \\"Please use the relevant generic filter 'creator: { all: ... }' instead.\\")
              \\"\\"\\"Return Comments where none of the related Users match this filter\\"\\"\\"
              creator_NONE: UserWhere @deprecated(reason: \\"Please use the relevant generic filter 'creator: { none: ... }' instead.\\")
              \\"\\"\\"Return Comments where one of the related Users match this filter\\"\\"\\"
              creator_SINGLE: UserWhere @deprecated(reason: \\"Please use the relevant generic filter 'creator: {  single: ... }' instead.\\")
              \\"\\"\\"Return Comments where some of the related Users match this filter\\"\\"\\"
              creator_SOME: UserWhere @deprecated(reason: \\"Please use the relevant generic filter 'creator: {  some: ... }' instead.\\")
              id: IDScalarFilters
              id_CONTAINS: ID @deprecated(reason: \\"Please use the relevant generic filter id: { contains: ... }\\")
              id_ENDS_WITH: ID @deprecated(reason: \\"Please use the relevant generic filter id: { endsWith: ... }\\")
              id_EQ: ID @deprecated(reason: \\"Please use the relevant generic filter id: { eq: ... }\\")
              id_IN: [ID] @deprecated(reason: \\"Please use the relevant generic filter id: { in: ... }\\")
              id_STARTS_WITH: ID @deprecated(reason: \\"Please use the relevant generic filter id: { startsWith: ... }\\")
              post: PostRelationshipFilters
              postAggregate: CommentPostAggregateInput @deprecated(reason: \\"Aggregate filters are moved inside the postConnection filter, please use { postConnection: { aggregate: {...} } } instead\\")
              postConnection: CommentPostConnectionFilters
              \\"\\"\\"
              Return Comments where all of the related CommentPostConnections match this filter
              \\"\\"\\"
              postConnection_ALL: CommentPostConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'postConnection: { all: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Comments where none of the related CommentPostConnections match this filter
              \\"\\"\\"
              postConnection_NONE: CommentPostConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'postConnection: { none: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Comments where one of the related CommentPostConnections match this filter
              \\"\\"\\"
              postConnection_SINGLE: CommentPostConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'postConnection: { single: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Comments where some of the related CommentPostConnections match this filter
              \\"\\"\\"
              postConnection_SOME: CommentPostConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'postConnection: { some: { node: ... } } }' instead.\\")
              \\"\\"\\"Return Comments where all of the related Posts match this filter\\"\\"\\"
              post_ALL: PostWhere @deprecated(reason: \\"Please use the relevant generic filter 'post: { all: ... }' instead.\\")
              \\"\\"\\"Return Comments where none of the related Posts match this filter\\"\\"\\"
              post_NONE: PostWhere @deprecated(reason: \\"Please use the relevant generic filter 'post: { none: ... }' instead.\\")
              \\"\\"\\"Return Comments where one of the related Posts match this filter\\"\\"\\"
              post_SINGLE: PostWhere @deprecated(reason: \\"Please use the relevant generic filter 'post: {  single: ... }' instead.\\")
              \\"\\"\\"Return Comments where some of the related Posts match this filter\\"\\"\\"
              post_SOME: PostWhere @deprecated(reason: \\"Please use the relevant generic filter 'post: {  some: ... }' instead.\\")
            }

            type CommentsConnection {
              aggregate: CommentAggregate!
              edges: [CommentEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input ConnectionAggregationCountFilterInput {
              edges: IntScalarFilters
              nodes: IntScalarFilters
            }

            interface Content {
              content: String
              creator(limit: Int, offset: Int, sort: [UserSort!], where: UserWhere): [User!]!
              creatorConnection(after: String, first: Int, sort: [ContentCreatorConnectionSort!], where: ContentCreatorConnectionWhere): ContentCreatorConnection!
              id: ID
            }

            type ContentAggregate {
              count: Count!
              node: ContentAggregateNode!
            }

            type ContentAggregateNode {
              content: StringAggregateSelection!
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
              count: IntScalarFilters
              count_EQ: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { eq: ... } } }' instead.\\")
              count_GT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gt: ... } } }' instead.\\")
              count_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gte: ... } } }' instead.\\")
              count_LT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lt: ... } } }' instead.\\")
              count_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lte: ... } } }' instead.\\")
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

            input ContentCreatorConnectionAggregateInput {
              AND: [ContentCreatorConnectionAggregateInput!]
              NOT: ContentCreatorConnectionAggregateInput
              OR: [ContentCreatorConnectionAggregateInput!]
              count: ConnectionAggregationCountFilterInput
              node: ContentCreatorNodeAggregationWhereInput
            }

            input ContentCreatorConnectionFilters {
              \\"\\"\\"
              Filter Contents by aggregating results on related ContentCreatorConnections
              \\"\\"\\"
              aggregate: ContentCreatorConnectionAggregateInput
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
              name: StringScalarAggregationFilters
              name_AVERAGE_LENGTH_EQUAL: Float @deprecated(reason: \\"Please use the relevant generic filter 'name: { averageLength: { eq: ... } } }' instead.\\")
              name_AVERAGE_LENGTH_GT: Float @deprecated(reason: \\"Please use the relevant generic filter 'name: { averageLength: { gt: ... } } }' instead.\\")
              name_AVERAGE_LENGTH_GTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'name: { averageLength: { gte: ... } } }' instead.\\")
              name_AVERAGE_LENGTH_LT: Float @deprecated(reason: \\"Please use the relevant generic filter 'name: { averageLength: { lt: ... } } }' instead.\\")
              name_AVERAGE_LENGTH_LTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'name: { averageLength: { lte: ... } } }' instead.\\")
              name_LONGEST_LENGTH_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'name: { longestLength: { eq: ... } } }' instead.\\")
              name_LONGEST_LENGTH_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'name: { longestLength: { gt: ... } } }' instead.\\")
              name_LONGEST_LENGTH_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'name: { longestLength: { gte: ... } } }' instead.\\")
              name_LONGEST_LENGTH_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'name: { longestLength: { lt: ... } } }' instead.\\")
              name_LONGEST_LENGTH_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'name: { longestLength: { lte: ... } } }' instead.\\")
              name_SHORTEST_LENGTH_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'name: { shortestLength: { eq: ... } } }' instead.\\")
              name_SHORTEST_LENGTH_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'name: { shortestLength: { gt: ... } } }' instead.\\")
              name_SHORTEST_LENGTH_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'name: { shortestLength: { gte: ... } } }' instead.\\")
              name_SHORTEST_LENGTH_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'name: { shortestLength: { lt: ... } } }' instead.\\")
              name_SHORTEST_LENGTH_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'name: { shortestLength: { lte: ... } } }' instead.\\")
            }

            type ContentCreatorRelationship {
              cursor: String!
              node: User!
            }

            input ContentCreatorUpdateConnectionInput {
              node: UserUpdateInput
              where: ContentCreatorConnectionWhere
            }

            input ContentCreatorUpdateFieldInput {
              connect: [ContentCreatorConnectFieldInput!]
              create: [ContentCreatorCreateFieldInput!]
              delete: [ContentCreatorDeleteFieldInput!]
              disconnect: [ContentCreatorDisconnectFieldInput!]
              update: ContentCreatorUpdateConnectionInput
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

            input ContentRelationshipFilters {
              \\"\\"\\"Filter type where all of the related Contents match this filter\\"\\"\\"
              all: ContentWhere
              \\"\\"\\"Filter type where none of the related Contents match this filter\\"\\"\\"
              none: ContentWhere
              \\"\\"\\"Filter type where one of the related Contents match this filter\\"\\"\\"
              single: ContentWhere
              \\"\\"\\"Filter type where some of the related Contents match this filter\\"\\"\\"
              some: ContentWhere
            }

            \\"\\"\\"
            Fields to sort Contents by. The order in which sorts are applied is not guaranteed when specifying many fields in one ContentSort object.
            \\"\\"\\"
            input ContentSort {
              content: SortDirection
              id: SortDirection
            }

            input ContentUpdateInput {
              content: StringScalarMutations
              content_SET: String @deprecated(reason: \\"Please use the generic mutation 'content: { set: ... } }' instead.\\")
              creator: [ContentCreatorUpdateFieldInput!]
              id: IDScalarMutations
              id_SET: ID @deprecated(reason: \\"Please use the generic mutation 'id: { set: ... } }' instead.\\")
            }

            input ContentWhere {
              AND: [ContentWhere!]
              NOT: ContentWhere
              OR: [ContentWhere!]
              content: StringScalarFilters
              content_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter content: { contains: ... }\\")
              content_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter content: { endsWith: ... }\\")
              content_EQ: String @deprecated(reason: \\"Please use the relevant generic filter content: { eq: ... }\\")
              content_IN: [String] @deprecated(reason: \\"Please use the relevant generic filter content: { in: ... }\\")
              content_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter content: { startsWith: ... }\\")
              creator: UserRelationshipFilters
              creatorAggregate: ContentCreatorAggregateInput @deprecated(reason: \\"Aggregate filters are moved inside the creatorConnection filter, please use { creatorConnection: { aggregate: {...} } } instead\\")
              creatorConnection: ContentCreatorConnectionFilters
              \\"\\"\\"
              Return Contents where all of the related ContentCreatorConnections match this filter
              \\"\\"\\"
              creatorConnection_ALL: ContentCreatorConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'creatorConnection: { all: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Contents where none of the related ContentCreatorConnections match this filter
              \\"\\"\\"
              creatorConnection_NONE: ContentCreatorConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'creatorConnection: { none: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Contents where one of the related ContentCreatorConnections match this filter
              \\"\\"\\"
              creatorConnection_SINGLE: ContentCreatorConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'creatorConnection: { single: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Contents where some of the related ContentCreatorConnections match this filter
              \\"\\"\\"
              creatorConnection_SOME: ContentCreatorConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'creatorConnection: { some: { node: ... } } }' instead.\\")
              \\"\\"\\"Return Contents where all of the related Users match this filter\\"\\"\\"
              creator_ALL: UserWhere @deprecated(reason: \\"Please use the relevant generic filter 'creator: { all: ... }' instead.\\")
              \\"\\"\\"Return Contents where none of the related Users match this filter\\"\\"\\"
              creator_NONE: UserWhere @deprecated(reason: \\"Please use the relevant generic filter 'creator: { none: ... }' instead.\\")
              \\"\\"\\"Return Contents where one of the related Users match this filter\\"\\"\\"
              creator_SINGLE: UserWhere @deprecated(reason: \\"Please use the relevant generic filter 'creator: {  single: ... }' instead.\\")
              \\"\\"\\"Return Contents where some of the related Users match this filter\\"\\"\\"
              creator_SOME: UserWhere @deprecated(reason: \\"Please use the relevant generic filter 'creator: {  some: ... }' instead.\\")
              id: IDScalarFilters
              id_CONTAINS: ID @deprecated(reason: \\"Please use the relevant generic filter id: { contains: ... }\\")
              id_ENDS_WITH: ID @deprecated(reason: \\"Please use the relevant generic filter id: { endsWith: ... }\\")
              id_EQ: ID @deprecated(reason: \\"Please use the relevant generic filter id: { eq: ... }\\")
              id_IN: [ID] @deprecated(reason: \\"Please use the relevant generic filter id: { in: ... }\\")
              id_STARTS_WITH: ID @deprecated(reason: \\"Please use the relevant generic filter id: { startsWith: ... }\\")
              typename: [ContentImplementation!]
            }

            type ContentsConnection {
              aggregate: ContentAggregate!
              edges: [ContentEdge!]!
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

            \\"\\"\\"Float filters\\"\\"\\"
            input FloatScalarFilters {
              eq: Float
              gt: Float
              gte: Float
              in: [Float!]
              lt: Float
              lte: Float
            }

            \\"\\"\\"ID filters\\"\\"\\"
            input IDScalarFilters {
              contains: ID
              endsWith: ID
              eq: ID
              in: [ID!]
              startsWith: ID
            }

            \\"\\"\\"ID mutations\\"\\"\\"
            input IDScalarMutations {
              set: ID
            }

            \\"\\"\\"Int filters\\"\\"\\"
            input IntScalarFilters {
              eq: Int
              gt: Int
              gte: Int
              in: [Int!]
              lt: Int
              lte: Int
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
              commentsConnection(after: String, first: Int, sort: [PostCommentsConnectionSort!], where: PostCommentsConnectionWhere): PostCommentsConnection!
              content: String
              creator(limit: Int, offset: Int, sort: [UserSort!], where: UserWhere): [User!]!
              creatorConnection(after: String, first: Int, sort: [ContentCreatorConnectionSort!], where: ContentCreatorConnectionWhere): ContentCreatorConnection!
              id: ID
            }

            type PostAggregate {
              count: Count!
              node: PostAggregateNode!
            }

            type PostAggregateNode {
              content: StringAggregateSelection!
            }

            type PostCommentCommentsAggregateSelection {
              count: CountConnection!
              node: PostCommentCommentsNodeAggregateSelection
            }

            type PostCommentCommentsNodeAggregateSelection {
              content: StringAggregateSelection!
            }

            input PostCommentsAggregateInput {
              AND: [PostCommentsAggregateInput!]
              NOT: PostCommentsAggregateInput
              OR: [PostCommentsAggregateInput!]
              count: IntScalarFilters
              count_EQ: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { eq: ... } } }' instead.\\")
              count_GT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gt: ... } } }' instead.\\")
              count_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gte: ... } } }' instead.\\")
              count_LT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lt: ... } } }' instead.\\")
              count_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lte: ... } } }' instead.\\")
              node: PostCommentsNodeAggregationWhereInput
            }

            input PostCommentsConnectFieldInput {
              connect: [CommentConnectInput!]
              where: CommentConnectWhere
            }

            type PostCommentsConnection {
              aggregate: PostCommentCommentsAggregateSelection!
              edges: [PostCommentsRelationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input PostCommentsConnectionAggregateInput {
              AND: [PostCommentsConnectionAggregateInput!]
              NOT: PostCommentsConnectionAggregateInput
              OR: [PostCommentsConnectionAggregateInput!]
              count: ConnectionAggregationCountFilterInput
              node: PostCommentsNodeAggregationWhereInput
            }

            input PostCommentsConnectionFilters {
              \\"\\"\\"Filter Posts by aggregating results on related PostCommentsConnections\\"\\"\\"
              aggregate: PostCommentsConnectionAggregateInput
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
              content: StringScalarAggregationFilters
              content_AVERAGE_LENGTH_EQUAL: Float @deprecated(reason: \\"Please use the relevant generic filter 'content: { averageLength: { eq: ... } } }' instead.\\")
              content_AVERAGE_LENGTH_GT: Float @deprecated(reason: \\"Please use the relevant generic filter 'content: { averageLength: { gt: ... } } }' instead.\\")
              content_AVERAGE_LENGTH_GTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'content: { averageLength: { gte: ... } } }' instead.\\")
              content_AVERAGE_LENGTH_LT: Float @deprecated(reason: \\"Please use the relevant generic filter 'content: { averageLength: { lt: ... } } }' instead.\\")
              content_AVERAGE_LENGTH_LTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'content: { averageLength: { lte: ... } } }' instead.\\")
              content_LONGEST_LENGTH_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'content: { longestLength: { eq: ... } } }' instead.\\")
              content_LONGEST_LENGTH_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'content: { longestLength: { gt: ... } } }' instead.\\")
              content_LONGEST_LENGTH_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'content: { longestLength: { gte: ... } } }' instead.\\")
              content_LONGEST_LENGTH_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'content: { longestLength: { lt: ... } } }' instead.\\")
              content_LONGEST_LENGTH_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'content: { longestLength: { lte: ... } } }' instead.\\")
              content_SHORTEST_LENGTH_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'content: { shortestLength: { eq: ... } } }' instead.\\")
              content_SHORTEST_LENGTH_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'content: { shortestLength: { gt: ... } } }' instead.\\")
              content_SHORTEST_LENGTH_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'content: { shortestLength: { gte: ... } } }' instead.\\")
              content_SHORTEST_LENGTH_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'content: { shortestLength: { lt: ... } } }' instead.\\")
              content_SHORTEST_LENGTH_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'content: { shortestLength: { lte: ... } } }' instead.\\")
            }

            type PostCommentsRelationship {
              cursor: String!
              node: Comment!
            }

            input PostCommentsUpdateConnectionInput {
              node: CommentUpdateInput
              where: PostCommentsConnectionWhere
            }

            input PostCommentsUpdateFieldInput {
              connect: [PostCommentsConnectFieldInput!]
              create: [PostCommentsCreateFieldInput!]
              delete: [PostCommentsDeleteFieldInput!]
              disconnect: [PostCommentsDisconnectFieldInput!]
              update: PostCommentsUpdateConnectionInput
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
              count: IntScalarFilters
              count_EQ: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { eq: ... } } }' instead.\\")
              count_GT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gt: ... } } }' instead.\\")
              count_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gte: ... } } }' instead.\\")
              count_LT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lt: ... } } }' instead.\\")
              count_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lte: ... } } }' instead.\\")
              node: PostCreatorNodeAggregationWhereInput
            }

            input PostCreatorConnectFieldInput {
              connect: [UserConnectInput!]
              where: UserConnectWhere
            }

            input PostCreatorConnectionAggregateInput {
              AND: [PostCreatorConnectionAggregateInput!]
              NOT: PostCreatorConnectionAggregateInput
              OR: [PostCreatorConnectionAggregateInput!]
              count: ConnectionAggregationCountFilterInput
              node: PostCreatorNodeAggregationWhereInput
            }

            input PostCreatorConnectionFilters {
              \\"\\"\\"
              Filter Posts by aggregating results on related ContentCreatorConnections
              \\"\\"\\"
              aggregate: PostCreatorConnectionAggregateInput
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
              name: StringScalarAggregationFilters
              name_AVERAGE_LENGTH_EQUAL: Float @deprecated(reason: \\"Please use the relevant generic filter 'name: { averageLength: { eq: ... } } }' instead.\\")
              name_AVERAGE_LENGTH_GT: Float @deprecated(reason: \\"Please use the relevant generic filter 'name: { averageLength: { gt: ... } } }' instead.\\")
              name_AVERAGE_LENGTH_GTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'name: { averageLength: { gte: ... } } }' instead.\\")
              name_AVERAGE_LENGTH_LT: Float @deprecated(reason: \\"Please use the relevant generic filter 'name: { averageLength: { lt: ... } } }' instead.\\")
              name_AVERAGE_LENGTH_LTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'name: { averageLength: { lte: ... } } }' instead.\\")
              name_LONGEST_LENGTH_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'name: { longestLength: { eq: ... } } }' instead.\\")
              name_LONGEST_LENGTH_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'name: { longestLength: { gt: ... } } }' instead.\\")
              name_LONGEST_LENGTH_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'name: { longestLength: { gte: ... } } }' instead.\\")
              name_LONGEST_LENGTH_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'name: { longestLength: { lt: ... } } }' instead.\\")
              name_LONGEST_LENGTH_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'name: { longestLength: { lte: ... } } }' instead.\\")
              name_SHORTEST_LENGTH_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'name: { shortestLength: { eq: ... } } }' instead.\\")
              name_SHORTEST_LENGTH_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'name: { shortestLength: { gt: ... } } }' instead.\\")
              name_SHORTEST_LENGTH_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'name: { shortestLength: { gte: ... } } }' instead.\\")
              name_SHORTEST_LENGTH_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'name: { shortestLength: { lt: ... } } }' instead.\\")
              name_SHORTEST_LENGTH_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'name: { shortestLength: { lte: ... } } }' instead.\\")
            }

            input PostCreatorUpdateConnectionInput {
              node: UserUpdateInput
              where: ContentCreatorConnectionWhere
            }

            input PostCreatorUpdateFieldInput {
              connect: [PostCreatorConnectFieldInput!]
              create: [PostCreatorCreateFieldInput!]
              delete: [ContentCreatorDeleteFieldInput!]
              disconnect: [ContentCreatorDisconnectFieldInput!]
              update: PostCreatorUpdateConnectionInput
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

            input PostRelationshipFilters {
              \\"\\"\\"Filter type where all of the related Posts match this filter\\"\\"\\"
              all: PostWhere
              \\"\\"\\"Filter type where none of the related Posts match this filter\\"\\"\\"
              none: PostWhere
              \\"\\"\\"Filter type where one of the related Posts match this filter\\"\\"\\"
              single: PostWhere
              \\"\\"\\"Filter type where some of the related Posts match this filter\\"\\"\\"
              some: PostWhere
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
              content: StringScalarMutations
              content_SET: String @deprecated(reason: \\"Please use the generic mutation 'content: { set: ... } }' instead.\\")
              creator: [PostCreatorUpdateFieldInput!]
              id: IDScalarMutations
              id_SET: ID @deprecated(reason: \\"Please use the generic mutation 'id: { set: ... } }' instead.\\")
            }

            input PostWhere {
              AND: [PostWhere!]
              NOT: PostWhere
              OR: [PostWhere!]
              comments: CommentRelationshipFilters
              commentsAggregate: PostCommentsAggregateInput @deprecated(reason: \\"Aggregate filters are moved inside the commentsConnection filter, please use { commentsConnection: { aggregate: {...} } } instead\\")
              commentsConnection: PostCommentsConnectionFilters
              \\"\\"\\"
              Return Posts where all of the related PostCommentsConnections match this filter
              \\"\\"\\"
              commentsConnection_ALL: PostCommentsConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'commentsConnection: { all: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Posts where none of the related PostCommentsConnections match this filter
              \\"\\"\\"
              commentsConnection_NONE: PostCommentsConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'commentsConnection: { none: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Posts where one of the related PostCommentsConnections match this filter
              \\"\\"\\"
              commentsConnection_SINGLE: PostCommentsConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'commentsConnection: { single: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Posts where some of the related PostCommentsConnections match this filter
              \\"\\"\\"
              commentsConnection_SOME: PostCommentsConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'commentsConnection: { some: { node: ... } } }' instead.\\")
              \\"\\"\\"Return Posts where all of the related Comments match this filter\\"\\"\\"
              comments_ALL: CommentWhere @deprecated(reason: \\"Please use the relevant generic filter 'comments: { all: ... }' instead.\\")
              \\"\\"\\"Return Posts where none of the related Comments match this filter\\"\\"\\"
              comments_NONE: CommentWhere @deprecated(reason: \\"Please use the relevant generic filter 'comments: { none: ... }' instead.\\")
              \\"\\"\\"Return Posts where one of the related Comments match this filter\\"\\"\\"
              comments_SINGLE: CommentWhere @deprecated(reason: \\"Please use the relevant generic filter 'comments: {  single: ... }' instead.\\")
              \\"\\"\\"Return Posts where some of the related Comments match this filter\\"\\"\\"
              comments_SOME: CommentWhere @deprecated(reason: \\"Please use the relevant generic filter 'comments: {  some: ... }' instead.\\")
              content: StringScalarFilters
              content_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter content: { contains: ... }\\")
              content_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter content: { endsWith: ... }\\")
              content_EQ: String @deprecated(reason: \\"Please use the relevant generic filter content: { eq: ... }\\")
              content_IN: [String] @deprecated(reason: \\"Please use the relevant generic filter content: { in: ... }\\")
              content_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter content: { startsWith: ... }\\")
              creator: UserRelationshipFilters
              creatorAggregate: PostCreatorAggregateInput @deprecated(reason: \\"Aggregate filters are moved inside the creatorConnection filter, please use { creatorConnection: { aggregate: {...} } } instead\\")
              creatorConnection: PostCreatorConnectionFilters
              \\"\\"\\"
              Return Posts where all of the related ContentCreatorConnections match this filter
              \\"\\"\\"
              creatorConnection_ALL: ContentCreatorConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'creatorConnection: { all: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Posts where none of the related ContentCreatorConnections match this filter
              \\"\\"\\"
              creatorConnection_NONE: ContentCreatorConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'creatorConnection: { none: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Posts where one of the related ContentCreatorConnections match this filter
              \\"\\"\\"
              creatorConnection_SINGLE: ContentCreatorConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'creatorConnection: { single: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Posts where some of the related ContentCreatorConnections match this filter
              \\"\\"\\"
              creatorConnection_SOME: ContentCreatorConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'creatorConnection: { some: { node: ... } } }' instead.\\")
              \\"\\"\\"Return Posts where all of the related Users match this filter\\"\\"\\"
              creator_ALL: UserWhere @deprecated(reason: \\"Please use the relevant generic filter 'creator: { all: ... }' instead.\\")
              \\"\\"\\"Return Posts where none of the related Users match this filter\\"\\"\\"
              creator_NONE: UserWhere @deprecated(reason: \\"Please use the relevant generic filter 'creator: { none: ... }' instead.\\")
              \\"\\"\\"Return Posts where one of the related Users match this filter\\"\\"\\"
              creator_SINGLE: UserWhere @deprecated(reason: \\"Please use the relevant generic filter 'creator: {  single: ... }' instead.\\")
              \\"\\"\\"Return Posts where some of the related Users match this filter\\"\\"\\"
              creator_SOME: UserWhere @deprecated(reason: \\"Please use the relevant generic filter 'creator: {  some: ... }' instead.\\")
              id: IDScalarFilters
              id_CONTAINS: ID @deprecated(reason: \\"Please use the relevant generic filter id: { contains: ... }\\")
              id_ENDS_WITH: ID @deprecated(reason: \\"Please use the relevant generic filter id: { endsWith: ... }\\")
              id_EQ: ID @deprecated(reason: \\"Please use the relevant generic filter id: { eq: ... }\\")
              id_IN: [ID] @deprecated(reason: \\"Please use the relevant generic filter id: { in: ... }\\")
              id_STARTS_WITH: ID @deprecated(reason: \\"Please use the relevant generic filter id: { startsWith: ... }\\")
            }

            type PostsConnection {
              aggregate: PostAggregate!
              edges: [PostEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            type Query {
              comments(limit: Int, offset: Int, sort: [CommentSort!], where: CommentWhere): [Comment!]!
              commentsConnection(after: String, first: Int, sort: [CommentSort!], where: CommentWhere): CommentsConnection!
              contents(limit: Int, offset: Int, sort: [ContentSort!], where: ContentWhere): [Content!]!
              contentsConnection(after: String, first: Int, sort: [ContentSort!], where: ContentWhere): ContentsConnection!
              posts(limit: Int, offset: Int, sort: [PostSort!], where: PostWhere): [Post!]!
              postsConnection(after: String, first: Int, sort: [PostSort!], where: PostWhere): PostsConnection!
              users(limit: Int, offset: Int, sort: [UserSort!], where: UserWhere): [User!]!
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

            \\"\\"\\"Filters for an aggregation of a string field\\"\\"\\"
            input StringScalarAggregationFilters {
              averageLength: FloatScalarFilters
              longestLength: IntScalarFilters
              shortestLength: IntScalarFilters
            }

            \\"\\"\\"String filters\\"\\"\\"
            input StringScalarFilters {
              contains: String
              endsWith: String
              eq: String
              in: [String!]
              startsWith: String
            }

            \\"\\"\\"String mutations\\"\\"\\"
            input StringScalarMutations {
              set: String
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
              contentConnection(after: String, first: Int, sort: [UserContentConnectionSort!], where: UserContentConnectionWhere): UserContentConnection!
              id: ID
              name: String
            }

            type UserAggregate {
              count: Count!
              node: UserAggregateNode!
            }

            type UserAggregateNode {
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
              count: IntScalarFilters
              count_EQ: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { eq: ... } } }' instead.\\")
              count_GT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gt: ... } } }' instead.\\")
              count_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gte: ... } } }' instead.\\")
              count_LT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lt: ... } } }' instead.\\")
              count_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lte: ... } } }' instead.\\")
              node: UserContentNodeAggregationWhereInput
            }

            input UserContentConnectFieldInput {
              connect: ContentConnectInput
              where: ContentConnectWhere
            }

            type UserContentConnection {
              aggregate: UserContentContentAggregateSelection!
              edges: [UserContentRelationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input UserContentConnectionAggregateInput {
              AND: [UserContentConnectionAggregateInput!]
              NOT: UserContentConnectionAggregateInput
              OR: [UserContentConnectionAggregateInput!]
              count: ConnectionAggregationCountFilterInput
              node: UserContentNodeAggregationWhereInput
            }

            input UserContentConnectionFilters {
              \\"\\"\\"Filter Users by aggregating results on related UserContentConnections\\"\\"\\"
              aggregate: UserContentConnectionAggregateInput
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

            type UserContentContentAggregateSelection {
              count: CountConnection!
              node: UserContentContentNodeAggregateSelection
            }

            type UserContentContentNodeAggregateSelection {
              content: StringAggregateSelection!
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
              content: StringScalarAggregationFilters
              content_AVERAGE_LENGTH_EQUAL: Float @deprecated(reason: \\"Please use the relevant generic filter 'content: { averageLength: { eq: ... } } }' instead.\\")
              content_AVERAGE_LENGTH_GT: Float @deprecated(reason: \\"Please use the relevant generic filter 'content: { averageLength: { gt: ... } } }' instead.\\")
              content_AVERAGE_LENGTH_GTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'content: { averageLength: { gte: ... } } }' instead.\\")
              content_AVERAGE_LENGTH_LT: Float @deprecated(reason: \\"Please use the relevant generic filter 'content: { averageLength: { lt: ... } } }' instead.\\")
              content_AVERAGE_LENGTH_LTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'content: { averageLength: { lte: ... } } }' instead.\\")
              content_LONGEST_LENGTH_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'content: { longestLength: { eq: ... } } }' instead.\\")
              content_LONGEST_LENGTH_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'content: { longestLength: { gt: ... } } }' instead.\\")
              content_LONGEST_LENGTH_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'content: { longestLength: { gte: ... } } }' instead.\\")
              content_LONGEST_LENGTH_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'content: { longestLength: { lt: ... } } }' instead.\\")
              content_LONGEST_LENGTH_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'content: { longestLength: { lte: ... } } }' instead.\\")
              content_SHORTEST_LENGTH_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'content: { shortestLength: { eq: ... } } }' instead.\\")
              content_SHORTEST_LENGTH_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'content: { shortestLength: { gt: ... } } }' instead.\\")
              content_SHORTEST_LENGTH_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'content: { shortestLength: { gte: ... } } }' instead.\\")
              content_SHORTEST_LENGTH_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'content: { shortestLength: { lt: ... } } }' instead.\\")
              content_SHORTEST_LENGTH_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'content: { shortestLength: { lte: ... } } }' instead.\\")
            }

            type UserContentRelationship {
              cursor: String!
              node: Content!
            }

            input UserContentUpdateConnectionInput {
              node: ContentUpdateInput
              where: UserContentConnectionWhere
            }

            input UserContentUpdateFieldInput {
              connect: [UserContentConnectFieldInput!]
              create: [UserContentCreateFieldInput!]
              delete: [UserContentDeleteFieldInput!]
              disconnect: [UserContentDisconnectFieldInput!]
              update: UserContentUpdateConnectionInput
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

            input UserRelationshipFilters {
              \\"\\"\\"Filter type where all of the related Users match this filter\\"\\"\\"
              all: UserWhere
              \\"\\"\\"Filter type where none of the related Users match this filter\\"\\"\\"
              none: UserWhere
              \\"\\"\\"Filter type where one of the related Users match this filter\\"\\"\\"
              single: UserWhere
              \\"\\"\\"Filter type where some of the related Users match this filter\\"\\"\\"
              some: UserWhere
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
              id: IDScalarMutations
              id_SET: ID @deprecated(reason: \\"Please use the generic mutation 'id: { set: ... } }' instead.\\")
              name: StringScalarMutations
              name_SET: String @deprecated(reason: \\"Please use the generic mutation 'name: { set: ... } }' instead.\\")
            }

            input UserWhere {
              AND: [UserWhere!]
              NOT: UserWhere
              OR: [UserWhere!]
              content: ContentRelationshipFilters
              contentAggregate: UserContentAggregateInput @deprecated(reason: \\"Aggregate filters are moved inside the contentConnection filter, please use { contentConnection: { aggregate: {...} } } instead\\")
              contentConnection: UserContentConnectionFilters
              \\"\\"\\"
              Return Users where all of the related UserContentConnections match this filter
              \\"\\"\\"
              contentConnection_ALL: UserContentConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'contentConnection: { all: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Users where none of the related UserContentConnections match this filter
              \\"\\"\\"
              contentConnection_NONE: UserContentConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'contentConnection: { none: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Users where one of the related UserContentConnections match this filter
              \\"\\"\\"
              contentConnection_SINGLE: UserContentConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'contentConnection: { single: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Users where some of the related UserContentConnections match this filter
              \\"\\"\\"
              contentConnection_SOME: UserContentConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'contentConnection: { some: { node: ... } } }' instead.\\")
              \\"\\"\\"Return Users where all of the related Contents match this filter\\"\\"\\"
              content_ALL: ContentWhere @deprecated(reason: \\"Please use the relevant generic filter 'content: { all: ... }' instead.\\")
              \\"\\"\\"Return Users where none of the related Contents match this filter\\"\\"\\"
              content_NONE: ContentWhere @deprecated(reason: \\"Please use the relevant generic filter 'content: { none: ... }' instead.\\")
              \\"\\"\\"Return Users where one of the related Contents match this filter\\"\\"\\"
              content_SINGLE: ContentWhere @deprecated(reason: \\"Please use the relevant generic filter 'content: {  single: ... }' instead.\\")
              \\"\\"\\"Return Users where some of the related Contents match this filter\\"\\"\\"
              content_SOME: ContentWhere @deprecated(reason: \\"Please use the relevant generic filter 'content: {  some: ... }' instead.\\")
              id: IDScalarFilters
              id_CONTAINS: ID @deprecated(reason: \\"Please use the relevant generic filter id: { contains: ... }\\")
              id_ENDS_WITH: ID @deprecated(reason: \\"Please use the relevant generic filter id: { endsWith: ... }\\")
              id_EQ: ID @deprecated(reason: \\"Please use the relevant generic filter id: { eq: ... }\\")
              id_IN: [ID] @deprecated(reason: \\"Please use the relevant generic filter id: { in: ... }\\")
              id_STARTS_WITH: ID @deprecated(reason: \\"Please use the relevant generic filter id: { startsWith: ... }\\")
              name: StringScalarFilters
              name_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter name: { contains: ... }\\")
              name_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter name: { endsWith: ... }\\")
              name_EQ: String @deprecated(reason: \\"Please use the relevant generic filter name: { eq: ... }\\")
              name_IN: [String] @deprecated(reason: \\"Please use the relevant generic filter name: { in: ... }\\")
              name_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter name: { startsWith: ... }\\")
            }

            type UsersConnection {
              aggregate: UserAggregate!
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
              screenTime: IntScalarAggregationFilters
              screenTime_AVERAGE_EQUAL: Float @deprecated(reason: \\"Please use the relevant generic filter 'screenTime: { average: { eq: ... } } }' instead.\\")
              screenTime_AVERAGE_GT: Float @deprecated(reason: \\"Please use the relevant generic filter 'screenTime: { average: { gt: ... } } }' instead.\\")
              screenTime_AVERAGE_GTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'screenTime: { average: { gte: ... } } }' instead.\\")
              screenTime_AVERAGE_LT: Float @deprecated(reason: \\"Please use the relevant generic filter 'screenTime: { average: { lt: ... } } }' instead.\\")
              screenTime_AVERAGE_LTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'screenTime: { average: { lte: ... } } }' instead.\\")
              screenTime_MAX_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'screenTime: { max: { eq: ... } } }' instead.\\")
              screenTime_MAX_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'screenTime: { max: { gt: ... } } }' instead.\\")
              screenTime_MAX_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'screenTime: { max: { gte: ... } } }' instead.\\")
              screenTime_MAX_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'screenTime: { max: { lt: ... } } }' instead.\\")
              screenTime_MAX_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'screenTime: { max: { lte: ... } } }' instead.\\")
              screenTime_MIN_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'screenTime: { min: { eq: ... } } }' instead.\\")
              screenTime_MIN_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'screenTime: { min: { gt: ... } } }' instead.\\")
              screenTime_MIN_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'screenTime: { min: { gte: ... } } }' instead.\\")
              screenTime_MIN_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'screenTime: { min: { lt: ... } } }' instead.\\")
              screenTime_MIN_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'screenTime: { min: { lte: ... } } }' instead.\\")
              screenTime_SUM_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'screenTime: { sum: { eq: ... } } }' instead.\\")
              screenTime_SUM_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'screenTime: { sum: { gt: ... } } }' instead.\\")
              screenTime_SUM_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'screenTime: { sum: { gte: ... } } }' instead.\\")
              screenTime_SUM_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'screenTime: { sum: { lt: ... } } }' instead.\\")
              screenTime_SUM_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'screenTime: { sum: { lte: ... } } }' instead.\\")
            }

            input ActedInCreateInput {
              screenTime: Int!
            }

            input ActedInSort {
              screenTime: SortDirection
            }

            input ActedInUpdateInput {
              screenTime: IntScalarMutations
              screenTime_DECREMENT: Int @deprecated(reason: \\"Please use the relevant generic mutation 'screenTime: { decrement: ... } }' instead.\\")
              screenTime_INCREMENT: Int @deprecated(reason: \\"Please use the relevant generic mutation 'screenTime: { increment: ... } }' instead.\\")
              screenTime_SET: Int @deprecated(reason: \\"Please use the generic mutation 'screenTime: { set: ... } }' instead.\\")
            }

            input ActedInWhere {
              AND: [ActedInWhere!]
              NOT: ActedInWhere
              OR: [ActedInWhere!]
              screenTime: IntScalarFilters
              screenTime_EQ: Int @deprecated(reason: \\"Please use the relevant generic filter screenTime: { eq: ... }\\")
              screenTime_GT: Int @deprecated(reason: \\"Please use the relevant generic filter screenTime: { gt: ... }\\")
              screenTime_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter screenTime: { gte: ... }\\")
              screenTime_IN: [Int!] @deprecated(reason: \\"Please use the relevant generic filter screenTime: { in: ... }\\")
              screenTime_LT: Int @deprecated(reason: \\"Please use the relevant generic filter screenTime: { lt: ... }\\")
              screenTime_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter screenTime: { lte: ... }\\")
            }

            type Actor {
              actedIn(limit: Int, offset: Int, sort: [ShowSort!], where: ShowWhere): [Show!]!
              actedInConnection(after: String, first: Int, sort: [ActorActedInConnectionSort!], where: ActorActedInConnectionWhere): ActorActedInConnection!
              name: String!
            }

            input ActorActedInAggregateInput {
              AND: [ActorActedInAggregateInput!]
              NOT: ActorActedInAggregateInput
              OR: [ActorActedInAggregateInput!]
              count: IntScalarFilters
              count_EQ: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { eq: ... } } }' instead.\\")
              count_GT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gt: ... } } }' instead.\\")
              count_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gte: ... } } }' instead.\\")
              count_LT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lt: ... } } }' instead.\\")
              count_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lte: ... } } }' instead.\\")
              edge: ActedInAggregationWhereInput
              node: ActorActedInNodeAggregationWhereInput
            }

            input ActorActedInConnectFieldInput {
              connect: ShowConnectInput
              edge: ActedInCreateInput!
              where: ShowConnectWhere
            }

            type ActorActedInConnection {
              aggregate: ActorShowActedInAggregateSelection!
              edges: [ActorActedInRelationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input ActorActedInConnectionAggregateInput {
              AND: [ActorActedInConnectionAggregateInput!]
              NOT: ActorActedInConnectionAggregateInput
              OR: [ActorActedInConnectionAggregateInput!]
              count: ConnectionAggregationCountFilterInput
              edge: ActedInAggregationWhereInput
              node: ActorActedInNodeAggregationWhereInput
            }

            input ActorActedInConnectionFilters {
              \\"\\"\\"
              Filter Actors by aggregating results on related ActorActedInConnections
              \\"\\"\\"
              aggregate: ActorActedInConnectionAggregateInput
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
              title: StringScalarAggregationFilters
              title_AVERAGE_LENGTH_EQUAL: Float @deprecated(reason: \\"Please use the relevant generic filter 'title: { averageLength: { eq: ... } } }' instead.\\")
              title_AVERAGE_LENGTH_GT: Float @deprecated(reason: \\"Please use the relevant generic filter 'title: { averageLength: { gt: ... } } }' instead.\\")
              title_AVERAGE_LENGTH_GTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'title: { averageLength: { gte: ... } } }' instead.\\")
              title_AVERAGE_LENGTH_LT: Float @deprecated(reason: \\"Please use the relevant generic filter 'title: { averageLength: { lt: ... } } }' instead.\\")
              title_AVERAGE_LENGTH_LTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'title: { averageLength: { lte: ... } } }' instead.\\")
              title_LONGEST_LENGTH_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { longestLength: { eq: ... } } }' instead.\\")
              title_LONGEST_LENGTH_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { longestLength: { gt: ... } } }' instead.\\")
              title_LONGEST_LENGTH_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { longestLength: { gte: ... } } }' instead.\\")
              title_LONGEST_LENGTH_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { longestLength: { lt: ... } } }' instead.\\")
              title_LONGEST_LENGTH_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { longestLength: { lte: ... } } }' instead.\\")
              title_SHORTEST_LENGTH_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { shortestLength: { eq: ... } } }' instead.\\")
              title_SHORTEST_LENGTH_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { shortestLength: { gt: ... } } }' instead.\\")
              title_SHORTEST_LENGTH_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { shortestLength: { gte: ... } } }' instead.\\")
              title_SHORTEST_LENGTH_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { shortestLength: { lt: ... } } }' instead.\\")
              title_SHORTEST_LENGTH_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { shortestLength: { lte: ... } } }' instead.\\")
            }

            type ActorActedInRelationship {
              cursor: String!
              node: Show!
              properties: ActedIn!
            }

            input ActorActedInUpdateConnectionInput {
              edge: ActedInUpdateInput
              node: ShowUpdateInput
              where: ActorActedInConnectionWhere
            }

            input ActorActedInUpdateFieldInput {
              connect: [ActorActedInConnectFieldInput!]
              create: [ActorActedInCreateFieldInput!]
              delete: [ActorActedInDeleteFieldInput!]
              disconnect: [ActorActedInDisconnectFieldInput!]
              update: ActorActedInUpdateConnectionInput
            }

            type ActorAggregate {
              count: Count!
              node: ActorAggregateNode!
            }

            type ActorAggregateNode {
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

            input ActorRelationshipFilters {
              \\"\\"\\"Filter type where all of the related Actors match this filter\\"\\"\\"
              all: ActorWhere
              \\"\\"\\"Filter type where none of the related Actors match this filter\\"\\"\\"
              none: ActorWhere
              \\"\\"\\"Filter type where one of the related Actors match this filter\\"\\"\\"
              single: ActorWhere
              \\"\\"\\"Filter type where some of the related Actors match this filter\\"\\"\\"
              some: ActorWhere
            }

            type ActorShowActedInAggregateSelection {
              count: CountConnection!
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
              name: StringScalarMutations
              name_SET: String @deprecated(reason: \\"Please use the generic mutation 'name: { set: ... } }' instead.\\")
            }

            input ActorWhere {
              AND: [ActorWhere!]
              NOT: ActorWhere
              OR: [ActorWhere!]
              actedIn: ShowRelationshipFilters
              actedInAggregate: ActorActedInAggregateInput @deprecated(reason: \\"Aggregate filters are moved inside the actedInConnection filter, please use { actedInConnection: { aggregate: {...} } } instead\\")
              actedInConnection: ActorActedInConnectionFilters
              \\"\\"\\"
              Return Actors where all of the related ActorActedInConnections match this filter
              \\"\\"\\"
              actedInConnection_ALL: ActorActedInConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actedInConnection: { all: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Actors where none of the related ActorActedInConnections match this filter
              \\"\\"\\"
              actedInConnection_NONE: ActorActedInConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actedInConnection: { none: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Actors where one of the related ActorActedInConnections match this filter
              \\"\\"\\"
              actedInConnection_SINGLE: ActorActedInConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actedInConnection: { single: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Actors where some of the related ActorActedInConnections match this filter
              \\"\\"\\"
              actedInConnection_SOME: ActorActedInConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actedInConnection: { some: { node: ... } } }' instead.\\")
              \\"\\"\\"Return Actors where all of the related Shows match this filter\\"\\"\\"
              actedIn_ALL: ShowWhere @deprecated(reason: \\"Please use the relevant generic filter 'actedIn: { all: ... }' instead.\\")
              \\"\\"\\"Return Actors where none of the related Shows match this filter\\"\\"\\"
              actedIn_NONE: ShowWhere @deprecated(reason: \\"Please use the relevant generic filter 'actedIn: { none: ... }' instead.\\")
              \\"\\"\\"Return Actors where one of the related Shows match this filter\\"\\"\\"
              actedIn_SINGLE: ShowWhere @deprecated(reason: \\"Please use the relevant generic filter 'actedIn: {  single: ... }' instead.\\")
              \\"\\"\\"Return Actors where some of the related Shows match this filter\\"\\"\\"
              actedIn_SOME: ShowWhere @deprecated(reason: \\"Please use the relevant generic filter 'actedIn: {  some: ... }' instead.\\")
              name: StringScalarFilters
              name_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter name: { contains: ... }\\")
              name_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter name: { endsWith: ... }\\")
              name_EQ: String @deprecated(reason: \\"Please use the relevant generic filter name: { eq: ... }\\")
              name_IN: [String!] @deprecated(reason: \\"Please use the relevant generic filter name: { in: ... }\\")
              name_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter name: { startsWith: ... }\\")
            }

            type ActorsConnection {
              aggregate: ActorAggregate!
              edges: [ActorEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input ConnectionAggregationCountFilterInput {
              edges: IntScalarFilters
              nodes: IntScalarFilters
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

            \\"\\"\\"Float filters\\"\\"\\"
            input FloatScalarFilters {
              eq: Float
              gt: Float
              gte: Float
              in: [Float!]
              lt: Float
              lte: Float
            }

            type IntAggregateSelection {
              average: Float
              max: Int
              min: Int
              sum: Int
            }

            \\"\\"\\"Filters for an aggregation of an int field\\"\\"\\"
            input IntScalarAggregationFilters {
              average: FloatScalarFilters
              max: IntScalarFilters
              min: IntScalarFilters
              sum: IntScalarFilters
            }

            \\"\\"\\"Int filters\\"\\"\\"
            input IntScalarFilters {
              eq: Int
              gt: Int
              gte: Int
              in: [Int!]
              lt: Int
              lte: Int
            }

            \\"\\"\\"Int mutations\\"\\"\\"
            input IntScalarMutations {
              add: Int
              set: Int
              subtract: Int
            }

            type Movie implements Production & Show {
              actors(limit: Int, offset: Int, sort: [ActorSort!], where: ActorWhere): [Actor!]!
              actorsConnection(after: String, first: Int, sort: [ShowActorsConnectionSort!], where: ShowActorsConnectionWhere): ShowActorsConnection!
              runtime: Int!
              title: String!
            }

            input MovieActorsAggregateInput {
              AND: [MovieActorsAggregateInput!]
              NOT: MovieActorsAggregateInput
              OR: [MovieActorsAggregateInput!]
              count: IntScalarFilters
              count_EQ: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { eq: ... } } }' instead.\\")
              count_GT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gt: ... } } }' instead.\\")
              count_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gte: ... } } }' instead.\\")
              count_LT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lt: ... } } }' instead.\\")
              count_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lte: ... } } }' instead.\\")
              edge: ActedInAggregationWhereInput
              node: MovieActorsNodeAggregationWhereInput
            }

            input MovieActorsConnectFieldInput {
              connect: [ActorConnectInput!]
              edge: ActedInCreateInput!
              where: ActorConnectWhere
            }

            input MovieActorsConnectionAggregateInput {
              AND: [MovieActorsConnectionAggregateInput!]
              NOT: MovieActorsConnectionAggregateInput
              OR: [MovieActorsConnectionAggregateInput!]
              count: ConnectionAggregationCountFilterInput
              edge: ActedInAggregationWhereInput
              node: MovieActorsNodeAggregationWhereInput
            }

            input MovieActorsConnectionFilters {
              \\"\\"\\"Filter Movies by aggregating results on related ShowActorsConnections\\"\\"\\"
              aggregate: MovieActorsConnectionAggregateInput
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
              name: StringScalarAggregationFilters
              name_AVERAGE_LENGTH_EQUAL: Float @deprecated(reason: \\"Please use the relevant generic filter 'name: { averageLength: { eq: ... } } }' instead.\\")
              name_AVERAGE_LENGTH_GT: Float @deprecated(reason: \\"Please use the relevant generic filter 'name: { averageLength: { gt: ... } } }' instead.\\")
              name_AVERAGE_LENGTH_GTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'name: { averageLength: { gte: ... } } }' instead.\\")
              name_AVERAGE_LENGTH_LT: Float @deprecated(reason: \\"Please use the relevant generic filter 'name: { averageLength: { lt: ... } } }' instead.\\")
              name_AVERAGE_LENGTH_LTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'name: { averageLength: { lte: ... } } }' instead.\\")
              name_LONGEST_LENGTH_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'name: { longestLength: { eq: ... } } }' instead.\\")
              name_LONGEST_LENGTH_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'name: { longestLength: { gt: ... } } }' instead.\\")
              name_LONGEST_LENGTH_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'name: { longestLength: { gte: ... } } }' instead.\\")
              name_LONGEST_LENGTH_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'name: { longestLength: { lt: ... } } }' instead.\\")
              name_LONGEST_LENGTH_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'name: { longestLength: { lte: ... } } }' instead.\\")
              name_SHORTEST_LENGTH_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'name: { shortestLength: { eq: ... } } }' instead.\\")
              name_SHORTEST_LENGTH_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'name: { shortestLength: { gt: ... } } }' instead.\\")
              name_SHORTEST_LENGTH_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'name: { shortestLength: { gte: ... } } }' instead.\\")
              name_SHORTEST_LENGTH_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'name: { shortestLength: { lt: ... } } }' instead.\\")
              name_SHORTEST_LENGTH_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'name: { shortestLength: { lte: ... } } }' instead.\\")
            }

            input MovieActorsUpdateConnectionInput {
              edge: ActedInUpdateInput
              node: ActorUpdateInput
              where: ShowActorsConnectionWhere
            }

            input MovieActorsUpdateFieldInput {
              connect: [MovieActorsConnectFieldInput!]
              create: [MovieActorsCreateFieldInput!]
              delete: [ShowActorsDeleteFieldInput!]
              disconnect: [ShowActorsDisconnectFieldInput!]
              update: MovieActorsUpdateConnectionInput
            }

            type MovieAggregate {
              count: Count!
              node: MovieAggregateNode!
            }

            type MovieAggregateNode {
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
              runtime: IntScalarMutations
              runtime_DECREMENT: Int @deprecated(reason: \\"Please use the relevant generic mutation 'runtime: { decrement: ... } }' instead.\\")
              runtime_INCREMENT: Int @deprecated(reason: \\"Please use the relevant generic mutation 'runtime: { increment: ... } }' instead.\\")
              runtime_SET: Int @deprecated(reason: \\"Please use the generic mutation 'runtime: { set: ... } }' instead.\\")
              title: StringScalarMutations
              title_SET: String @deprecated(reason: \\"Please use the generic mutation 'title: { set: ... } }' instead.\\")
            }

            input MovieWhere {
              AND: [MovieWhere!]
              NOT: MovieWhere
              OR: [MovieWhere!]
              actors: ActorRelationshipFilters
              actorsAggregate: MovieActorsAggregateInput @deprecated(reason: \\"Aggregate filters are moved inside the actorsConnection filter, please use { actorsConnection: { aggregate: {...} } } instead\\")
              actorsConnection: MovieActorsConnectionFilters
              \\"\\"\\"
              Return Movies where all of the related ShowActorsConnections match this filter
              \\"\\"\\"
              actorsConnection_ALL: ShowActorsConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actorsConnection: { all: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Movies where none of the related ShowActorsConnections match this filter
              \\"\\"\\"
              actorsConnection_NONE: ShowActorsConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actorsConnection: { none: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Movies where one of the related ShowActorsConnections match this filter
              \\"\\"\\"
              actorsConnection_SINGLE: ShowActorsConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actorsConnection: { single: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Movies where some of the related ShowActorsConnections match this filter
              \\"\\"\\"
              actorsConnection_SOME: ShowActorsConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actorsConnection: { some: { node: ... } } }' instead.\\")
              \\"\\"\\"Return Movies where all of the related Actors match this filter\\"\\"\\"
              actors_ALL: ActorWhere @deprecated(reason: \\"Please use the relevant generic filter 'actors: { all: ... }' instead.\\")
              \\"\\"\\"Return Movies where none of the related Actors match this filter\\"\\"\\"
              actors_NONE: ActorWhere @deprecated(reason: \\"Please use the relevant generic filter 'actors: { none: ... }' instead.\\")
              \\"\\"\\"Return Movies where one of the related Actors match this filter\\"\\"\\"
              actors_SINGLE: ActorWhere @deprecated(reason: \\"Please use the relevant generic filter 'actors: {  single: ... }' instead.\\")
              \\"\\"\\"Return Movies where some of the related Actors match this filter\\"\\"\\"
              actors_SOME: ActorWhere @deprecated(reason: \\"Please use the relevant generic filter 'actors: {  some: ... }' instead.\\")
              runtime: IntScalarFilters
              runtime_EQ: Int @deprecated(reason: \\"Please use the relevant generic filter runtime: { eq: ... }\\")
              runtime_GT: Int @deprecated(reason: \\"Please use the relevant generic filter runtime: { gt: ... }\\")
              runtime_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter runtime: { gte: ... }\\")
              runtime_IN: [Int!] @deprecated(reason: \\"Please use the relevant generic filter runtime: { in: ... }\\")
              runtime_LT: Int @deprecated(reason: \\"Please use the relevant generic filter runtime: { lt: ... }\\")
              runtime_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter runtime: { lte: ... }\\")
              title: StringScalarFilters
              title_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter title: { contains: ... }\\")
              title_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter title: { endsWith: ... }\\")
              title_EQ: String @deprecated(reason: \\"Please use the relevant generic filter title: { eq: ... }\\")
              title_IN: [String!] @deprecated(reason: \\"Please use the relevant generic filter title: { in: ... }\\")
              title_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter title: { startsWith: ... }\\")
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

            type ProductionAggregate {
              count: Count!
              node: ProductionAggregateNode!
            }

            type ProductionAggregateNode {
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
              title_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter title: { contains: ... }\\")
              title_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter title: { endsWith: ... }\\")
              title_EQ: String @deprecated(reason: \\"Please use the relevant generic filter title: { eq: ... }\\")
              title_IN: [String!] @deprecated(reason: \\"Please use the relevant generic filter title: { in: ... }\\")
              title_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter title: { startsWith: ... }\\")
              typename: [ProductionImplementation!]
            }

            type ProductionsConnection {
              aggregate: ProductionAggregate!
              edges: [ProductionEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            type Query {
              actors(limit: Int, offset: Int, sort: [ActorSort!], where: ActorWhere): [Actor!]!
              actorsConnection(after: String, first: Int, sort: [ActorSort!], where: ActorWhere): ActorsConnection!
              movies(limit: Int, offset: Int, sort: [MovieSort!], where: MovieWhere): [Movie!]!
              moviesConnection(after: String, first: Int, sort: [MovieSort!], where: MovieWhere): MoviesConnection!
              productions(limit: Int, offset: Int, sort: [ProductionSort!], where: ProductionWhere): [Production!]!
              productionsConnection(after: String, first: Int, sort: [ProductionSort!], where: ProductionWhere): ProductionsConnection!
              series(limit: Int, offset: Int, sort: [SeriesSort!], where: SeriesWhere): [Series!]!
              seriesConnection(after: String, first: Int, sort: [SeriesSort!], where: SeriesWhere): SeriesConnection!
              shows(limit: Int, offset: Int, sort: [ShowSort!], where: ShowWhere): [Show!]!
              showsConnection(after: String, first: Int, sort: [ShowSort!], where: ShowWhere): ShowsConnection!
            }

            type Series implements Production & Show {
              actors(limit: Int, offset: Int, sort: [ActorSort!], where: ActorWhere): [Actor!]!
              actorsConnection(after: String, first: Int, sort: [ShowActorsConnectionSort!], where: ShowActorsConnectionWhere): ShowActorsConnection!
              episodeCount: Int!
              title: String!
            }

            input SeriesActorsAggregateInput {
              AND: [SeriesActorsAggregateInput!]
              NOT: SeriesActorsAggregateInput
              OR: [SeriesActorsAggregateInput!]
              count: IntScalarFilters
              count_EQ: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { eq: ... } } }' instead.\\")
              count_GT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gt: ... } } }' instead.\\")
              count_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gte: ... } } }' instead.\\")
              count_LT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lt: ... } } }' instead.\\")
              count_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lte: ... } } }' instead.\\")
              edge: StarredInAggregationWhereInput
              node: SeriesActorsNodeAggregationWhereInput
            }

            input SeriesActorsConnectFieldInput {
              connect: [ActorConnectInput!]
              edge: StarredInCreateInput!
              where: ActorConnectWhere
            }

            input SeriesActorsConnectionAggregateInput {
              AND: [SeriesActorsConnectionAggregateInput!]
              NOT: SeriesActorsConnectionAggregateInput
              OR: [SeriesActorsConnectionAggregateInput!]
              count: ConnectionAggregationCountFilterInput
              edge: StarredInAggregationWhereInput
              node: SeriesActorsNodeAggregationWhereInput
            }

            input SeriesActorsConnectionFilters {
              \\"\\"\\"Filter Series by aggregating results on related ShowActorsConnections\\"\\"\\"
              aggregate: SeriesActorsConnectionAggregateInput
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
              name: StringScalarAggregationFilters
              name_AVERAGE_LENGTH_EQUAL: Float @deprecated(reason: \\"Please use the relevant generic filter 'name: { averageLength: { eq: ... } } }' instead.\\")
              name_AVERAGE_LENGTH_GT: Float @deprecated(reason: \\"Please use the relevant generic filter 'name: { averageLength: { gt: ... } } }' instead.\\")
              name_AVERAGE_LENGTH_GTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'name: { averageLength: { gte: ... } } }' instead.\\")
              name_AVERAGE_LENGTH_LT: Float @deprecated(reason: \\"Please use the relevant generic filter 'name: { averageLength: { lt: ... } } }' instead.\\")
              name_AVERAGE_LENGTH_LTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'name: { averageLength: { lte: ... } } }' instead.\\")
              name_LONGEST_LENGTH_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'name: { longestLength: { eq: ... } } }' instead.\\")
              name_LONGEST_LENGTH_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'name: { longestLength: { gt: ... } } }' instead.\\")
              name_LONGEST_LENGTH_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'name: { longestLength: { gte: ... } } }' instead.\\")
              name_LONGEST_LENGTH_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'name: { longestLength: { lt: ... } } }' instead.\\")
              name_LONGEST_LENGTH_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'name: { longestLength: { lte: ... } } }' instead.\\")
              name_SHORTEST_LENGTH_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'name: { shortestLength: { eq: ... } } }' instead.\\")
              name_SHORTEST_LENGTH_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'name: { shortestLength: { gt: ... } } }' instead.\\")
              name_SHORTEST_LENGTH_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'name: { shortestLength: { gte: ... } } }' instead.\\")
              name_SHORTEST_LENGTH_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'name: { shortestLength: { lt: ... } } }' instead.\\")
              name_SHORTEST_LENGTH_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'name: { shortestLength: { lte: ... } } }' instead.\\")
            }

            input SeriesActorsUpdateConnectionInput {
              edge: StarredInUpdateInput
              node: ActorUpdateInput
              where: ShowActorsConnectionWhere
            }

            input SeriesActorsUpdateFieldInput {
              connect: [SeriesActorsConnectFieldInput!]
              create: [SeriesActorsCreateFieldInput!]
              delete: [ShowActorsDeleteFieldInput!]
              disconnect: [ShowActorsDisconnectFieldInput!]
              update: SeriesActorsUpdateConnectionInput
            }

            type SeriesAggregate {
              count: Count!
              node: SeriesAggregateNode!
            }

            type SeriesAggregateNode {
              episodeCount: IntAggregateSelection!
              title: StringAggregateSelection!
            }

            type SeriesConnection {
              aggregate: SeriesAggregate!
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
              episodeCount: IntScalarMutations
              episodeCount_DECREMENT: Int @deprecated(reason: \\"Please use the relevant generic mutation 'episodeCount: { decrement: ... } }' instead.\\")
              episodeCount_INCREMENT: Int @deprecated(reason: \\"Please use the relevant generic mutation 'episodeCount: { increment: ... } }' instead.\\")
              episodeCount_SET: Int @deprecated(reason: \\"Please use the generic mutation 'episodeCount: { set: ... } }' instead.\\")
              title: StringScalarMutations
              title_SET: String @deprecated(reason: \\"Please use the generic mutation 'title: { set: ... } }' instead.\\")
            }

            input SeriesWhere {
              AND: [SeriesWhere!]
              NOT: SeriesWhere
              OR: [SeriesWhere!]
              actors: ActorRelationshipFilters
              actorsAggregate: SeriesActorsAggregateInput @deprecated(reason: \\"Aggregate filters are moved inside the actorsConnection filter, please use { actorsConnection: { aggregate: {...} } } instead\\")
              actorsConnection: SeriesActorsConnectionFilters
              \\"\\"\\"
              Return Series where all of the related ShowActorsConnections match this filter
              \\"\\"\\"
              actorsConnection_ALL: ShowActorsConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actorsConnection: { all: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Series where none of the related ShowActorsConnections match this filter
              \\"\\"\\"
              actorsConnection_NONE: ShowActorsConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actorsConnection: { none: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Series where one of the related ShowActorsConnections match this filter
              \\"\\"\\"
              actorsConnection_SINGLE: ShowActorsConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actorsConnection: { single: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Series where some of the related ShowActorsConnections match this filter
              \\"\\"\\"
              actorsConnection_SOME: ShowActorsConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actorsConnection: { some: { node: ... } } }' instead.\\")
              \\"\\"\\"Return Series where all of the related Actors match this filter\\"\\"\\"
              actors_ALL: ActorWhere @deprecated(reason: \\"Please use the relevant generic filter 'actors: { all: ... }' instead.\\")
              \\"\\"\\"Return Series where none of the related Actors match this filter\\"\\"\\"
              actors_NONE: ActorWhere @deprecated(reason: \\"Please use the relevant generic filter 'actors: { none: ... }' instead.\\")
              \\"\\"\\"Return Series where one of the related Actors match this filter\\"\\"\\"
              actors_SINGLE: ActorWhere @deprecated(reason: \\"Please use the relevant generic filter 'actors: {  single: ... }' instead.\\")
              \\"\\"\\"Return Series where some of the related Actors match this filter\\"\\"\\"
              actors_SOME: ActorWhere @deprecated(reason: \\"Please use the relevant generic filter 'actors: {  some: ... }' instead.\\")
              episodeCount: IntScalarFilters
              episodeCount_EQ: Int @deprecated(reason: \\"Please use the relevant generic filter episodeCount: { eq: ... }\\")
              episodeCount_GT: Int @deprecated(reason: \\"Please use the relevant generic filter episodeCount: { gt: ... }\\")
              episodeCount_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter episodeCount: { gte: ... }\\")
              episodeCount_IN: [Int!] @deprecated(reason: \\"Please use the relevant generic filter episodeCount: { in: ... }\\")
              episodeCount_LT: Int @deprecated(reason: \\"Please use the relevant generic filter episodeCount: { lt: ... }\\")
              episodeCount_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter episodeCount: { lte: ... }\\")
              title: StringScalarFilters
              title_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter title: { contains: ... }\\")
              title_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter title: { endsWith: ... }\\")
              title_EQ: String @deprecated(reason: \\"Please use the relevant generic filter title: { eq: ... }\\")
              title_IN: [String!] @deprecated(reason: \\"Please use the relevant generic filter title: { in: ... }\\")
              title_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter title: { startsWith: ... }\\")
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
              count: IntScalarFilters
              count_EQ: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { eq: ... } } }' instead.\\")
              count_GT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gt: ... } } }' instead.\\")
              count_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gte: ... } } }' instead.\\")
              count_LT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lt: ... } } }' instead.\\")
              count_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lte: ... } } }' instead.\\")
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

            input ShowActorsConnectionAggregateInput {
              AND: [ShowActorsConnectionAggregateInput!]
              NOT: ShowActorsConnectionAggregateInput
              OR: [ShowActorsConnectionAggregateInput!]
              count: ConnectionAggregationCountFilterInput
              edge: ShowActorsEdgeAggregationWhereInput
              node: ShowActorsNodeAggregationWhereInput
            }

            input ShowActorsConnectionFilters {
              \\"\\"\\"Filter Shows by aggregating results on related ShowActorsConnections\\"\\"\\"
              aggregate: ShowActorsConnectionAggregateInput
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
              name: StringScalarAggregationFilters
              name_AVERAGE_LENGTH_EQUAL: Float @deprecated(reason: \\"Please use the relevant generic filter 'name: { averageLength: { eq: ... } } }' instead.\\")
              name_AVERAGE_LENGTH_GT: Float @deprecated(reason: \\"Please use the relevant generic filter 'name: { averageLength: { gt: ... } } }' instead.\\")
              name_AVERAGE_LENGTH_GTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'name: { averageLength: { gte: ... } } }' instead.\\")
              name_AVERAGE_LENGTH_LT: Float @deprecated(reason: \\"Please use the relevant generic filter 'name: { averageLength: { lt: ... } } }' instead.\\")
              name_AVERAGE_LENGTH_LTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'name: { averageLength: { lte: ... } } }' instead.\\")
              name_LONGEST_LENGTH_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'name: { longestLength: { eq: ... } } }' instead.\\")
              name_LONGEST_LENGTH_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'name: { longestLength: { gt: ... } } }' instead.\\")
              name_LONGEST_LENGTH_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'name: { longestLength: { gte: ... } } }' instead.\\")
              name_LONGEST_LENGTH_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'name: { longestLength: { lt: ... } } }' instead.\\")
              name_LONGEST_LENGTH_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'name: { longestLength: { lte: ... } } }' instead.\\")
              name_SHORTEST_LENGTH_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'name: { shortestLength: { eq: ... } } }' instead.\\")
              name_SHORTEST_LENGTH_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'name: { shortestLength: { gt: ... } } }' instead.\\")
              name_SHORTEST_LENGTH_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'name: { shortestLength: { gte: ... } } }' instead.\\")
              name_SHORTEST_LENGTH_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'name: { shortestLength: { lt: ... } } }' instead.\\")
              name_SHORTEST_LENGTH_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'name: { shortestLength: { lte: ... } } }' instead.\\")
            }

            type ShowActorsRelationship {
              cursor: String!
              node: Actor!
              properties: ShowActorsRelationshipProperties!
            }

            union ShowActorsRelationshipProperties = ActedIn | StarredIn

            input ShowActorsUpdateConnectionInput {
              edge: ShowActorsEdgeUpdateInput
              node: ActorUpdateInput
              where: ShowActorsConnectionWhere
            }

            input ShowActorsUpdateFieldInput {
              connect: [ShowActorsConnectFieldInput!]
              create: [ShowActorsCreateFieldInput!]
              delete: [ShowActorsDeleteFieldInput!]
              disconnect: [ShowActorsDisconnectFieldInput!]
              update: ShowActorsUpdateConnectionInput
            }

            type ShowAggregate {
              count: Count!
              node: ShowAggregateNode!
            }

            type ShowAggregateNode {
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

            input ShowRelationshipFilters {
              \\"\\"\\"Filter type where all of the related Shows match this filter\\"\\"\\"
              all: ShowWhere
              \\"\\"\\"Filter type where none of the related Shows match this filter\\"\\"\\"
              none: ShowWhere
              \\"\\"\\"Filter type where one of the related Shows match this filter\\"\\"\\"
              single: ShowWhere
              \\"\\"\\"Filter type where some of the related Shows match this filter\\"\\"\\"
              some: ShowWhere
            }

            \\"\\"\\"
            Fields to sort Shows by. The order in which sorts are applied is not guaranteed when specifying many fields in one ShowSort object.
            \\"\\"\\"
            input ShowSort {
              title: SortDirection
            }

            input ShowUpdateInput {
              actors: [ShowActorsUpdateFieldInput!]
              title: StringScalarMutations
              title_SET: String @deprecated(reason: \\"Please use the generic mutation 'title: { set: ... } }' instead.\\")
            }

            input ShowWhere {
              AND: [ShowWhere!]
              NOT: ShowWhere
              OR: [ShowWhere!]
              actors: ActorRelationshipFilters
              actorsAggregate: ShowActorsAggregateInput @deprecated(reason: \\"Aggregate filters are moved inside the actorsConnection filter, please use { actorsConnection: { aggregate: {...} } } instead\\")
              actorsConnection: ShowActorsConnectionFilters
              \\"\\"\\"
              Return Shows where all of the related ShowActorsConnections match this filter
              \\"\\"\\"
              actorsConnection_ALL: ShowActorsConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actorsConnection: { all: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Shows where none of the related ShowActorsConnections match this filter
              \\"\\"\\"
              actorsConnection_NONE: ShowActorsConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actorsConnection: { none: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Shows where one of the related ShowActorsConnections match this filter
              \\"\\"\\"
              actorsConnection_SINGLE: ShowActorsConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actorsConnection: { single: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Shows where some of the related ShowActorsConnections match this filter
              \\"\\"\\"
              actorsConnection_SOME: ShowActorsConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actorsConnection: { some: { node: ... } } }' instead.\\")
              \\"\\"\\"Return Shows where all of the related Actors match this filter\\"\\"\\"
              actors_ALL: ActorWhere @deprecated(reason: \\"Please use the relevant generic filter 'actors: { all: ... }' instead.\\")
              \\"\\"\\"Return Shows where none of the related Actors match this filter\\"\\"\\"
              actors_NONE: ActorWhere @deprecated(reason: \\"Please use the relevant generic filter 'actors: { none: ... }' instead.\\")
              \\"\\"\\"Return Shows where one of the related Actors match this filter\\"\\"\\"
              actors_SINGLE: ActorWhere @deprecated(reason: \\"Please use the relevant generic filter 'actors: {  single: ... }' instead.\\")
              \\"\\"\\"Return Shows where some of the related Actors match this filter\\"\\"\\"
              actors_SOME: ActorWhere @deprecated(reason: \\"Please use the relevant generic filter 'actors: {  some: ... }' instead.\\")
              title: StringScalarFilters
              title_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter title: { contains: ... }\\")
              title_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter title: { endsWith: ... }\\")
              title_EQ: String @deprecated(reason: \\"Please use the relevant generic filter title: { eq: ... }\\")
              title_IN: [String!] @deprecated(reason: \\"Please use the relevant generic filter title: { in: ... }\\")
              title_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter title: { startsWith: ... }\\")
              typename: [ShowImplementation!]
            }

            type ShowsConnection {
              aggregate: ShowAggregate!
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
              episodeNr: IntScalarAggregationFilters
              episodeNr_AVERAGE_EQUAL: Float @deprecated(reason: \\"Please use the relevant generic filter 'episodeNr: { average: { eq: ... } } }' instead.\\")
              episodeNr_AVERAGE_GT: Float @deprecated(reason: \\"Please use the relevant generic filter 'episodeNr: { average: { gt: ... } } }' instead.\\")
              episodeNr_AVERAGE_GTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'episodeNr: { average: { gte: ... } } }' instead.\\")
              episodeNr_AVERAGE_LT: Float @deprecated(reason: \\"Please use the relevant generic filter 'episodeNr: { average: { lt: ... } } }' instead.\\")
              episodeNr_AVERAGE_LTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'episodeNr: { average: { lte: ... } } }' instead.\\")
              episodeNr_MAX_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'episodeNr: { max: { eq: ... } } }' instead.\\")
              episodeNr_MAX_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'episodeNr: { max: { gt: ... } } }' instead.\\")
              episodeNr_MAX_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'episodeNr: { max: { gte: ... } } }' instead.\\")
              episodeNr_MAX_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'episodeNr: { max: { lt: ... } } }' instead.\\")
              episodeNr_MAX_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'episodeNr: { max: { lte: ... } } }' instead.\\")
              episodeNr_MIN_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'episodeNr: { min: { eq: ... } } }' instead.\\")
              episodeNr_MIN_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'episodeNr: { min: { gt: ... } } }' instead.\\")
              episodeNr_MIN_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'episodeNr: { min: { gte: ... } } }' instead.\\")
              episodeNr_MIN_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'episodeNr: { min: { lt: ... } } }' instead.\\")
              episodeNr_MIN_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'episodeNr: { min: { lte: ... } } }' instead.\\")
              episodeNr_SUM_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'episodeNr: { sum: { eq: ... } } }' instead.\\")
              episodeNr_SUM_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'episodeNr: { sum: { gt: ... } } }' instead.\\")
              episodeNr_SUM_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'episodeNr: { sum: { gte: ... } } }' instead.\\")
              episodeNr_SUM_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'episodeNr: { sum: { lt: ... } } }' instead.\\")
              episodeNr_SUM_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'episodeNr: { sum: { lte: ... } } }' instead.\\")
            }

            input StarredInCreateInput {
              episodeNr: Int!
            }

            input StarredInSort {
              episodeNr: SortDirection
            }

            input StarredInUpdateInput {
              episodeNr: IntScalarMutations
              episodeNr_DECREMENT: Int @deprecated(reason: \\"Please use the relevant generic mutation 'episodeNr: { decrement: ... } }' instead.\\")
              episodeNr_INCREMENT: Int @deprecated(reason: \\"Please use the relevant generic mutation 'episodeNr: { increment: ... } }' instead.\\")
              episodeNr_SET: Int @deprecated(reason: \\"Please use the generic mutation 'episodeNr: { set: ... } }' instead.\\")
            }

            input StarredInWhere {
              AND: [StarredInWhere!]
              NOT: StarredInWhere
              OR: [StarredInWhere!]
              episodeNr: IntScalarFilters
              episodeNr_EQ: Int @deprecated(reason: \\"Please use the relevant generic filter episodeNr: { eq: ... }\\")
              episodeNr_GT: Int @deprecated(reason: \\"Please use the relevant generic filter episodeNr: { gt: ... }\\")
              episodeNr_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter episodeNr: { gte: ... }\\")
              episodeNr_IN: [Int!] @deprecated(reason: \\"Please use the relevant generic filter episodeNr: { in: ... }\\")
              episodeNr_LT: Int @deprecated(reason: \\"Please use the relevant generic filter episodeNr: { lt: ... }\\")
              episodeNr_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter episodeNr: { lte: ... }\\")
            }

            type StringAggregateSelection {
              longest: String
              shortest: String
            }

            \\"\\"\\"Filters for an aggregation of a string field\\"\\"\\"
            input StringScalarAggregationFilters {
              averageLength: FloatScalarFilters
              longestLength: IntScalarFilters
              shortestLength: IntScalarFilters
            }

            \\"\\"\\"String filters\\"\\"\\"
            input StringScalarFilters {
              contains: String
              endsWith: String
              eq: String
              in: [String!]
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
