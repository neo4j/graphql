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

describe("Deprecated mutation operations", () => {
    test("Remove deprecated mutation operations", async () => {
        const typeDefs = gql`
            type Actor @node {
                name: String
                actedIn: [Movie!]! @relationship(type: "ACTED_IN", properties: "ActedIn", direction: OUT)
            }

            type Movie @node {
                id: ID!
                ratings: [Float!]!
                actors: [Actor!]! @relationship(type: "ACTED_IN", properties: "ActedIn", direction: IN)
                averageRating: Float!
                date: Date
                point: Point
            }

            type ActedIn @relationshipProperties {
                pay: [Float!]
                value: Int
            }
        `;
        const neoSchema = new Neo4jGraphQL({
            typeDefs,
            features: {
                excludeDeprecatedFields: {
                    mutationOperations: false,
                },
            },
        });
        const printedSchema = printSchemaWithDirectives(lexicographicSortSchema(await neoSchema.getSchema()));

        expect(printedSchema).toMatchInlineSnapshot(`
            "schema {
              query: Query
              mutation: Mutation
            }

            \\"\\"\\"
            The edge properties for the following fields:
            * Actor.actedIn
            * Movie.actors
            \\"\\"\\"
            type ActedIn {
              pay: [Float!]
              value: Int
            }

            input ActedInAggregationWhereInput {
              AND: [ActedInAggregationWhereInput!]
              NOT: ActedInAggregationWhereInput
              OR: [ActedInAggregationWhereInput!]
              value: IntScalarAggregationFilters
              value_AVERAGE_EQUAL: Float @deprecated(reason: \\"Please use the relevant generic filter 'value: { average: { eq: ... } } }' instead.\\")
              value_AVERAGE_GT: Float @deprecated(reason: \\"Please use the relevant generic filter 'value: { average: { gt: ... } } }' instead.\\")
              value_AVERAGE_GTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'value: { average: { gte: ... } } }' instead.\\")
              value_AVERAGE_LT: Float @deprecated(reason: \\"Please use the relevant generic filter 'value: { average: { lt: ... } } }' instead.\\")
              value_AVERAGE_LTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'value: { average: { lte: ... } } }' instead.\\")
              value_MAX_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'value: { max: { eq: ... } } }' instead.\\")
              value_MAX_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'value: { max: { gt: ... } } }' instead.\\")
              value_MAX_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'value: { max: { gte: ... } } }' instead.\\")
              value_MAX_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'value: { max: { lt: ... } } }' instead.\\")
              value_MAX_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'value: { max: { lte: ... } } }' instead.\\")
              value_MIN_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'value: { min: { eq: ... } } }' instead.\\")
              value_MIN_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'value: { min: { gt: ... } } }' instead.\\")
              value_MIN_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'value: { min: { gte: ... } } }' instead.\\")
              value_MIN_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'value: { min: { lt: ... } } }' instead.\\")
              value_MIN_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'value: { min: { lte: ... } } }' instead.\\")
              value_SUM_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'value: { sum: { eq: ... } } }' instead.\\")
              value_SUM_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'value: { sum: { gt: ... } } }' instead.\\")
              value_SUM_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'value: { sum: { gte: ... } } }' instead.\\")
              value_SUM_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'value: { sum: { lt: ... } } }' instead.\\")
              value_SUM_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'value: { sum: { lte: ... } } }' instead.\\")
            }

            input ActedInCreateInput {
              pay: [Float!]
              value: Int
            }

            input ActedInSort {
              pay: SortDirection
              value: SortDirection
            }

            input ActedInUpdateInput {
              pay: ListFloatMutations
              pay_POP: Int @deprecated(reason: \\"Please use the generic mutation 'pay: { pop: ... } }' instead.\\")
              pay_PUSH: [Float!] @deprecated(reason: \\"Please use the generic mutation 'pay: { push: ... } }' instead.\\")
              pay_SET: [Float!] @deprecated(reason: \\"Please use the generic mutation 'pay: { set: ... } }' instead.\\")
              value: IntScalarMutations
              value_DECREMENT: Int @deprecated(reason: \\"Please use the relevant generic mutation 'value: { decrement: ... } }' instead.\\")
              value_INCREMENT: Int @deprecated(reason: \\"Please use the relevant generic mutation 'value: { increment: ... } }' instead.\\")
              value_SET: Int @deprecated(reason: \\"Please use the generic mutation 'value: { set: ... } }' instead.\\")
            }

            input ActedInWhere {
              AND: [ActedInWhere!]
              NOT: ActedInWhere
              OR: [ActedInWhere!]
              pay: FloatListFilters
              pay_EQ: [Float!]
              pay_INCLUDES: Float
              value: IntScalarFilters
              value_EQ: Int
              value_GT: Int
              value_GTE: Int
              value_IN: [Int]
              value_LT: Int
              value_LTE: Int
            }

            type Actor {
              actedIn(limit: Int, offset: Int, sort: [MovieSort!], where: MovieWhere): [Movie!]!
              actedInAggregate(where: MovieWhere): ActorMovieActedInAggregationSelection
              actedInConnection(after: String, first: Int, sort: [ActorActedInConnectionSort!], where: ActorActedInConnectionWhere): ActorActedInConnection!
              name: String
            }

            input ActorActedInAggregateInput {
              AND: [ActorActedInAggregateInput!]
              NOT: ActorActedInAggregateInput
              OR: [ActorActedInAggregateInput!]
              count: IntScalarFilters
              count_EQ: Int
              count_GT: Int
              count_GTE: Int
              count_LT: Int
              count_LTE: Int
              edge: ActedInAggregationWhereInput
              node: ActorActedInNodeAggregationWhereInput
            }

            input ActorActedInConnectFieldInput {
              connect: [MovieConnectInput!]
              edge: ActedInCreateInput
              where: MovieConnectWhere
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
              node: MovieSort
            }

            input ActorActedInConnectionWhere {
              AND: [ActorActedInConnectionWhere!]
              NOT: ActorActedInConnectionWhere
              OR: [ActorActedInConnectionWhere!]
              edge: ActedInWhere
              node: MovieWhere
            }

            input ActorActedInCreateFieldInput {
              edge: ActedInCreateInput
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
              averageRating: FloatScalarAggregationFilters
              averageRating_AVERAGE_EQUAL: Float @deprecated(reason: \\"Please use the relevant generic filter 'averageRating: { average: { eq: ... } } }' instead.\\")
              averageRating_AVERAGE_GT: Float @deprecated(reason: \\"Please use the relevant generic filter 'averageRating: { average: { gt: ... } } }' instead.\\")
              averageRating_AVERAGE_GTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'averageRating: { average: { gte: ... } } }' instead.\\")
              averageRating_AVERAGE_LT: Float @deprecated(reason: \\"Please use the relevant generic filter 'averageRating: { average: { lt: ... } } }' instead.\\")
              averageRating_AVERAGE_LTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'averageRating: { average: { lte: ... } } }' instead.\\")
              averageRating_MAX_EQUAL: Float @deprecated(reason: \\"Please use the relevant generic filter 'averageRating: { max: { eq: ... } } }' instead.\\")
              averageRating_MAX_GT: Float @deprecated(reason: \\"Please use the relevant generic filter 'averageRating: { max: { gt: ... } } }' instead.\\")
              averageRating_MAX_GTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'averageRating: { max: { gte: ... } } }' instead.\\")
              averageRating_MAX_LT: Float @deprecated(reason: \\"Please use the relevant generic filter 'averageRating: { max: { lt: ... } } }' instead.\\")
              averageRating_MAX_LTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'averageRating: { max: { lte: ... } } }' instead.\\")
              averageRating_MIN_EQUAL: Float @deprecated(reason: \\"Please use the relevant generic filter 'averageRating: { min: { eq: ... } } }' instead.\\")
              averageRating_MIN_GT: Float @deprecated(reason: \\"Please use the relevant generic filter 'averageRating: { min: { gt: ... } } }' instead.\\")
              averageRating_MIN_GTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'averageRating: { min: { gte: ... } } }' instead.\\")
              averageRating_MIN_LT: Float @deprecated(reason: \\"Please use the relevant generic filter 'averageRating: { min: { lt: ... } } }' instead.\\")
              averageRating_MIN_LTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'averageRating: { min: { lte: ... } } }' instead.\\")
              averageRating_SUM_EQUAL: Float @deprecated(reason: \\"Please use the relevant generic filter 'averageRating: { sum: { eq: ... } } }' instead.\\")
              averageRating_SUM_GT: Float @deprecated(reason: \\"Please use the relevant generic filter 'averageRating: { sum: { gt: ... } } }' instead.\\")
              averageRating_SUM_GTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'averageRating: { sum: { gte: ... } } }' instead.\\")
              averageRating_SUM_LT: Float @deprecated(reason: \\"Please use the relevant generic filter 'averageRating: { sum: { lt: ... } } }' instead.\\")
              averageRating_SUM_LTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'averageRating: { sum: { lte: ... } } }' instead.\\")
              id: IDScalarAggregationFilters
              id_MAX_EQUAL: ID @deprecated(reason: \\"Please use the relevant generic filter 'id: { max: { eq: ... } } }' instead.\\")
              id_MAX_GT: ID @deprecated(reason: \\"Please use the relevant generic filter 'id: { max: { gt: ... } } }' instead.\\")
              id_MAX_GTE: ID @deprecated(reason: \\"Please use the relevant generic filter 'id: { max: { gte: ... } } }' instead.\\")
              id_MAX_LT: ID @deprecated(reason: \\"Please use the relevant generic filter 'id: { max: { lt: ... } } }' instead.\\")
              id_MAX_LTE: ID @deprecated(reason: \\"Please use the relevant generic filter 'id: { max: { lte: ... } } }' instead.\\")
              id_MIN_EQUAL: ID @deprecated(reason: \\"Please use the relevant generic filter 'id: { min: { eq: ... } } }' instead.\\")
              id_MIN_GT: ID @deprecated(reason: \\"Please use the relevant generic filter 'id: { min: { gt: ... } } }' instead.\\")
              id_MIN_GTE: ID @deprecated(reason: \\"Please use the relevant generic filter 'id: { min: { gte: ... } } }' instead.\\")
              id_MIN_LT: ID @deprecated(reason: \\"Please use the relevant generic filter 'id: { min: { lt: ... } } }' instead.\\")
              id_MIN_LTE: ID @deprecated(reason: \\"Please use the relevant generic filter 'id: { min: { lte: ... } } }' instead.\\")
            }

            type ActorActedInRelationship {
              cursor: String!
              node: Movie!
              properties: ActedIn!
            }

            input ActorActedInRelationshipFilters {
              \\"\\"\\"Return Actors where all of the related Movies match this filter\\"\\"\\"
              all: MovieWhere
              \\"\\"\\"Return Actors where none of the related Movies match this filter\\"\\"\\"
              none: MovieWhere
              \\"\\"\\"Return Actors where one of the related Movies match this filter\\"\\"\\"
              single: MovieWhere
              \\"\\"\\"Return Actors where some of the related Movies match this filter\\"\\"\\"
              some: MovieWhere
            }

            input ActorActedInUpdateConnectionInput {
              edge: ActedInUpdateInput
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
              actedIn: ActorActedInFieldInput
              name: String
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
              edge: ActorMovieActedInEdgeAggregateSelection
              node: ActorMovieActedInNodeAggregateSelection
            }

            type ActorMovieActedInEdgeAggregateSelection {
              value: IntAggregateSelection!
            }

            type ActorMovieActedInNodeAggregateSelection {
              averageRating: FloatAggregateSelection!
              id: IDAggregateSelection!
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
              name_IN: [String]
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

            \\"\\"\\"A date, represented as a 'yyyy-mm-dd' string\\"\\"\\"
            scalar Date

            \\"\\"\\"Date filters\\"\\"\\"
            input DateScalarFilters {
              eq: Date
              gt: Date
              gte: Date
              in: [Date!]
              lt: Date
              lte: Date
            }

            \\"\\"\\"Date mutations\\"\\"\\"
            input DateScalarMutations {
              set: Date
            }

            \\"\\"\\"
            Information about the number of nodes and relationships deleted during a delete mutation
            \\"\\"\\"
            type DeleteInfo {
              nodesDeleted: Int!
              relationshipsDeleted: Int!
            }

            type FloatAggregateSelection {
              average: Float
              max: Float
              min: Float
              sum: Float
            }

            \\"\\"\\"Float list filters\\"\\"\\"
            input FloatListFilters {
              eq: [FloatScalarFilters!]
              includes: FloatScalarFilters
            }

            \\"\\"\\"Filters for an aggregation of a float field\\"\\"\\"
            input FloatScalarAggregationFilters {
              average: FloatScalarFilters
              max: FloatScalarFilters
              min: FloatScalarFilters
              sum: FloatScalarFilters
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

            \\"\\"\\"Float mutations\\"\\"\\"
            input FloatScalarMutations {
              add: Float
              divide: Float
              multiply: Float
              set: Float
              subtract: Float
            }

            type IDAggregateSelection {
              longest: ID
              shortest: ID
            }

            \\"\\"\\"Filters for an aggregation of an ID input field\\"\\"\\"
            input IDScalarAggregationFilters {
              max: IDScalarFilters
              min: IDScalarFilters
            }

            \\"\\"\\"ID filters\\"\\"\\"
            input IDScalarFilters {
              contains: ID
              endsWith: ID
              eq: ID
              gt: ID
              gte: ID
              in: [ID!]
              lt: ID
              lte: ID
              matches: ID
              startsWith: ID
            }

            \\"\\"\\"ID mutations\\"\\"\\"
            input IDScalarMutations {
              set: ID
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

            \\"\\"\\"Mutations for a list for Float\\"\\"\\"
            input ListFloatMutations {
              pop: Int
              push: [Float!]
              set: [Float!]
            }

            type Movie {
              actors(limit: Int, offset: Int, sort: [ActorSort!], where: ActorWhere): [Actor!]!
              actorsAggregate(where: ActorWhere): MovieActorActorsAggregationSelection
              actorsConnection(after: String, first: Int, sort: [MovieActorsConnectionSort!], where: MovieActorsConnectionWhere): MovieActorsConnection!
              averageRating: Float!
              date: Date
              id: ID!
              point: Point
              ratings: [Float!]!
            }

            type MovieActorActorsAggregationSelection {
              count: Int!
              edge: MovieActorActorsEdgeAggregateSelection
              node: MovieActorActorsNodeAggregateSelection
            }

            type MovieActorActorsEdgeAggregateSelection {
              value: IntAggregateSelection!
            }

            type MovieActorActorsNodeAggregateSelection {
              name: StringAggregateSelection!
            }

            input MovieActorsAggregateInput {
              AND: [MovieActorsAggregateInput!]
              NOT: MovieActorsAggregateInput
              OR: [MovieActorsAggregateInput!]
              count: IntScalarFilters
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
              edge: ActedInCreateInput
              where: ActorConnectWhere
            }

            type MovieActorsConnection {
              edges: [MovieActorsRelationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input MovieActorsConnectionFilters {
              \\"\\"\\"
              Return Movies where all of the related MovieActorsConnections match this filter
              \\"\\"\\"
              all: MovieActorsConnectionWhere
              \\"\\"\\"
              Return Movies where none of the related MovieActorsConnections match this filter
              \\"\\"\\"
              none: MovieActorsConnectionWhere
              \\"\\"\\"
              Return Movies where one of the related MovieActorsConnections match this filter
              \\"\\"\\"
              single: MovieActorsConnectionWhere
              \\"\\"\\"
              Return Movies where some of the related MovieActorsConnections match this filter
              \\"\\"\\"
              some: MovieActorsConnectionWhere
            }

            input MovieActorsConnectionSort {
              edge: ActedInSort
              node: ActorSort
            }

            input MovieActorsConnectionWhere {
              AND: [MovieActorsConnectionWhere!]
              NOT: MovieActorsConnectionWhere
              OR: [MovieActorsConnectionWhere!]
              edge: ActedInWhere
              node: ActorWhere
            }

            input MovieActorsCreateFieldInput {
              edge: ActedInCreateInput
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

            type MovieActorsRelationship {
              cursor: String!
              node: Actor!
              properties: ActedIn!
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
              delete: [MovieActorsDeleteFieldInput!]
              disconnect: [MovieActorsDisconnectFieldInput!]
              update: MovieActorsUpdateConnectionInput
              where: MovieActorsConnectionWhere
            }

            type MovieAggregateSelection {
              averageRating: FloatAggregateSelection!
              count: Int!
              id: IDAggregateSelection!
            }

            input MovieConnectInput {
              actors: [MovieActorsConnectFieldInput!]
            }

            input MovieConnectWhere {
              node: MovieWhere!
            }

            input MovieCreateInput {
              actors: MovieActorsFieldInput
              averageRating: Float!
              date: Date
              id: ID!
              point: PointInput
              ratings: [Float!]!
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

            \\"\\"\\"
            Fields to sort Movies by. The order in which sorts are applied is not guaranteed when specifying many fields in one MovieSort object.
            \\"\\"\\"
            input MovieSort {
              averageRating: SortDirection
              date: SortDirection
              id: SortDirection
              point: SortDirection
            }

            input MovieUpdateInput {
              actors: [MovieActorsUpdateFieldInput!]
              averageRating: FloatScalarMutations
              averageRating_ADD: Float @deprecated(reason: \\"Please use the relevant generic mutation 'averageRating: { add: ... } }' instead.\\")
              averageRating_DIVIDE: Float @deprecated(reason: \\"Please use the relevant generic mutation 'averageRating: { divide: ... } }' instead.\\")
              averageRating_MULTIPLY: Float @deprecated(reason: \\"Please use the relevant generic mutation 'averageRating: { multiply: ... } }' instead.\\")
              averageRating_SET: Float @deprecated(reason: \\"Please use the generic mutation 'averageRating: { set: ... } }' instead.\\")
              averageRating_SUBTRACT: Float @deprecated(reason: \\"Please use the relevant generic mutation 'averageRating: { subtract: ... } }' instead.\\")
              date: DateScalarMutations
              date_SET: Date @deprecated(reason: \\"Please use the generic mutation 'date: { set: ... } }' instead.\\")
              id: IDScalarMutations
              id_SET: ID @deprecated(reason: \\"Please use the generic mutation 'id: { set: ... } }' instead.\\")
              point: PointMutations
              point_SET: PointInput @deprecated(reason: \\"Please use the generic mutation 'point: { set: ... } }' instead.\\")
              ratings: ListFloatMutations
              ratings_POP: Int @deprecated(reason: \\"Please use the generic mutation 'ratings: { pop: ... } }' instead.\\")
              ratings_PUSH: [Float!] @deprecated(reason: \\"Please use the generic mutation 'ratings: { push: ... } }' instead.\\")
              ratings_SET: [Float!] @deprecated(reason: \\"Please use the generic mutation 'ratings: { set: ... } }' instead.\\")
            }

            input MovieWhere {
              AND: [MovieWhere!]
              NOT: MovieWhere
              OR: [MovieWhere!]
              actors: MovieActorsRelationshipFilters
              actorsAggregate: MovieActorsAggregateInput
              actorsConnection: MovieActorsConnectionFilters
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
              averageRating: FloatScalarFilters
              averageRating_EQ: Float
              averageRating_GT: Float
              averageRating_GTE: Float
              averageRating_IN: [Float!]
              averageRating_LT: Float
              averageRating_LTE: Float
              date: DateScalarFilters
              date_EQ: Date
              date_GT: Date
              date_GTE: Date
              date_IN: [Date]
              date_LT: Date
              date_LTE: Date
              id: IDScalarFilters
              id_CONTAINS: ID
              id_ENDS_WITH: ID
              id_EQ: ID
              id_IN: [ID!]
              id_STARTS_WITH: ID
              point: PointFilters
              point_DISTANCE: PointDistance
              point_EQ: PointInput
              point_GT: PointDistance
              point_GTE: PointDistance
              point_IN: [PointInput]
              point_LT: PointDistance
              point_LTE: PointDistance
              ratings: FloatListFilters
              ratings_EQ: [Float!]
              ratings_INCLUDES: Float
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

            \\"\\"\\"
            A point in a coordinate system. For more information, see https://neo4j.com/docs/graphql/4/type-definitions/types/spatial/#point
            \\"\\"\\"
            type Point {
              crs: String!
              height: Float
              latitude: Float!
              longitude: Float!
              srid: Int!
            }

            \\"\\"\\"Input type for a point with a distance\\"\\"\\"
            input PointDistance {
              \\"\\"\\"The distance in metres to be used when comparing two points\\"\\"\\"
              distance: Float!
              point: PointInput!
            }

            \\"\\"\\"Distance filters\\"\\"\\"
            input PointDistanceFilters {
              eq: Float
              from: PointInput!
              gt: Float
              gte: Float
              lt: Float
              lte: Float
            }

            \\"\\"\\"Point filters\\"\\"\\"
            input PointFilters {
              distance: PointDistanceFilters
              eq: PointInput
              in: [PointInput!]
            }

            \\"\\"\\"Input type for a point\\"\\"\\"
            input PointInput {
              height: Float
              latitude: Float!
              longitude: Float!
            }

            \\"\\"\\"Point mutations\\"\\"\\"
            input PointMutations {
              set: PointInput
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
              gt: String
              gte: String
              in: [String!]
              lt: String
              lte: String
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
