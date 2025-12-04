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

describe("https://github.com/neo4j/graphql/issues/4615", () => {
    test("Aggregations should be nullable", async () => {
        const typeDefs = gql`
            interface Show {
                title: String!
                actors: [Actor!]! @declareRelationship
            }

            type Movie implements Show @node {
                title: String!
                runtime: Int
                release: DateTime!
                actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN, properties: "ActedIn")
            }

            type Series implements Show @node {
                title: String!
                episodes: Int
                actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN, properties: "ActedIn")
            }

            type Actor @node {
                name: String!
                actedIn: [Show!]! @relationship(type: "ACTED_IN", direction: OUT, properties: "ActedIn")
            }

            type ActedIn @relationshipProperties {
                screenTime: Int
            }
        `;
        const neoSchema = new Neo4jGraphQL({
            typeDefs,
        });
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
              screenTime: Int
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
              screenTime: Int
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
              screenTime_IN: [Int] @deprecated(reason: \\"Please use the relevant generic filter screenTime: { in: ... }\\")
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
              edge: ActedInCreateInput
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
              edge: ActedInCreateInput
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

            \\"\\"\\"A date and time, represented as an ISO-8601 string\\"\\"\\"
            scalar DateTime

            type DateTimeAggregateSelection {
              max: DateTime
              min: DateTime
            }

            \\"\\"\\"DateTime filters\\"\\"\\"
            input DateTimeScalarFilters {
              eq: DateTime
              gt: DateTime
              gte: DateTime
              in: [DateTime!]
              lt: DateTime
              lte: DateTime
            }

            \\"\\"\\"DateTime mutations\\"\\"\\"
            input DateTimeScalarMutations {
              set: DateTime
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

            type Movie implements Show {
              actors(limit: Int, offset: Int, sort: [ActorSort!], where: ActorWhere): [Actor!]!
              actorsConnection(after: String, first: Int, sort: [ShowActorsConnectionSort!], where: ShowActorsConnectionWhere): ShowActorsConnection!
              release: DateTime!
              runtime: Int
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
              edge: ActedInCreateInput
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
              edge: ActedInCreateInput
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
              release: DateTimeAggregateSelection!
              runtime: IntAggregateSelection!
              title: StringAggregateSelection!
            }

            input MovieCreateInput {
              actors: MovieActorsFieldInput
              release: DateTime!
              runtime: Int
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
              release: SortDirection
              runtime: SortDirection
              title: SortDirection
            }

            input MovieUpdateInput {
              actors: [MovieActorsUpdateFieldInput!]
              release: DateTimeScalarMutations
              release_SET: DateTime @deprecated(reason: \\"Please use the generic mutation 'release: { set: ... } }' instead.\\")
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
              release: DateTimeScalarFilters
              release_EQ: DateTime @deprecated(reason: \\"Please use the relevant generic filter release: { eq: ... }\\")
              release_GT: DateTime @deprecated(reason: \\"Please use the relevant generic filter release: { gt: ... }\\")
              release_GTE: DateTime @deprecated(reason: \\"Please use the relevant generic filter release: { gte: ... }\\")
              release_IN: [DateTime!] @deprecated(reason: \\"Please use the relevant generic filter release: { in: ... }\\")
              release_LT: DateTime @deprecated(reason: \\"Please use the relevant generic filter release: { lt: ... }\\")
              release_LTE: DateTime @deprecated(reason: \\"Please use the relevant generic filter release: { lte: ... }\\")
              runtime: IntScalarFilters
              runtime_EQ: Int @deprecated(reason: \\"Please use the relevant generic filter runtime: { eq: ... }\\")
              runtime_GT: Int @deprecated(reason: \\"Please use the relevant generic filter runtime: { gt: ... }\\")
              runtime_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter runtime: { gte: ... }\\")
              runtime_IN: [Int] @deprecated(reason: \\"Please use the relevant generic filter runtime: { in: ... }\\")
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

            type Query {
              actors(limit: Int, offset: Int, sort: [ActorSort!], where: ActorWhere): [Actor!]!
              actorsConnection(after: String, first: Int, sort: [ActorSort!], where: ActorWhere): ActorsConnection!
              movies(limit: Int, offset: Int, sort: [MovieSort!], where: MovieWhere): [Movie!]!
              moviesConnection(after: String, first: Int, sort: [MovieSort!], where: MovieWhere): MoviesConnection!
              series(limit: Int, offset: Int, sort: [SeriesSort!], where: SeriesWhere): [Series!]!
              seriesConnection(after: String, first: Int, sort: [SeriesSort!], where: SeriesWhere): SeriesConnection!
              shows(limit: Int, offset: Int, sort: [ShowSort!], where: ShowWhere): [Show!]!
              showsConnection(after: String, first: Int, sort: [ShowSort!], where: ShowWhere): ShowsConnection!
            }

            type Series implements Show {
              actors(limit: Int, offset: Int, sort: [ActorSort!], where: ActorWhere): [Actor!]!
              actorsConnection(after: String, first: Int, sort: [ShowActorsConnectionSort!], where: ShowActorsConnectionWhere): ShowActorsConnection!
              episodes: Int
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
              edge: ActedInCreateInput
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
              edge: ActedInCreateInput
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
              actors: SeriesActorsFieldInput
              episodes: Int
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
              episodes: SortDirection
              title: SortDirection
            }

            input SeriesUpdateInput {
              actors: [SeriesActorsUpdateFieldInput!]
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
              episodes: IntScalarFilters
              episodes_EQ: Int @deprecated(reason: \\"Please use the relevant generic filter episodes: { eq: ... }\\")
              episodes_GT: Int @deprecated(reason: \\"Please use the relevant generic filter episodes: { gt: ... }\\")
              episodes_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter episodes: { gte: ... }\\")
              episodes_IN: [Int] @deprecated(reason: \\"Please use the relevant generic filter episodes: { in: ... }\\")
              episodes_LT: Int @deprecated(reason: \\"Please use the relevant generic filter episodes: { lt: ... }\\")
              episodes_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter episodes: { lte: ... }\\")
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
              edge: ShowActorsEdgeCreateInput
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
              edge: ShowActorsEdgeCreateInput
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
              * Series
              \\"\\"\\"
              ActedIn: ActedInAggregationWhereInput
            }

            input ShowActorsEdgeCreateInput {
              \\"\\"\\"
              Relationship properties when source node is of type:
              * Movie
              * Series
              \\"\\"\\"
              ActedIn: ActedInCreateInput
            }

            input ShowActorsEdgeSort {
              \\"\\"\\"
              Relationship properties when source node is of type:
              * Movie
              * Series
              \\"\\"\\"
              ActedIn: ActedInSort
            }

            input ShowActorsEdgeUpdateInput {
              \\"\\"\\"
              Relationship properties when source node is of type:
              * Movie
              * Series
              \\"\\"\\"
              ActedIn: ActedInUpdateInput
            }

            input ShowActorsEdgeWhere {
              \\"\\"\\"
              Relationship properties when source node is of type:
              * Movie
              * Series
              \\"\\"\\"
              ActedIn: ActedInWhere
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

            union ShowActorsRelationshipProperties = ActedIn

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
