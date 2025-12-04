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

describe("limitRequired constructor option", () => {
    test("interfaces and interface relationships", async () => {
        const typeDefs = gql`
            interface Production {
                id: ID!
                title: String!
            }
            type Movie implements Production @node {
                id: ID!
                title: String!
                runtime: Int!
                actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN, properties: "ActedIn")
            }
            type Series implements Production @node {
                id: ID!
                title: String!
                episodes: Int!
            }
            interface Person {
                id: ID!
                name: String!
                actedIn: [Production!]! @declareRelationship
                movies: [Movie!]! @declareRelationship
            }
            type Actor implements Person @node {
                id: ID!
                name: String!
                movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT, properties: "ActedIn")
                actedIn: [Production!]! @relationship(type: "ACTED_IN", direction: OUT, properties: "ActedIn")
            }
            type ActedIn @relationshipProperties {
                screenTime: Int!
            }
        `;
        const neoSchema = new Neo4jGraphQL({ typeDefs, features: { limitRequired: true } });
        const printedSchema = printSchemaWithDirectives(lexicographicSortSchema(await neoSchema.getSchema()));

        expect(printedSchema).toMatchInlineSnapshot(`
            "schema {
              query: Query
              mutation: Mutation
            }

            \\"\\"\\"
            The edge properties for the following fields:
            * Movie.actors
            * Actor.movies
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

            type Actor implements Person {
              actedIn(limit: Int!, offset: Int, sort: [ProductionSort!], where: ProductionWhere): [Production!]!
              actedInConnection(after: String, first: Int!, sort: [PersonActedInConnectionSort!], where: PersonActedInConnectionWhere): PersonActedInConnection!
              id: ID!
              movies(limit: Int!, offset: Int, sort: [MovieSort!], where: MovieWhere): [Movie!]!
              moviesConnection(after: String, first: Int!, sort: [PersonMoviesConnectionSort!], where: PersonMoviesConnectionWhere): PersonMoviesConnection!
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
              Filter Actors by aggregating results on related PersonActedInConnections
              \\"\\"\\"
              aggregate: ActorActedInConnectionAggregateInput
              \\"\\"\\"
              Return Actors where all of the related PersonActedInConnections match this filter
              \\"\\"\\"
              all: PersonActedInConnectionWhere
              \\"\\"\\"
              Return Actors where none of the related PersonActedInConnections match this filter
              \\"\\"\\"
              none: PersonActedInConnectionWhere
              \\"\\"\\"
              Return Actors where one of the related PersonActedInConnections match this filter
              \\"\\"\\"
              single: PersonActedInConnectionWhere
              \\"\\"\\"
              Return Actors where some of the related PersonActedInConnections match this filter
              \\"\\"\\"
              some: PersonActedInConnectionWhere
            }

            input ActorActedInCreateFieldInput {
              edge: ActedInCreateInput!
              node: ProductionCreateInput!
            }

            input ActorActedInDeleteFieldInput {
              where: PersonActedInConnectionWhere
            }

            input ActorActedInDisconnectFieldInput {
              where: PersonActedInConnectionWhere
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

            input ActorActedInUpdateConnectionInput {
              edge: ActedInUpdateInput
              node: ProductionUpdateInput
              where: PersonActedInConnectionWhere
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
              movies: [ActorMoviesConnectFieldInput!]
            }

            input ActorConnectWhere {
              node: ActorWhere!
            }

            input ActorCreateInput {
              actedIn: ActorActedInFieldInput
              id: ID!
              movies: ActorMoviesFieldInput
              name: String!
            }

            input ActorDeleteInput {
              actedIn: [ActorActedInDeleteFieldInput!]
              movies: [PersonMoviesDeleteFieldInput!]
            }

            input ActorDisconnectInput {
              actedIn: [ActorActedInDisconnectFieldInput!]
              movies: [PersonMoviesDisconnectFieldInput!]
            }

            type ActorEdge {
              cursor: String!
              node: Actor!
            }

            input ActorMoviesAggregateInput {
              AND: [ActorMoviesAggregateInput!]
              NOT: ActorMoviesAggregateInput
              OR: [ActorMoviesAggregateInput!]
              count: IntScalarFilters
              count_EQ: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { eq: ... } } }' instead.\\")
              count_GT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gt: ... } } }' instead.\\")
              count_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gte: ... } } }' instead.\\")
              count_LT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lt: ... } } }' instead.\\")
              count_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lte: ... } } }' instead.\\")
              edge: ActedInAggregationWhereInput
              node: ActorMoviesNodeAggregationWhereInput
            }

            input ActorMoviesConnectFieldInput {
              connect: [MovieConnectInput!]
              edge: ActedInCreateInput!
              where: MovieConnectWhere
            }

            input ActorMoviesConnectionAggregateInput {
              AND: [ActorMoviesConnectionAggregateInput!]
              NOT: ActorMoviesConnectionAggregateInput
              OR: [ActorMoviesConnectionAggregateInput!]
              count: ConnectionAggregationCountFilterInput
              edge: ActedInAggregationWhereInput
              node: ActorMoviesNodeAggregationWhereInput
            }

            input ActorMoviesConnectionFilters {
              \\"\\"\\"
              Filter Actors by aggregating results on related PersonMoviesConnections
              \\"\\"\\"
              aggregate: ActorMoviesConnectionAggregateInput
              \\"\\"\\"
              Return Actors where all of the related PersonMoviesConnections match this filter
              \\"\\"\\"
              all: PersonMoviesConnectionWhere
              \\"\\"\\"
              Return Actors where none of the related PersonMoviesConnections match this filter
              \\"\\"\\"
              none: PersonMoviesConnectionWhere
              \\"\\"\\"
              Return Actors where one of the related PersonMoviesConnections match this filter
              \\"\\"\\"
              single: PersonMoviesConnectionWhere
              \\"\\"\\"
              Return Actors where some of the related PersonMoviesConnections match this filter
              \\"\\"\\"
              some: PersonMoviesConnectionWhere
            }

            input ActorMoviesCreateFieldInput {
              edge: ActedInCreateInput!
              node: MovieCreateInput!
            }

            input ActorMoviesFieldInput {
              connect: [ActorMoviesConnectFieldInput!]
              create: [ActorMoviesCreateFieldInput!]
            }

            input ActorMoviesNodeAggregationWhereInput {
              AND: [ActorMoviesNodeAggregationWhereInput!]
              NOT: ActorMoviesNodeAggregationWhereInput
              OR: [ActorMoviesNodeAggregationWhereInput!]
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

            input ActorMoviesUpdateConnectionInput {
              edge: ActedInUpdateInput
              node: MovieUpdateInput
              where: PersonMoviesConnectionWhere
            }

            input ActorMoviesUpdateFieldInput {
              connect: [ActorMoviesConnectFieldInput!]
              create: [ActorMoviesCreateFieldInput!]
              delete: [PersonMoviesDeleteFieldInput!]
              disconnect: [PersonMoviesDisconnectFieldInput!]
              update: ActorMoviesUpdateConnectionInput
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
              id: SortDirection
              name: SortDirection
            }

            input ActorUpdateInput {
              actedIn: [ActorActedInUpdateFieldInput!]
              id: IDScalarMutations
              id_SET: ID @deprecated(reason: \\"Please use the generic mutation 'id: { set: ... } }' instead.\\")
              movies: [ActorMoviesUpdateFieldInput!]
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
              Return Actors where all of the related PersonActedInConnections match this filter
              \\"\\"\\"
              actedInConnection_ALL: PersonActedInConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actedInConnection: { all: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Actors where none of the related PersonActedInConnections match this filter
              \\"\\"\\"
              actedInConnection_NONE: PersonActedInConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actedInConnection: { none: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Actors where one of the related PersonActedInConnections match this filter
              \\"\\"\\"
              actedInConnection_SINGLE: PersonActedInConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actedInConnection: { single: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Actors where some of the related PersonActedInConnections match this filter
              \\"\\"\\"
              actedInConnection_SOME: PersonActedInConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actedInConnection: { some: { node: ... } } }' instead.\\")
              \\"\\"\\"Return Actors where all of the related Productions match this filter\\"\\"\\"
              actedIn_ALL: ProductionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actedIn: { all: ... }' instead.\\")
              \\"\\"\\"Return Actors where none of the related Productions match this filter\\"\\"\\"
              actedIn_NONE: ProductionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actedIn: { none: ... }' instead.\\")
              \\"\\"\\"Return Actors where one of the related Productions match this filter\\"\\"\\"
              actedIn_SINGLE: ProductionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actedIn: {  single: ... }' instead.\\")
              \\"\\"\\"Return Actors where some of the related Productions match this filter\\"\\"\\"
              actedIn_SOME: ProductionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actedIn: {  some: ... }' instead.\\")
              id: IDScalarFilters
              id_CONTAINS: ID @deprecated(reason: \\"Please use the relevant generic filter id: { contains: ... }\\")
              id_ENDS_WITH: ID @deprecated(reason: \\"Please use the relevant generic filter id: { endsWith: ... }\\")
              id_EQ: ID @deprecated(reason: \\"Please use the relevant generic filter id: { eq: ... }\\")
              id_IN: [ID!] @deprecated(reason: \\"Please use the relevant generic filter id: { in: ... }\\")
              id_STARTS_WITH: ID @deprecated(reason: \\"Please use the relevant generic filter id: { startsWith: ... }\\")
              movies: MovieRelationshipFilters
              moviesAggregate: ActorMoviesAggregateInput @deprecated(reason: \\"Aggregate filters are moved inside the moviesConnection filter, please use { moviesConnection: { aggregate: {...} } } instead\\")
              moviesConnection: ActorMoviesConnectionFilters
              \\"\\"\\"
              Return Actors where all of the related PersonMoviesConnections match this filter
              \\"\\"\\"
              moviesConnection_ALL: PersonMoviesConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'moviesConnection: { all: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Actors where none of the related PersonMoviesConnections match this filter
              \\"\\"\\"
              moviesConnection_NONE: PersonMoviesConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'moviesConnection: { none: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Actors where one of the related PersonMoviesConnections match this filter
              \\"\\"\\"
              moviesConnection_SINGLE: PersonMoviesConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'moviesConnection: { single: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Actors where some of the related PersonMoviesConnections match this filter
              \\"\\"\\"
              moviesConnection_SOME: PersonMoviesConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'moviesConnection: { some: { node: ... } } }' instead.\\")
              \\"\\"\\"Return Actors where all of the related Movies match this filter\\"\\"\\"
              movies_ALL: MovieWhere @deprecated(reason: \\"Please use the relevant generic filter 'movies: { all: ... }' instead.\\")
              \\"\\"\\"Return Actors where none of the related Movies match this filter\\"\\"\\"
              movies_NONE: MovieWhere @deprecated(reason: \\"Please use the relevant generic filter 'movies: { none: ... }' instead.\\")
              \\"\\"\\"Return Actors where one of the related Movies match this filter\\"\\"\\"
              movies_SINGLE: MovieWhere @deprecated(reason: \\"Please use the relevant generic filter 'movies: {  single: ... }' instead.\\")
              \\"\\"\\"Return Actors where some of the related Movies match this filter\\"\\"\\"
              movies_SOME: MovieWhere @deprecated(reason: \\"Please use the relevant generic filter 'movies: {  some: ... }' instead.\\")
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
              actors(limit: Int!, offset: Int, sort: [ActorSort!], where: ActorWhere): [Actor!]!
              actorsConnection(after: String, first: Int!, sort: [MovieActorsConnectionSort!], where: MovieActorsConnectionWhere): MovieActorsConnection!
              id: ID!
              runtime: Int!
              title: String!
            }

            type MovieActorActorsAggregateSelection {
              count: CountConnection!
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

            type MovieActorsConnection {
              aggregate: MovieActorActorsAggregateSelection!
              edges: [MovieActorsRelationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
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
              \\"\\"\\"Filter Movies by aggregating results on related MovieActorsConnections\\"\\"\\"
              aggregate: MovieActorsConnectionAggregateInput
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
              edge: ActedInCreateInput!
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

            input MovieActorsUpdateConnectionInput {
              edge: ActedInUpdateInput
              node: ActorUpdateInput
              where: MovieActorsConnectionWhere
            }

            input MovieActorsUpdateFieldInput {
              connect: [MovieActorsConnectFieldInput!]
              create: [MovieActorsCreateFieldInput!]
              delete: [MovieActorsDeleteFieldInput!]
              disconnect: [MovieActorsDisconnectFieldInput!]
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

            input MovieConnectInput {
              actors: [MovieActorsConnectFieldInput!]
            }

            input MovieConnectWhere {
              node: MovieWhere!
            }

            input MovieCreateInput {
              actors: MovieActorsFieldInput
              id: ID!
              runtime: Int!
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

            input MovieRelationshipFilters {
              \\"\\"\\"Filter type where all of the related Movies match this filter\\"\\"\\"
              all: MovieWhere
              \\"\\"\\"Filter type where none of the related Movies match this filter\\"\\"\\"
              none: MovieWhere
              \\"\\"\\"Filter type where one of the related Movies match this filter\\"\\"\\"
              single: MovieWhere
              \\"\\"\\"Filter type where some of the related Movies match this filter\\"\\"\\"
              some: MovieWhere
            }

            \\"\\"\\"
            Fields to sort Movies by. The order in which sorts are applied is not guaranteed when specifying many fields in one MovieSort object.
            \\"\\"\\"
            input MovieSort {
              id: SortDirection
              runtime: SortDirection
              title: SortDirection
            }

            input MovieUpdateInput {
              actors: [MovieActorsUpdateFieldInput!]
              id: IDScalarMutations
              id_SET: ID @deprecated(reason: \\"Please use the generic mutation 'id: { set: ... } }' instead.\\")
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
              Return Movies where all of the related MovieActorsConnections match this filter
              \\"\\"\\"
              actorsConnection_ALL: MovieActorsConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actorsConnection: { all: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Movies where none of the related MovieActorsConnections match this filter
              \\"\\"\\"
              actorsConnection_NONE: MovieActorsConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actorsConnection: { none: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Movies where one of the related MovieActorsConnections match this filter
              \\"\\"\\"
              actorsConnection_SINGLE: MovieActorsConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actorsConnection: { single: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Movies where some of the related MovieActorsConnections match this filter
              \\"\\"\\"
              actorsConnection_SOME: MovieActorsConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actorsConnection: { some: { node: ... } } }' instead.\\")
              \\"\\"\\"Return Movies where all of the related Actors match this filter\\"\\"\\"
              actors_ALL: ActorWhere @deprecated(reason: \\"Please use the relevant generic filter 'actors: { all: ... }' instead.\\")
              \\"\\"\\"Return Movies where none of the related Actors match this filter\\"\\"\\"
              actors_NONE: ActorWhere @deprecated(reason: \\"Please use the relevant generic filter 'actors: { none: ... }' instead.\\")
              \\"\\"\\"Return Movies where one of the related Actors match this filter\\"\\"\\"
              actors_SINGLE: ActorWhere @deprecated(reason: \\"Please use the relevant generic filter 'actors: {  single: ... }' instead.\\")
              \\"\\"\\"Return Movies where some of the related Actors match this filter\\"\\"\\"
              actors_SOME: ActorWhere @deprecated(reason: \\"Please use the relevant generic filter 'actors: {  some: ... }' instead.\\")
              id: IDScalarFilters
              id_CONTAINS: ID @deprecated(reason: \\"Please use the relevant generic filter id: { contains: ... }\\")
              id_ENDS_WITH: ID @deprecated(reason: \\"Please use the relevant generic filter id: { endsWith: ... }\\")
              id_EQ: ID @deprecated(reason: \\"Please use the relevant generic filter id: { eq: ... }\\")
              id_IN: [ID!] @deprecated(reason: \\"Please use the relevant generic filter id: { in: ... }\\")
              id_STARTS_WITH: ID @deprecated(reason: \\"Please use the relevant generic filter id: { startsWith: ... }\\")
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

            type PeopleConnection {
              aggregate: PersonAggregate!
              edges: [PersonEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            interface Person {
              actedIn(limit: Int!, offset: Int, sort: [ProductionSort!], where: ProductionWhere): [Production!]!
              actedInConnection(after: String, first: Int!, sort: [PersonActedInConnectionSort!], where: PersonActedInConnectionWhere): PersonActedInConnection!
              id: ID!
              movies(limit: Int!, offset: Int, sort: [MovieSort!], where: MovieWhere): [Movie!]!
              moviesConnection(after: String, first: Int!, sort: [PersonMoviesConnectionSort!], where: PersonMoviesConnectionWhere): PersonMoviesConnection!
              name: String!
            }

            input PersonActedInAggregateInput {
              AND: [PersonActedInAggregateInput!]
              NOT: PersonActedInAggregateInput
              OR: [PersonActedInAggregateInput!]
              count: IntScalarFilters
              count_EQ: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { eq: ... } } }' instead.\\")
              count_GT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gt: ... } } }' instead.\\")
              count_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gte: ... } } }' instead.\\")
              count_LT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lt: ... } } }' instead.\\")
              count_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lte: ... } } }' instead.\\")
              edge: PersonActedInEdgeAggregationWhereInput
              node: PersonActedInNodeAggregationWhereInput
            }

            type PersonActedInConnection {
              edges: [PersonActedInRelationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input PersonActedInConnectionAggregateInput {
              AND: [PersonActedInConnectionAggregateInput!]
              NOT: PersonActedInConnectionAggregateInput
              OR: [PersonActedInConnectionAggregateInput!]
              count: ConnectionAggregationCountFilterInput
              edge: PersonActedInEdgeAggregationWhereInput
              node: PersonActedInNodeAggregationWhereInput
            }

            input PersonActedInConnectionFilters {
              \\"\\"\\"
              Filter People by aggregating results on related PersonActedInConnections
              \\"\\"\\"
              aggregate: PersonActedInConnectionAggregateInput
              \\"\\"\\"
              Return People where all of the related PersonActedInConnections match this filter
              \\"\\"\\"
              all: PersonActedInConnectionWhere
              \\"\\"\\"
              Return People where none of the related PersonActedInConnections match this filter
              \\"\\"\\"
              none: PersonActedInConnectionWhere
              \\"\\"\\"
              Return People where one of the related PersonActedInConnections match this filter
              \\"\\"\\"
              single: PersonActedInConnectionWhere
              \\"\\"\\"
              Return People where some of the related PersonActedInConnections match this filter
              \\"\\"\\"
              some: PersonActedInConnectionWhere
            }

            input PersonActedInConnectionSort {
              edge: PersonActedInEdgeSort
              node: ProductionSort
            }

            input PersonActedInConnectionWhere {
              AND: [PersonActedInConnectionWhere!]
              NOT: PersonActedInConnectionWhere
              OR: [PersonActedInConnectionWhere!]
              edge: PersonActedInEdgeWhere
              node: ProductionWhere
            }

            input PersonActedInEdgeAggregationWhereInput {
              \\"\\"\\"
              Relationship properties when source node is of type:
              * Actor
              \\"\\"\\"
              ActedIn: ActedInAggregationWhereInput
            }

            input PersonActedInEdgeSort {
              \\"\\"\\"
              Relationship properties when source node is of type:
              * Actor
              \\"\\"\\"
              ActedIn: ActedInSort
            }

            input PersonActedInEdgeWhere {
              \\"\\"\\"
              Relationship properties when source node is of type:
              * Actor
              \\"\\"\\"
              ActedIn: ActedInWhere
            }

            input PersonActedInNodeAggregationWhereInput {
              AND: [PersonActedInNodeAggregationWhereInput!]
              NOT: PersonActedInNodeAggregationWhereInput
              OR: [PersonActedInNodeAggregationWhereInput!]
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

            type PersonActedInRelationship {
              cursor: String!
              node: Production!
              properties: PersonActedInRelationshipProperties!
            }

            union PersonActedInRelationshipProperties = ActedIn

            type PersonAggregate {
              count: Count!
              node: PersonAggregateNode!
            }

            type PersonAggregateNode {
              name: StringAggregateSelection!
            }

            type PersonEdge {
              cursor: String!
              node: Person!
            }

            enum PersonImplementation {
              Actor
            }

            input PersonMoviesAggregateInput {
              AND: [PersonMoviesAggregateInput!]
              NOT: PersonMoviesAggregateInput
              OR: [PersonMoviesAggregateInput!]
              count: IntScalarFilters
              count_EQ: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { eq: ... } } }' instead.\\")
              count_GT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gt: ... } } }' instead.\\")
              count_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gte: ... } } }' instead.\\")
              count_LT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lt: ... } } }' instead.\\")
              count_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lte: ... } } }' instead.\\")
              edge: PersonMoviesEdgeAggregationWhereInput
              node: PersonMoviesNodeAggregationWhereInput
            }

            type PersonMoviesConnection {
              edges: [PersonMoviesRelationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input PersonMoviesConnectionAggregateInput {
              AND: [PersonMoviesConnectionAggregateInput!]
              NOT: PersonMoviesConnectionAggregateInput
              OR: [PersonMoviesConnectionAggregateInput!]
              count: ConnectionAggregationCountFilterInput
              edge: PersonMoviesEdgeAggregationWhereInput
              node: PersonMoviesNodeAggregationWhereInput
            }

            input PersonMoviesConnectionFilters {
              \\"\\"\\"
              Filter People by aggregating results on related PersonMoviesConnections
              \\"\\"\\"
              aggregate: PersonMoviesConnectionAggregateInput
              \\"\\"\\"
              Return People where all of the related PersonMoviesConnections match this filter
              \\"\\"\\"
              all: PersonMoviesConnectionWhere
              \\"\\"\\"
              Return People where none of the related PersonMoviesConnections match this filter
              \\"\\"\\"
              none: PersonMoviesConnectionWhere
              \\"\\"\\"
              Return People where one of the related PersonMoviesConnections match this filter
              \\"\\"\\"
              single: PersonMoviesConnectionWhere
              \\"\\"\\"
              Return People where some of the related PersonMoviesConnections match this filter
              \\"\\"\\"
              some: PersonMoviesConnectionWhere
            }

            input PersonMoviesConnectionSort {
              edge: PersonMoviesEdgeSort
              node: MovieSort
            }

            input PersonMoviesConnectionWhere {
              AND: [PersonMoviesConnectionWhere!]
              NOT: PersonMoviesConnectionWhere
              OR: [PersonMoviesConnectionWhere!]
              edge: PersonMoviesEdgeWhere
              node: MovieWhere
            }

            input PersonMoviesDeleteFieldInput {
              delete: MovieDeleteInput
              where: PersonMoviesConnectionWhere
            }

            input PersonMoviesDisconnectFieldInput {
              disconnect: MovieDisconnectInput
              where: PersonMoviesConnectionWhere
            }

            input PersonMoviesEdgeAggregationWhereInput {
              \\"\\"\\"
              Relationship properties when source node is of type:
              * Actor
              \\"\\"\\"
              ActedIn: ActedInAggregationWhereInput
            }

            input PersonMoviesEdgeSort {
              \\"\\"\\"
              Relationship properties when source node is of type:
              * Actor
              \\"\\"\\"
              ActedIn: ActedInSort
            }

            input PersonMoviesEdgeWhere {
              \\"\\"\\"
              Relationship properties when source node is of type:
              * Actor
              \\"\\"\\"
              ActedIn: ActedInWhere
            }

            input PersonMoviesNodeAggregationWhereInput {
              AND: [PersonMoviesNodeAggregationWhereInput!]
              NOT: PersonMoviesNodeAggregationWhereInput
              OR: [PersonMoviesNodeAggregationWhereInput!]
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

            type PersonMoviesRelationship {
              cursor: String!
              node: Movie!
              properties: PersonMoviesRelationshipProperties!
            }

            union PersonMoviesRelationshipProperties = ActedIn

            \\"\\"\\"
            Fields to sort People by. The order in which sorts are applied is not guaranteed when specifying many fields in one PersonSort object.
            \\"\\"\\"
            input PersonSort {
              id: SortDirection
              name: SortDirection
            }

            input PersonWhere {
              AND: [PersonWhere!]
              NOT: PersonWhere
              OR: [PersonWhere!]
              actedIn: ProductionRelationshipFilters
              actedInAggregate: PersonActedInAggregateInput @deprecated(reason: \\"Aggregate filters are moved inside the actedInConnection filter, please use { actedInConnection: { aggregate: {...} } } instead\\")
              actedInConnection: PersonActedInConnectionFilters
              \\"\\"\\"
              Return People where all of the related PersonActedInConnections match this filter
              \\"\\"\\"
              actedInConnection_ALL: PersonActedInConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actedInConnection: { all: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return People where none of the related PersonActedInConnections match this filter
              \\"\\"\\"
              actedInConnection_NONE: PersonActedInConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actedInConnection: { none: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return People where one of the related PersonActedInConnections match this filter
              \\"\\"\\"
              actedInConnection_SINGLE: PersonActedInConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actedInConnection: { single: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return People where some of the related PersonActedInConnections match this filter
              \\"\\"\\"
              actedInConnection_SOME: PersonActedInConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actedInConnection: { some: { node: ... } } }' instead.\\")
              \\"\\"\\"Return People where all of the related Productions match this filter\\"\\"\\"
              actedIn_ALL: ProductionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actedIn: { all: ... }' instead.\\")
              \\"\\"\\"Return People where none of the related Productions match this filter\\"\\"\\"
              actedIn_NONE: ProductionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actedIn: { none: ... }' instead.\\")
              \\"\\"\\"Return People where one of the related Productions match this filter\\"\\"\\"
              actedIn_SINGLE: ProductionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actedIn: {  single: ... }' instead.\\")
              \\"\\"\\"Return People where some of the related Productions match this filter\\"\\"\\"
              actedIn_SOME: ProductionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actedIn: {  some: ... }' instead.\\")
              id: IDScalarFilters
              id_CONTAINS: ID @deprecated(reason: \\"Please use the relevant generic filter id: { contains: ... }\\")
              id_ENDS_WITH: ID @deprecated(reason: \\"Please use the relevant generic filter id: { endsWith: ... }\\")
              id_EQ: ID @deprecated(reason: \\"Please use the relevant generic filter id: { eq: ... }\\")
              id_IN: [ID!] @deprecated(reason: \\"Please use the relevant generic filter id: { in: ... }\\")
              id_STARTS_WITH: ID @deprecated(reason: \\"Please use the relevant generic filter id: { startsWith: ... }\\")
              movies: MovieRelationshipFilters
              moviesAggregate: PersonMoviesAggregateInput @deprecated(reason: \\"Aggregate filters are moved inside the moviesConnection filter, please use { moviesConnection: { aggregate: {...} } } instead\\")
              moviesConnection: PersonMoviesConnectionFilters
              \\"\\"\\"
              Return People where all of the related PersonMoviesConnections match this filter
              \\"\\"\\"
              moviesConnection_ALL: PersonMoviesConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'moviesConnection: { all: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return People where none of the related PersonMoviesConnections match this filter
              \\"\\"\\"
              moviesConnection_NONE: PersonMoviesConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'moviesConnection: { none: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return People where one of the related PersonMoviesConnections match this filter
              \\"\\"\\"
              moviesConnection_SINGLE: PersonMoviesConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'moviesConnection: { single: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return People where some of the related PersonMoviesConnections match this filter
              \\"\\"\\"
              moviesConnection_SOME: PersonMoviesConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'moviesConnection: { some: { node: ... } } }' instead.\\")
              \\"\\"\\"Return People where all of the related Movies match this filter\\"\\"\\"
              movies_ALL: MovieWhere @deprecated(reason: \\"Please use the relevant generic filter 'movies: { all: ... }' instead.\\")
              \\"\\"\\"Return People where none of the related Movies match this filter\\"\\"\\"
              movies_NONE: MovieWhere @deprecated(reason: \\"Please use the relevant generic filter 'movies: { none: ... }' instead.\\")
              \\"\\"\\"Return People where one of the related Movies match this filter\\"\\"\\"
              movies_SINGLE: MovieWhere @deprecated(reason: \\"Please use the relevant generic filter 'movies: {  single: ... }' instead.\\")
              \\"\\"\\"Return People where some of the related Movies match this filter\\"\\"\\"
              movies_SOME: MovieWhere @deprecated(reason: \\"Please use the relevant generic filter 'movies: {  some: ... }' instead.\\")
              name: StringScalarFilters
              name_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter name: { contains: ... }\\")
              name_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter name: { endsWith: ... }\\")
              name_EQ: String @deprecated(reason: \\"Please use the relevant generic filter name: { eq: ... }\\")
              name_IN: [String!] @deprecated(reason: \\"Please use the relevant generic filter name: { in: ... }\\")
              name_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter name: { startsWith: ... }\\")
              typename: [PersonImplementation!]
            }

            interface Production {
              id: ID!
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
              id: SortDirection
              title: SortDirection
            }

            input ProductionUpdateInput {
              id: IDScalarMutations
              id_SET: ID @deprecated(reason: \\"Please use the generic mutation 'id: { set: ... } }' instead.\\")
              title: StringScalarMutations
              title_SET: String @deprecated(reason: \\"Please use the generic mutation 'title: { set: ... } }' instead.\\")
            }

            input ProductionWhere {
              AND: [ProductionWhere!]
              NOT: ProductionWhere
              OR: [ProductionWhere!]
              id: IDScalarFilters
              id_CONTAINS: ID @deprecated(reason: \\"Please use the relevant generic filter id: { contains: ... }\\")
              id_ENDS_WITH: ID @deprecated(reason: \\"Please use the relevant generic filter id: { endsWith: ... }\\")
              id_EQ: ID @deprecated(reason: \\"Please use the relevant generic filter id: { eq: ... }\\")
              id_IN: [ID!] @deprecated(reason: \\"Please use the relevant generic filter id: { in: ... }\\")
              id_STARTS_WITH: ID @deprecated(reason: \\"Please use the relevant generic filter id: { startsWith: ... }\\")
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
              actors(limit: Int!, offset: Int, sort: [ActorSort!], where: ActorWhere): [Actor!]!
              actorsConnection(after: String, first: Int!, sort: [ActorSort!], where: ActorWhere): ActorsConnection!
              movies(limit: Int!, offset: Int, sort: [MovieSort!], where: MovieWhere): [Movie!]!
              moviesConnection(after: String, first: Int!, sort: [MovieSort!], where: MovieWhere): MoviesConnection!
              people(limit: Int!, offset: Int, sort: [PersonSort!], where: PersonWhere): [Person!]!
              peopleConnection(after: String, first: Int!, sort: [PersonSort!], where: PersonWhere): PeopleConnection!
              productions(limit: Int!, offset: Int, sort: [ProductionSort!], where: ProductionWhere): [Production!]!
              productionsConnection(after: String, first: Int!, sort: [ProductionSort!], where: ProductionWhere): ProductionsConnection!
              series(limit: Int!, offset: Int, sort: [SeriesSort!], where: SeriesWhere): [Series!]!
              seriesConnection(after: String, first: Int!, sort: [SeriesSort!], where: SeriesWhere): SeriesConnection!
            }

            type Series implements Production {
              episodes: Int!
              id: ID!
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
              id: ID!
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
              id: SortDirection
              title: SortDirection
            }

            input SeriesUpdateInput {
              episodes: IntScalarMutations
              episodes_DECREMENT: Int @deprecated(reason: \\"Please use the relevant generic mutation 'episodes: { decrement: ... } }' instead.\\")
              episodes_INCREMENT: Int @deprecated(reason: \\"Please use the relevant generic mutation 'episodes: { increment: ... } }' instead.\\")
              episodes_SET: Int @deprecated(reason: \\"Please use the generic mutation 'episodes: { set: ... } }' instead.\\")
              id: IDScalarMutations
              id_SET: ID @deprecated(reason: \\"Please use the generic mutation 'id: { set: ... } }' instead.\\")
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
              id: IDScalarFilters
              id_CONTAINS: ID @deprecated(reason: \\"Please use the relevant generic filter id: { contains: ... }\\")
              id_ENDS_WITH: ID @deprecated(reason: \\"Please use the relevant generic filter id: { endsWith: ... }\\")
              id_EQ: ID @deprecated(reason: \\"Please use the relevant generic filter id: { eq: ... }\\")
              id_IN: [ID!] @deprecated(reason: \\"Please use the relevant generic filter id: { in: ... }\\")
              id_STARTS_WITH: ID @deprecated(reason: \\"Please use the relevant generic filter id: { startsWith: ... }\\")
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

    test("unions", async () => {
        const typeDefs = gql`
            interface Production {
                id: ID!
                title: String!
            }
            type Movie implements Production @node {
                id: ID!
                title: String!
                runtime: Int!
                actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN, properties: "ActedIn")
            }
            type Series implements Production @node {
                id: ID!
                title: String!
                episodes: Int!
            }
            union Contact = Telephone | Email
            type Telephone @node {
                number: String!
            }
            type Email @node {
                address: String!
            }
            type Actor @node {
                id: ID!
                name: String!
                movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT, properties: "ActedIn")
                actedIn: [Production!]! @relationship(type: "ACTED_IN", direction: OUT, properties: "ActedIn")
                contact: [Contact!]! @relationship(type: "HAS_CONTACT", direction: OUT)
            }
            type ActedIn @relationshipProperties {
                screenTime: Int!
            }
        `;
        const neoSchema = new Neo4jGraphQL({ typeDefs, features: { limitRequired: true } });
        const printedSchema = printSchemaWithDirectives(lexicographicSortSchema(await neoSchema.getSchema()));

        expect(printedSchema).toMatchInlineSnapshot(`
            "schema {
              query: Query
              mutation: Mutation
            }

            \\"\\"\\"
            The edge properties for the following fields:
            * Movie.actors
            * Actor.movies
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
              actedIn(limit: Int!, offset: Int, sort: [ProductionSort!], where: ProductionWhere): [Production!]!
              actedInConnection(after: String, first: Int!, sort: [ActorActedInConnectionSort!], where: ActorActedInConnectionWhere): ActorActedInConnection!
              contact(limit: Int!, offset: Int, where: ContactWhere): [Contact!]!
              contactConnection(after: String, first: Int!, where: ActorContactConnectionWhere): ActorContactConnection!
              id: ID!
              movies(limit: Int!, offset: Int, sort: [MovieSort!], where: MovieWhere): [Movie!]!
              moviesConnection(after: String, first: Int!, sort: [ActorMoviesConnectionSort!], where: ActorMoviesConnectionWhere): ActorMoviesConnection!
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

            input ActorConnectInput {
              actedIn: [ActorActedInConnectFieldInput!]
              contact: ActorContactConnectInput
              movies: [ActorMoviesConnectFieldInput!]
            }

            input ActorConnectWhere {
              node: ActorWhere!
            }

            input ActorContactConnectInput {
              Email: [ActorContactEmailConnectFieldInput!]
              Telephone: [ActorContactTelephoneConnectFieldInput!]
            }

            type ActorContactConnection {
              edges: [ActorContactRelationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input ActorContactConnectionFilters {
              \\"\\"\\"
              Return Actors where all of the related ActorContactConnections match this filter
              \\"\\"\\"
              all: ActorContactConnectionWhere
              \\"\\"\\"
              Return Actors where none of the related ActorContactConnections match this filter
              \\"\\"\\"
              none: ActorContactConnectionWhere
              \\"\\"\\"
              Return Actors where one of the related ActorContactConnections match this filter
              \\"\\"\\"
              single: ActorContactConnectionWhere
              \\"\\"\\"
              Return Actors where some of the related ActorContactConnections match this filter
              \\"\\"\\"
              some: ActorContactConnectionWhere
            }

            input ActorContactConnectionWhere {
              Email: ActorContactEmailConnectionWhere
              Telephone: ActorContactTelephoneConnectionWhere
            }

            input ActorContactCreateInput {
              Email: ActorContactEmailFieldInput
              Telephone: ActorContactTelephoneFieldInput
            }

            input ActorContactDeleteInput {
              Email: [ActorContactEmailDeleteFieldInput!]
              Telephone: [ActorContactTelephoneDeleteFieldInput!]
            }

            input ActorContactDisconnectInput {
              Email: [ActorContactEmailDisconnectFieldInput!]
              Telephone: [ActorContactTelephoneDisconnectFieldInput!]
            }

            input ActorContactEmailConnectFieldInput {
              where: EmailConnectWhere
            }

            input ActorContactEmailConnectionWhere {
              AND: [ActorContactEmailConnectionWhere!]
              NOT: ActorContactEmailConnectionWhere
              OR: [ActorContactEmailConnectionWhere!]
              node: EmailWhere
            }

            input ActorContactEmailCreateFieldInput {
              node: EmailCreateInput!
            }

            input ActorContactEmailDeleteFieldInput {
              where: ActorContactEmailConnectionWhere
            }

            input ActorContactEmailDisconnectFieldInput {
              where: ActorContactEmailConnectionWhere
            }

            input ActorContactEmailFieldInput {
              connect: [ActorContactEmailConnectFieldInput!]
              create: [ActorContactEmailCreateFieldInput!]
            }

            input ActorContactEmailUpdateConnectionInput {
              node: EmailUpdateInput
              where: ActorContactEmailConnectionWhere
            }

            input ActorContactEmailUpdateFieldInput {
              connect: [ActorContactEmailConnectFieldInput!]
              create: [ActorContactEmailCreateFieldInput!]
              delete: [ActorContactEmailDeleteFieldInput!]
              disconnect: [ActorContactEmailDisconnectFieldInput!]
              update: ActorContactEmailUpdateConnectionInput
            }

            type ActorContactRelationship {
              cursor: String!
              node: Contact!
            }

            input ActorContactTelephoneConnectFieldInput {
              where: TelephoneConnectWhere
            }

            input ActorContactTelephoneConnectionWhere {
              AND: [ActorContactTelephoneConnectionWhere!]
              NOT: ActorContactTelephoneConnectionWhere
              OR: [ActorContactTelephoneConnectionWhere!]
              node: TelephoneWhere
            }

            input ActorContactTelephoneCreateFieldInput {
              node: TelephoneCreateInput!
            }

            input ActorContactTelephoneDeleteFieldInput {
              where: ActorContactTelephoneConnectionWhere
            }

            input ActorContactTelephoneDisconnectFieldInput {
              where: ActorContactTelephoneConnectionWhere
            }

            input ActorContactTelephoneFieldInput {
              connect: [ActorContactTelephoneConnectFieldInput!]
              create: [ActorContactTelephoneCreateFieldInput!]
            }

            input ActorContactTelephoneUpdateConnectionInput {
              node: TelephoneUpdateInput
              where: ActorContactTelephoneConnectionWhere
            }

            input ActorContactTelephoneUpdateFieldInput {
              connect: [ActorContactTelephoneConnectFieldInput!]
              create: [ActorContactTelephoneCreateFieldInput!]
              delete: [ActorContactTelephoneDeleteFieldInput!]
              disconnect: [ActorContactTelephoneDisconnectFieldInput!]
              update: ActorContactTelephoneUpdateConnectionInput
            }

            input ActorContactUpdateInput {
              Email: [ActorContactEmailUpdateFieldInput!]
              Telephone: [ActorContactTelephoneUpdateFieldInput!]
            }

            input ActorCreateInput {
              actedIn: ActorActedInFieldInput
              contact: ActorContactCreateInput
              id: ID!
              movies: ActorMoviesFieldInput
              name: String!
            }

            input ActorDeleteInput {
              actedIn: [ActorActedInDeleteFieldInput!]
              contact: ActorContactDeleteInput
              movies: [ActorMoviesDeleteFieldInput!]
            }

            input ActorDisconnectInput {
              actedIn: [ActorActedInDisconnectFieldInput!]
              contact: ActorContactDisconnectInput
              movies: [ActorMoviesDisconnectFieldInput!]
            }

            type ActorEdge {
              cursor: String!
              node: Actor!
            }

            type ActorMovieMoviesAggregateSelection {
              count: CountConnection!
              edge: ActorMovieMoviesEdgeAggregateSelection
              node: ActorMovieMoviesNodeAggregateSelection
            }

            type ActorMovieMoviesEdgeAggregateSelection {
              screenTime: IntAggregateSelection!
            }

            type ActorMovieMoviesNodeAggregateSelection {
              runtime: IntAggregateSelection!
              title: StringAggregateSelection!
            }

            input ActorMoviesAggregateInput {
              AND: [ActorMoviesAggregateInput!]
              NOT: ActorMoviesAggregateInput
              OR: [ActorMoviesAggregateInput!]
              count: IntScalarFilters
              count_EQ: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { eq: ... } } }' instead.\\")
              count_GT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gt: ... } } }' instead.\\")
              count_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gte: ... } } }' instead.\\")
              count_LT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lt: ... } } }' instead.\\")
              count_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lte: ... } } }' instead.\\")
              edge: ActedInAggregationWhereInput
              node: ActorMoviesNodeAggregationWhereInput
            }

            input ActorMoviesConnectFieldInput {
              connect: [MovieConnectInput!]
              edge: ActedInCreateInput!
              where: MovieConnectWhere
            }

            type ActorMoviesConnection {
              aggregate: ActorMovieMoviesAggregateSelection!
              edges: [ActorMoviesRelationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input ActorMoviesConnectionAggregateInput {
              AND: [ActorMoviesConnectionAggregateInput!]
              NOT: ActorMoviesConnectionAggregateInput
              OR: [ActorMoviesConnectionAggregateInput!]
              count: ConnectionAggregationCountFilterInput
              edge: ActedInAggregationWhereInput
              node: ActorMoviesNodeAggregationWhereInput
            }

            input ActorMoviesConnectionFilters {
              \\"\\"\\"Filter Actors by aggregating results on related ActorMoviesConnections\\"\\"\\"
              aggregate: ActorMoviesConnectionAggregateInput
              \\"\\"\\"
              Return Actors where all of the related ActorMoviesConnections match this filter
              \\"\\"\\"
              all: ActorMoviesConnectionWhere
              \\"\\"\\"
              Return Actors where none of the related ActorMoviesConnections match this filter
              \\"\\"\\"
              none: ActorMoviesConnectionWhere
              \\"\\"\\"
              Return Actors where one of the related ActorMoviesConnections match this filter
              \\"\\"\\"
              single: ActorMoviesConnectionWhere
              \\"\\"\\"
              Return Actors where some of the related ActorMoviesConnections match this filter
              \\"\\"\\"
              some: ActorMoviesConnectionWhere
            }

            input ActorMoviesConnectionSort {
              edge: ActedInSort
              node: MovieSort
            }

            input ActorMoviesConnectionWhere {
              AND: [ActorMoviesConnectionWhere!]
              NOT: ActorMoviesConnectionWhere
              OR: [ActorMoviesConnectionWhere!]
              edge: ActedInWhere
              node: MovieWhere
            }

            input ActorMoviesCreateFieldInput {
              edge: ActedInCreateInput!
              node: MovieCreateInput!
            }

            input ActorMoviesDeleteFieldInput {
              delete: MovieDeleteInput
              where: ActorMoviesConnectionWhere
            }

            input ActorMoviesDisconnectFieldInput {
              disconnect: MovieDisconnectInput
              where: ActorMoviesConnectionWhere
            }

            input ActorMoviesFieldInput {
              connect: [ActorMoviesConnectFieldInput!]
              create: [ActorMoviesCreateFieldInput!]
            }

            input ActorMoviesNodeAggregationWhereInput {
              AND: [ActorMoviesNodeAggregationWhereInput!]
              NOT: ActorMoviesNodeAggregationWhereInput
              OR: [ActorMoviesNodeAggregationWhereInput!]
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

            type ActorMoviesRelationship {
              cursor: String!
              node: Movie!
              properties: ActedIn!
            }

            input ActorMoviesUpdateConnectionInput {
              edge: ActedInUpdateInput
              node: MovieUpdateInput
              where: ActorMoviesConnectionWhere
            }

            input ActorMoviesUpdateFieldInput {
              connect: [ActorMoviesConnectFieldInput!]
              create: [ActorMoviesCreateFieldInput!]
              delete: [ActorMoviesDeleteFieldInput!]
              disconnect: [ActorMoviesDisconnectFieldInput!]
              update: ActorMoviesUpdateConnectionInput
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
              id: SortDirection
              name: SortDirection
            }

            input ActorUpdateInput {
              actedIn: [ActorActedInUpdateFieldInput!]
              contact: ActorContactUpdateInput
              id: IDScalarMutations
              id_SET: ID @deprecated(reason: \\"Please use the generic mutation 'id: { set: ... } }' instead.\\")
              movies: [ActorMoviesUpdateFieldInput!]
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
              contact: ContactRelationshipFilters
              contactConnection: ActorContactConnectionFilters
              \\"\\"\\"
              Return Actors where all of the related ActorContactConnections match this filter
              \\"\\"\\"
              contactConnection_ALL: ActorContactConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'contactConnection: { all: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Actors where none of the related ActorContactConnections match this filter
              \\"\\"\\"
              contactConnection_NONE: ActorContactConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'contactConnection: { none: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Actors where one of the related ActorContactConnections match this filter
              \\"\\"\\"
              contactConnection_SINGLE: ActorContactConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'contactConnection: { single: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Actors where some of the related ActorContactConnections match this filter
              \\"\\"\\"
              contactConnection_SOME: ActorContactConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'contactConnection: { some: { node: ... } } }' instead.\\")
              \\"\\"\\"Return Actors where all of the related Contacts match this filter\\"\\"\\"
              contact_ALL: ContactWhere @deprecated(reason: \\"Please use the relevant generic filter 'contact: { all: ... }' instead.\\")
              \\"\\"\\"Return Actors where none of the related Contacts match this filter\\"\\"\\"
              contact_NONE: ContactWhere @deprecated(reason: \\"Please use the relevant generic filter 'contact: { none: ... }' instead.\\")
              \\"\\"\\"Return Actors where one of the related Contacts match this filter\\"\\"\\"
              contact_SINGLE: ContactWhere @deprecated(reason: \\"Please use the relevant generic filter 'contact: {  single: ... }' instead.\\")
              \\"\\"\\"Return Actors where some of the related Contacts match this filter\\"\\"\\"
              contact_SOME: ContactWhere @deprecated(reason: \\"Please use the relevant generic filter 'contact: {  some: ... }' instead.\\")
              id: IDScalarFilters
              id_CONTAINS: ID @deprecated(reason: \\"Please use the relevant generic filter id: { contains: ... }\\")
              id_ENDS_WITH: ID @deprecated(reason: \\"Please use the relevant generic filter id: { endsWith: ... }\\")
              id_EQ: ID @deprecated(reason: \\"Please use the relevant generic filter id: { eq: ... }\\")
              id_IN: [ID!] @deprecated(reason: \\"Please use the relevant generic filter id: { in: ... }\\")
              id_STARTS_WITH: ID @deprecated(reason: \\"Please use the relevant generic filter id: { startsWith: ... }\\")
              movies: MovieRelationshipFilters
              moviesAggregate: ActorMoviesAggregateInput @deprecated(reason: \\"Aggregate filters are moved inside the moviesConnection filter, please use { moviesConnection: { aggregate: {...} } } instead\\")
              moviesConnection: ActorMoviesConnectionFilters
              \\"\\"\\"
              Return Actors where all of the related ActorMoviesConnections match this filter
              \\"\\"\\"
              moviesConnection_ALL: ActorMoviesConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'moviesConnection: { all: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Actors where none of the related ActorMoviesConnections match this filter
              \\"\\"\\"
              moviesConnection_NONE: ActorMoviesConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'moviesConnection: { none: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Actors where one of the related ActorMoviesConnections match this filter
              \\"\\"\\"
              moviesConnection_SINGLE: ActorMoviesConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'moviesConnection: { single: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Actors where some of the related ActorMoviesConnections match this filter
              \\"\\"\\"
              moviesConnection_SOME: ActorMoviesConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'moviesConnection: { some: { node: ... } } }' instead.\\")
              \\"\\"\\"Return Actors where all of the related Movies match this filter\\"\\"\\"
              movies_ALL: MovieWhere @deprecated(reason: \\"Please use the relevant generic filter 'movies: { all: ... }' instead.\\")
              \\"\\"\\"Return Actors where none of the related Movies match this filter\\"\\"\\"
              movies_NONE: MovieWhere @deprecated(reason: \\"Please use the relevant generic filter 'movies: { none: ... }' instead.\\")
              \\"\\"\\"Return Actors where one of the related Movies match this filter\\"\\"\\"
              movies_SINGLE: MovieWhere @deprecated(reason: \\"Please use the relevant generic filter 'movies: {  single: ... }' instead.\\")
              \\"\\"\\"Return Actors where some of the related Movies match this filter\\"\\"\\"
              movies_SOME: MovieWhere @deprecated(reason: \\"Please use the relevant generic filter 'movies: {  some: ... }' instead.\\")
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

            union Contact = Email | Telephone

            input ContactRelationshipFilters {
              \\"\\"\\"Filter type where all of the related Contacts match this filter\\"\\"\\"
              all: ContactWhere
              \\"\\"\\"Filter type where none of the related Contacts match this filter\\"\\"\\"
              none: ContactWhere
              \\"\\"\\"Filter type where one of the related Contacts match this filter\\"\\"\\"
              single: ContactWhere
              \\"\\"\\"Filter type where some of the related Contacts match this filter\\"\\"\\"
              some: ContactWhere
            }

            input ContactWhere {
              Email: EmailWhere
              Telephone: TelephoneWhere
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

            type CreateEmailsMutationResponse {
              emails: [Email!]!
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

            type CreateTelephonesMutationResponse {
              info: CreateInfo!
              telephones: [Telephone!]!
            }

            \\"\\"\\"
            Information about the number of nodes and relationships deleted during a delete mutation
            \\"\\"\\"
            type DeleteInfo {
              nodesDeleted: Int!
              relationshipsDeleted: Int!
            }

            type Email {
              address: String!
            }

            type EmailAggregate {
              count: Count!
              node: EmailAggregateNode!
            }

            type EmailAggregateNode {
              address: StringAggregateSelection!
            }

            input EmailConnectWhere {
              node: EmailWhere!
            }

            input EmailCreateInput {
              address: String!
            }

            type EmailEdge {
              cursor: String!
              node: Email!
            }

            \\"\\"\\"
            Fields to sort Emails by. The order in which sorts are applied is not guaranteed when specifying many fields in one EmailSort object.
            \\"\\"\\"
            input EmailSort {
              address: SortDirection
            }

            input EmailUpdateInput {
              address: StringScalarMutations
              address_SET: String @deprecated(reason: \\"Please use the generic mutation 'address: { set: ... } }' instead.\\")
            }

            input EmailWhere {
              AND: [EmailWhere!]
              NOT: EmailWhere
              OR: [EmailWhere!]
              address: StringScalarFilters
              address_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter address: { contains: ... }\\")
              address_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter address: { endsWith: ... }\\")
              address_EQ: String @deprecated(reason: \\"Please use the relevant generic filter address: { eq: ... }\\")
              address_IN: [String!] @deprecated(reason: \\"Please use the relevant generic filter address: { in: ... }\\")
              address_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter address: { startsWith: ... }\\")
            }

            type EmailsConnection {
              aggregate: EmailAggregate!
              edges: [EmailEdge!]!
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
              actors(limit: Int!, offset: Int, sort: [ActorSort!], where: ActorWhere): [Actor!]!
              actorsConnection(after: String, first: Int!, sort: [MovieActorsConnectionSort!], where: MovieActorsConnectionWhere): MovieActorsConnection!
              id: ID!
              runtime: Int!
              title: String!
            }

            type MovieActorActorsAggregateSelection {
              count: CountConnection!
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

            type MovieActorsConnection {
              aggregate: MovieActorActorsAggregateSelection!
              edges: [MovieActorsRelationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
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
              \\"\\"\\"Filter Movies by aggregating results on related MovieActorsConnections\\"\\"\\"
              aggregate: MovieActorsConnectionAggregateInput
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
              edge: ActedInCreateInput!
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

            input MovieActorsUpdateConnectionInput {
              edge: ActedInUpdateInput
              node: ActorUpdateInput
              where: MovieActorsConnectionWhere
            }

            input MovieActorsUpdateFieldInput {
              connect: [MovieActorsConnectFieldInput!]
              create: [MovieActorsCreateFieldInput!]
              delete: [MovieActorsDeleteFieldInput!]
              disconnect: [MovieActorsDisconnectFieldInput!]
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

            input MovieConnectInput {
              actors: [MovieActorsConnectFieldInput!]
            }

            input MovieConnectWhere {
              node: MovieWhere!
            }

            input MovieCreateInput {
              actors: MovieActorsFieldInput
              id: ID!
              runtime: Int!
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

            input MovieRelationshipFilters {
              \\"\\"\\"Filter type where all of the related Movies match this filter\\"\\"\\"
              all: MovieWhere
              \\"\\"\\"Filter type where none of the related Movies match this filter\\"\\"\\"
              none: MovieWhere
              \\"\\"\\"Filter type where one of the related Movies match this filter\\"\\"\\"
              single: MovieWhere
              \\"\\"\\"Filter type where some of the related Movies match this filter\\"\\"\\"
              some: MovieWhere
            }

            \\"\\"\\"
            Fields to sort Movies by. The order in which sorts are applied is not guaranteed when specifying many fields in one MovieSort object.
            \\"\\"\\"
            input MovieSort {
              id: SortDirection
              runtime: SortDirection
              title: SortDirection
            }

            input MovieUpdateInput {
              actors: [MovieActorsUpdateFieldInput!]
              id: IDScalarMutations
              id_SET: ID @deprecated(reason: \\"Please use the generic mutation 'id: { set: ... } }' instead.\\")
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
              Return Movies where all of the related MovieActorsConnections match this filter
              \\"\\"\\"
              actorsConnection_ALL: MovieActorsConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actorsConnection: { all: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Movies where none of the related MovieActorsConnections match this filter
              \\"\\"\\"
              actorsConnection_NONE: MovieActorsConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actorsConnection: { none: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Movies where one of the related MovieActorsConnections match this filter
              \\"\\"\\"
              actorsConnection_SINGLE: MovieActorsConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actorsConnection: { single: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Movies where some of the related MovieActorsConnections match this filter
              \\"\\"\\"
              actorsConnection_SOME: MovieActorsConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actorsConnection: { some: { node: ... } } }' instead.\\")
              \\"\\"\\"Return Movies where all of the related Actors match this filter\\"\\"\\"
              actors_ALL: ActorWhere @deprecated(reason: \\"Please use the relevant generic filter 'actors: { all: ... }' instead.\\")
              \\"\\"\\"Return Movies where none of the related Actors match this filter\\"\\"\\"
              actors_NONE: ActorWhere @deprecated(reason: \\"Please use the relevant generic filter 'actors: { none: ... }' instead.\\")
              \\"\\"\\"Return Movies where one of the related Actors match this filter\\"\\"\\"
              actors_SINGLE: ActorWhere @deprecated(reason: \\"Please use the relevant generic filter 'actors: {  single: ... }' instead.\\")
              \\"\\"\\"Return Movies where some of the related Actors match this filter\\"\\"\\"
              actors_SOME: ActorWhere @deprecated(reason: \\"Please use the relevant generic filter 'actors: {  some: ... }' instead.\\")
              id: IDScalarFilters
              id_CONTAINS: ID @deprecated(reason: \\"Please use the relevant generic filter id: { contains: ... }\\")
              id_ENDS_WITH: ID @deprecated(reason: \\"Please use the relevant generic filter id: { endsWith: ... }\\")
              id_EQ: ID @deprecated(reason: \\"Please use the relevant generic filter id: { eq: ... }\\")
              id_IN: [ID!] @deprecated(reason: \\"Please use the relevant generic filter id: { in: ... }\\")
              id_STARTS_WITH: ID @deprecated(reason: \\"Please use the relevant generic filter id: { startsWith: ... }\\")
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
              createEmails(input: [EmailCreateInput!]!): CreateEmailsMutationResponse!
              createMovies(input: [MovieCreateInput!]!): CreateMoviesMutationResponse!
              createSeries(input: [SeriesCreateInput!]!): CreateSeriesMutationResponse!
              createTelephones(input: [TelephoneCreateInput!]!): CreateTelephonesMutationResponse!
              deleteActors(delete: ActorDeleteInput, where: ActorWhere): DeleteInfo!
              deleteEmails(where: EmailWhere): DeleteInfo!
              deleteMovies(delete: MovieDeleteInput, where: MovieWhere): DeleteInfo!
              deleteSeries(where: SeriesWhere): DeleteInfo!
              deleteTelephones(where: TelephoneWhere): DeleteInfo!
              updateActors(update: ActorUpdateInput, where: ActorWhere): UpdateActorsMutationResponse!
              updateEmails(update: EmailUpdateInput, where: EmailWhere): UpdateEmailsMutationResponse!
              updateMovies(update: MovieUpdateInput, where: MovieWhere): UpdateMoviesMutationResponse!
              updateSeries(update: SeriesUpdateInput, where: SeriesWhere): UpdateSeriesMutationResponse!
              updateTelephones(update: TelephoneUpdateInput, where: TelephoneWhere): UpdateTelephonesMutationResponse!
            }

            \\"\\"\\"Pagination information (Relay)\\"\\"\\"
            type PageInfo {
              endCursor: String
              hasNextPage: Boolean!
              hasPreviousPage: Boolean!
              startCursor: String
            }

            interface Production {
              id: ID!
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
              id: SortDirection
              title: SortDirection
            }

            input ProductionUpdateInput {
              id: IDScalarMutations
              id_SET: ID @deprecated(reason: \\"Please use the generic mutation 'id: { set: ... } }' instead.\\")
              title: StringScalarMutations
              title_SET: String @deprecated(reason: \\"Please use the generic mutation 'title: { set: ... } }' instead.\\")
            }

            input ProductionWhere {
              AND: [ProductionWhere!]
              NOT: ProductionWhere
              OR: [ProductionWhere!]
              id: IDScalarFilters
              id_CONTAINS: ID @deprecated(reason: \\"Please use the relevant generic filter id: { contains: ... }\\")
              id_ENDS_WITH: ID @deprecated(reason: \\"Please use the relevant generic filter id: { endsWith: ... }\\")
              id_EQ: ID @deprecated(reason: \\"Please use the relevant generic filter id: { eq: ... }\\")
              id_IN: [ID!] @deprecated(reason: \\"Please use the relevant generic filter id: { in: ... }\\")
              id_STARTS_WITH: ID @deprecated(reason: \\"Please use the relevant generic filter id: { startsWith: ... }\\")
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
              actors(limit: Int!, offset: Int, sort: [ActorSort!], where: ActorWhere): [Actor!]!
              actorsConnection(after: String, first: Int!, sort: [ActorSort!], where: ActorWhere): ActorsConnection!
              contacts(limit: Int!, offset: Int, where: ContactWhere): [Contact!]!
              emails(limit: Int!, offset: Int, sort: [EmailSort!], where: EmailWhere): [Email!]!
              emailsConnection(after: String, first: Int!, sort: [EmailSort!], where: EmailWhere): EmailsConnection!
              movies(limit: Int!, offset: Int, sort: [MovieSort!], where: MovieWhere): [Movie!]!
              moviesConnection(after: String, first: Int!, sort: [MovieSort!], where: MovieWhere): MoviesConnection!
              productions(limit: Int!, offset: Int, sort: [ProductionSort!], where: ProductionWhere): [Production!]!
              productionsConnection(after: String, first: Int!, sort: [ProductionSort!], where: ProductionWhere): ProductionsConnection!
              series(limit: Int!, offset: Int, sort: [SeriesSort!], where: SeriesWhere): [Series!]!
              seriesConnection(after: String, first: Int!, sort: [SeriesSort!], where: SeriesWhere): SeriesConnection!
              telephones(limit: Int!, offset: Int, sort: [TelephoneSort!], where: TelephoneWhere): [Telephone!]!
              telephonesConnection(after: String, first: Int!, sort: [TelephoneSort!], where: TelephoneWhere): TelephonesConnection!
            }

            type Series implements Production {
              episodes: Int!
              id: ID!
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
              id: ID!
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
              id: SortDirection
              title: SortDirection
            }

            input SeriesUpdateInput {
              episodes: IntScalarMutations
              episodes_DECREMENT: Int @deprecated(reason: \\"Please use the relevant generic mutation 'episodes: { decrement: ... } }' instead.\\")
              episodes_INCREMENT: Int @deprecated(reason: \\"Please use the relevant generic mutation 'episodes: { increment: ... } }' instead.\\")
              episodes_SET: Int @deprecated(reason: \\"Please use the generic mutation 'episodes: { set: ... } }' instead.\\")
              id: IDScalarMutations
              id_SET: ID @deprecated(reason: \\"Please use the generic mutation 'id: { set: ... } }' instead.\\")
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
              id: IDScalarFilters
              id_CONTAINS: ID @deprecated(reason: \\"Please use the relevant generic filter id: { contains: ... }\\")
              id_ENDS_WITH: ID @deprecated(reason: \\"Please use the relevant generic filter id: { endsWith: ... }\\")
              id_EQ: ID @deprecated(reason: \\"Please use the relevant generic filter id: { eq: ... }\\")
              id_IN: [ID!] @deprecated(reason: \\"Please use the relevant generic filter id: { in: ... }\\")
              id_STARTS_WITH: ID @deprecated(reason: \\"Please use the relevant generic filter id: { startsWith: ... }\\")
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

            type Telephone {
              number: String!
            }

            type TelephoneAggregate {
              count: Count!
              node: TelephoneAggregateNode!
            }

            type TelephoneAggregateNode {
              number: StringAggregateSelection!
            }

            input TelephoneConnectWhere {
              node: TelephoneWhere!
            }

            input TelephoneCreateInput {
              number: String!
            }

            type TelephoneEdge {
              cursor: String!
              node: Telephone!
            }

            \\"\\"\\"
            Fields to sort Telephones by. The order in which sorts are applied is not guaranteed when specifying many fields in one TelephoneSort object.
            \\"\\"\\"
            input TelephoneSort {
              number: SortDirection
            }

            input TelephoneUpdateInput {
              number: StringScalarMutations
              number_SET: String @deprecated(reason: \\"Please use the generic mutation 'number: { set: ... } }' instead.\\")
            }

            input TelephoneWhere {
              AND: [TelephoneWhere!]
              NOT: TelephoneWhere
              OR: [TelephoneWhere!]
              number: StringScalarFilters
              number_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter number: { contains: ... }\\")
              number_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter number: { endsWith: ... }\\")
              number_EQ: String @deprecated(reason: \\"Please use the relevant generic filter number: { eq: ... }\\")
              number_IN: [String!] @deprecated(reason: \\"Please use the relevant generic filter number: { in: ... }\\")
              number_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter number: { startsWith: ... }\\")
            }

            type TelephonesConnection {
              aggregate: TelephoneAggregate!
              edges: [TelephoneEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            type UpdateActorsMutationResponse {
              actors: [Actor!]!
              info: UpdateInfo!
            }

            type UpdateEmailsMutationResponse {
              emails: [Email!]!
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
            }

            type UpdateTelephonesMutationResponse {
              info: UpdateInfo!
              telephones: [Telephone!]!
            }"
        `);
    });

    test("@fulltext", async () => {
        const typeDefs = gql`
            type Movie
                @node
                @fulltext(
                    indexes: [
                        { indexName: "MovieTitle", queryName: "moviesByTitle", fields: ["title"] }
                        { indexName: "MovieDescription", queryName: "moviesByDescription", fields: ["description"] }
                    ]
                ) {
                title: String
                description: String
            }
            type Actor @node {
                id: ID!
                name: String!
                movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT, properties: "ActedIn")
            }
            type ActedIn @relationshipProperties {
                screenTime: Int!
            }
        `;
        const neoSchema = new Neo4jGraphQL({ typeDefs, features: { limitRequired: true } });
        const printedSchema = printSchemaWithDirectives(lexicographicSortSchema(await neoSchema.getSchema()));

        expect(printedSchema).toMatchInlineSnapshot(`
            "schema {
              query: Query
              mutation: Mutation
            }

            \\"\\"\\"
            The edge properties for the following fields:
            * Actor.movies
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
              id: ID!
              movies(limit: Int!, offset: Int, sort: [MovieSort!], where: MovieWhere): [Movie!]!
              moviesConnection(after: String, first: Int!, sort: [ActorMoviesConnectionSort!], where: ActorMoviesConnectionWhere): ActorMoviesConnection!
              name: String!
            }

            type ActorAggregate {
              count: Count!
              node: ActorAggregateNode!
            }

            type ActorAggregateNode {
              name: StringAggregateSelection!
            }

            input ActorCreateInput {
              id: ID!
              movies: ActorMoviesFieldInput
              name: String!
            }

            input ActorDeleteInput {
              movies: [ActorMoviesDeleteFieldInput!]
            }

            type ActorEdge {
              cursor: String!
              node: Actor!
            }

            type ActorMovieMoviesAggregateSelection {
              count: CountConnection!
              edge: ActorMovieMoviesEdgeAggregateSelection
              node: ActorMovieMoviesNodeAggregateSelection
            }

            type ActorMovieMoviesEdgeAggregateSelection {
              screenTime: IntAggregateSelection!
            }

            type ActorMovieMoviesNodeAggregateSelection {
              description: StringAggregateSelection!
              title: StringAggregateSelection!
            }

            input ActorMoviesAggregateInput {
              AND: [ActorMoviesAggregateInput!]
              NOT: ActorMoviesAggregateInput
              OR: [ActorMoviesAggregateInput!]
              count: IntScalarFilters
              count_EQ: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { eq: ... } } }' instead.\\")
              count_GT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gt: ... } } }' instead.\\")
              count_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gte: ... } } }' instead.\\")
              count_LT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lt: ... } } }' instead.\\")
              count_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lte: ... } } }' instead.\\")
              edge: ActedInAggregationWhereInput
              node: ActorMoviesNodeAggregationWhereInput
            }

            input ActorMoviesConnectFieldInput {
              edge: ActedInCreateInput!
              where: MovieConnectWhere
            }

            type ActorMoviesConnection {
              aggregate: ActorMovieMoviesAggregateSelection!
              edges: [ActorMoviesRelationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input ActorMoviesConnectionAggregateInput {
              AND: [ActorMoviesConnectionAggregateInput!]
              NOT: ActorMoviesConnectionAggregateInput
              OR: [ActorMoviesConnectionAggregateInput!]
              count: ConnectionAggregationCountFilterInput
              edge: ActedInAggregationWhereInput
              node: ActorMoviesNodeAggregationWhereInput
            }

            input ActorMoviesConnectionFilters {
              \\"\\"\\"Filter Actors by aggregating results on related ActorMoviesConnections\\"\\"\\"
              aggregate: ActorMoviesConnectionAggregateInput
              \\"\\"\\"
              Return Actors where all of the related ActorMoviesConnections match this filter
              \\"\\"\\"
              all: ActorMoviesConnectionWhere
              \\"\\"\\"
              Return Actors where none of the related ActorMoviesConnections match this filter
              \\"\\"\\"
              none: ActorMoviesConnectionWhere
              \\"\\"\\"
              Return Actors where one of the related ActorMoviesConnections match this filter
              \\"\\"\\"
              single: ActorMoviesConnectionWhere
              \\"\\"\\"
              Return Actors where some of the related ActorMoviesConnections match this filter
              \\"\\"\\"
              some: ActorMoviesConnectionWhere
            }

            input ActorMoviesConnectionSort {
              edge: ActedInSort
              node: MovieSort
            }

            input ActorMoviesConnectionWhere {
              AND: [ActorMoviesConnectionWhere!]
              NOT: ActorMoviesConnectionWhere
              OR: [ActorMoviesConnectionWhere!]
              edge: ActedInWhere
              node: MovieWhere
            }

            input ActorMoviesCreateFieldInput {
              edge: ActedInCreateInput!
              node: MovieCreateInput!
            }

            input ActorMoviesDeleteFieldInput {
              where: ActorMoviesConnectionWhere
            }

            input ActorMoviesDisconnectFieldInput {
              where: ActorMoviesConnectionWhere
            }

            input ActorMoviesFieldInput {
              connect: [ActorMoviesConnectFieldInput!]
              create: [ActorMoviesCreateFieldInput!]
            }

            input ActorMoviesNodeAggregationWhereInput {
              AND: [ActorMoviesNodeAggregationWhereInput!]
              NOT: ActorMoviesNodeAggregationWhereInput
              OR: [ActorMoviesNodeAggregationWhereInput!]
              description: StringScalarAggregationFilters
              description_AVERAGE_LENGTH_EQUAL: Float @deprecated(reason: \\"Please use the relevant generic filter 'description: { averageLength: { eq: ... } } }' instead.\\")
              description_AVERAGE_LENGTH_GT: Float @deprecated(reason: \\"Please use the relevant generic filter 'description: { averageLength: { gt: ... } } }' instead.\\")
              description_AVERAGE_LENGTH_GTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'description: { averageLength: { gte: ... } } }' instead.\\")
              description_AVERAGE_LENGTH_LT: Float @deprecated(reason: \\"Please use the relevant generic filter 'description: { averageLength: { lt: ... } } }' instead.\\")
              description_AVERAGE_LENGTH_LTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'description: { averageLength: { lte: ... } } }' instead.\\")
              description_LONGEST_LENGTH_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'description: { longestLength: { eq: ... } } }' instead.\\")
              description_LONGEST_LENGTH_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'description: { longestLength: { gt: ... } } }' instead.\\")
              description_LONGEST_LENGTH_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'description: { longestLength: { gte: ... } } }' instead.\\")
              description_LONGEST_LENGTH_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'description: { longestLength: { lt: ... } } }' instead.\\")
              description_LONGEST_LENGTH_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'description: { longestLength: { lte: ... } } }' instead.\\")
              description_SHORTEST_LENGTH_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'description: { shortestLength: { eq: ... } } }' instead.\\")
              description_SHORTEST_LENGTH_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'description: { shortestLength: { gt: ... } } }' instead.\\")
              description_SHORTEST_LENGTH_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'description: { shortestLength: { gte: ... } } }' instead.\\")
              description_SHORTEST_LENGTH_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'description: { shortestLength: { lt: ... } } }' instead.\\")
              description_SHORTEST_LENGTH_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'description: { shortestLength: { lte: ... } } }' instead.\\")
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

            type ActorMoviesRelationship {
              cursor: String!
              node: Movie!
              properties: ActedIn!
            }

            input ActorMoviesUpdateConnectionInput {
              edge: ActedInUpdateInput
              node: MovieUpdateInput
              where: ActorMoviesConnectionWhere
            }

            input ActorMoviesUpdateFieldInput {
              connect: [ActorMoviesConnectFieldInput!]
              create: [ActorMoviesCreateFieldInput!]
              delete: [ActorMoviesDeleteFieldInput!]
              disconnect: [ActorMoviesDisconnectFieldInput!]
              update: ActorMoviesUpdateConnectionInput
            }

            \\"\\"\\"
            Fields to sort Actors by. The order in which sorts are applied is not guaranteed when specifying many fields in one ActorSort object.
            \\"\\"\\"
            input ActorSort {
              id: SortDirection
              name: SortDirection
            }

            input ActorUpdateInput {
              id: IDScalarMutations
              id_SET: ID @deprecated(reason: \\"Please use the generic mutation 'id: { set: ... } }' instead.\\")
              movies: [ActorMoviesUpdateFieldInput!]
              name: StringScalarMutations
              name_SET: String @deprecated(reason: \\"Please use the generic mutation 'name: { set: ... } }' instead.\\")
            }

            input ActorWhere {
              AND: [ActorWhere!]
              NOT: ActorWhere
              OR: [ActorWhere!]
              id: IDScalarFilters
              id_CONTAINS: ID @deprecated(reason: \\"Please use the relevant generic filter id: { contains: ... }\\")
              id_ENDS_WITH: ID @deprecated(reason: \\"Please use the relevant generic filter id: { endsWith: ... }\\")
              id_EQ: ID @deprecated(reason: \\"Please use the relevant generic filter id: { eq: ... }\\")
              id_IN: [ID!] @deprecated(reason: \\"Please use the relevant generic filter id: { in: ... }\\")
              id_STARTS_WITH: ID @deprecated(reason: \\"Please use the relevant generic filter id: { startsWith: ... }\\")
              movies: MovieRelationshipFilters
              moviesAggregate: ActorMoviesAggregateInput @deprecated(reason: \\"Aggregate filters are moved inside the moviesConnection filter, please use { moviesConnection: { aggregate: {...} } } instead\\")
              moviesConnection: ActorMoviesConnectionFilters
              \\"\\"\\"
              Return Actors where all of the related ActorMoviesConnections match this filter
              \\"\\"\\"
              moviesConnection_ALL: ActorMoviesConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'moviesConnection: { all: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Actors where none of the related ActorMoviesConnections match this filter
              \\"\\"\\"
              moviesConnection_NONE: ActorMoviesConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'moviesConnection: { none: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Actors where one of the related ActorMoviesConnections match this filter
              \\"\\"\\"
              moviesConnection_SINGLE: ActorMoviesConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'moviesConnection: { single: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Actors where some of the related ActorMoviesConnections match this filter
              \\"\\"\\"
              moviesConnection_SOME: ActorMoviesConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'moviesConnection: { some: { node: ... } } }' instead.\\")
              \\"\\"\\"Return Actors where all of the related Movies match this filter\\"\\"\\"
              movies_ALL: MovieWhere @deprecated(reason: \\"Please use the relevant generic filter 'movies: { all: ... }' instead.\\")
              \\"\\"\\"Return Actors where none of the related Movies match this filter\\"\\"\\"
              movies_NONE: MovieWhere @deprecated(reason: \\"Please use the relevant generic filter 'movies: { none: ... }' instead.\\")
              \\"\\"\\"Return Actors where one of the related Movies match this filter\\"\\"\\"
              movies_SINGLE: MovieWhere @deprecated(reason: \\"Please use the relevant generic filter 'movies: {  single: ... }' instead.\\")
              \\"\\"\\"Return Actors where some of the related Movies match this filter\\"\\"\\"
              movies_SOME: MovieWhere @deprecated(reason: \\"Please use the relevant generic filter 'movies: {  some: ... }' instead.\\")
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

            \\"\\"\\"The input for filtering a float\\"\\"\\"
            input FloatWhere {
              max: Float
              min: Float
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

            type Movie {
              description: String
              title: String
            }

            type MovieAggregate {
              count: Count!
              node: MovieAggregateNode!
            }

            type MovieAggregateNode {
              description: StringAggregateSelection!
              title: StringAggregateSelection!
            }

            input MovieConnectWhere {
              node: MovieWhere!
            }

            input MovieCreateInput {
              description: String
              title: String
            }

            type MovieEdge {
              cursor: String!
              node: Movie!
            }

            type MovieIndexEdge {
              cursor: String!
              node: Movie!
              score: Float!
            }

            \\"\\"\\"The input for sorting a Fulltext query on an index of Movie\\"\\"\\"
            input MovieIndexSort {
              node: MovieSort
              score: SortDirection
            }

            \\"\\"\\"The input for filtering a full-text query on an index of Movie\\"\\"\\"
            input MovieIndexWhere {
              node: MovieWhere
              score: FloatWhere
            }

            input MovieRelationshipFilters {
              \\"\\"\\"Filter type where all of the related Movies match this filter\\"\\"\\"
              all: MovieWhere
              \\"\\"\\"Filter type where none of the related Movies match this filter\\"\\"\\"
              none: MovieWhere
              \\"\\"\\"Filter type where one of the related Movies match this filter\\"\\"\\"
              single: MovieWhere
              \\"\\"\\"Filter type where some of the related Movies match this filter\\"\\"\\"
              some: MovieWhere
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
              description_SET: String @deprecated(reason: \\"Please use the generic mutation 'description: { set: ... } }' instead.\\")
              title: StringScalarMutations
              title_SET: String @deprecated(reason: \\"Please use the generic mutation 'title: { set: ... } }' instead.\\")
            }

            input MovieWhere {
              AND: [MovieWhere!]
              NOT: MovieWhere
              OR: [MovieWhere!]
              description: StringScalarFilters
              description_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter description: { contains: ... }\\")
              description_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter description: { endsWith: ... }\\")
              description_EQ: String @deprecated(reason: \\"Please use the relevant generic filter description: { eq: ... }\\")
              description_IN: [String] @deprecated(reason: \\"Please use the relevant generic filter description: { in: ... }\\")
              description_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter description: { startsWith: ... }\\")
              title: StringScalarFilters
              title_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter title: { contains: ... }\\")
              title_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter title: { endsWith: ... }\\")
              title_EQ: String @deprecated(reason: \\"Please use the relevant generic filter title: { eq: ... }\\")
              title_IN: [String] @deprecated(reason: \\"Please use the relevant generic filter title: { in: ... }\\")
              title_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter title: { startsWith: ... }\\")
            }

            type MoviesConnection {
              aggregate: MovieAggregate!
              edges: [MovieEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            type MoviesIndexConnection {
              edges: [MovieIndexEdge!]!
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
              actors(limit: Int!, offset: Int, sort: [ActorSort!], where: ActorWhere): [Actor!]!
              actorsConnection(after: String, first: Int!, sort: [ActorSort!], where: ActorWhere): ActorsConnection!
              movies(limit: Int!, offset: Int, sort: [MovieSort!], where: MovieWhere): [Movie!]!
              moviesByDescription(after: String, first: Int!, phrase: String!, sort: [MovieIndexSort!], where: MovieIndexWhere): MoviesIndexConnection!
              moviesByTitle(after: String, first: Int!, phrase: String!, sort: [MovieIndexSort!], where: MovieIndexWhere): MoviesIndexConnection!
              moviesConnection(after: String, first: Int!, sort: [MovieSort!], where: MovieWhere): MoviesConnection!
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
            }"
        `);
    });

    test("@vector", async () => {
        const typeDefs = gql`
            type Movie
                @node
                @vector(
                    indexes: [
                        { indexName: "MovieTitle", embeddingProperty: "title", queryName: "titleQuery" }
                        {
                            indexName: "MovieDescription"
                            embeddingProperty: "description"
                            queryName: "descriptionQuery"
                        }
                    ]
                ) {
                title: String
                description: String
            }
            type Actor @node {
                id: ID!
                name: String!
                movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT, properties: "ActedIn")
            }
            type ActedIn @relationshipProperties {
                screenTime: Int!
            }
        `;
        const neoSchema = new Neo4jGraphQL({ typeDefs, features: { limitRequired: true } });
        const printedSchema = printSchemaWithDirectives(lexicographicSortSchema(await neoSchema.getSchema()));

        expect(printedSchema).toMatchInlineSnapshot(`
            "schema {
              query: Query
              mutation: Mutation
            }

            \\"\\"\\"
            The edge properties for the following fields:
            * Actor.movies
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
              id: ID!
              movies(limit: Int!, offset: Int, sort: [MovieSort!], where: MovieWhere): [Movie!]!
              moviesConnection(after: String, first: Int!, sort: [ActorMoviesConnectionSort!], where: ActorMoviesConnectionWhere): ActorMoviesConnection!
              name: String!
            }

            type ActorAggregate {
              count: Count!
              node: ActorAggregateNode!
            }

            type ActorAggregateNode {
              name: StringAggregateSelection!
            }

            input ActorCreateInput {
              id: ID!
              movies: ActorMoviesFieldInput
              name: String!
            }

            input ActorDeleteInput {
              movies: [ActorMoviesDeleteFieldInput!]
            }

            type ActorEdge {
              cursor: String!
              node: Actor!
            }

            type ActorMovieMoviesAggregateSelection {
              count: CountConnection!
              edge: ActorMovieMoviesEdgeAggregateSelection
              node: ActorMovieMoviesNodeAggregateSelection
            }

            type ActorMovieMoviesEdgeAggregateSelection {
              screenTime: IntAggregateSelection!
            }

            type ActorMovieMoviesNodeAggregateSelection {
              description: StringAggregateSelection!
              title: StringAggregateSelection!
            }

            input ActorMoviesAggregateInput {
              AND: [ActorMoviesAggregateInput!]
              NOT: ActorMoviesAggregateInput
              OR: [ActorMoviesAggregateInput!]
              count: IntScalarFilters
              count_EQ: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { eq: ... } } }' instead.\\")
              count_GT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gt: ... } } }' instead.\\")
              count_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gte: ... } } }' instead.\\")
              count_LT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lt: ... } } }' instead.\\")
              count_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lte: ... } } }' instead.\\")
              edge: ActedInAggregationWhereInput
              node: ActorMoviesNodeAggregationWhereInput
            }

            input ActorMoviesConnectFieldInput {
              edge: ActedInCreateInput!
              where: MovieConnectWhere
            }

            type ActorMoviesConnection {
              aggregate: ActorMovieMoviesAggregateSelection!
              edges: [ActorMoviesRelationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input ActorMoviesConnectionAggregateInput {
              AND: [ActorMoviesConnectionAggregateInput!]
              NOT: ActorMoviesConnectionAggregateInput
              OR: [ActorMoviesConnectionAggregateInput!]
              count: ConnectionAggregationCountFilterInput
              edge: ActedInAggregationWhereInput
              node: ActorMoviesNodeAggregationWhereInput
            }

            input ActorMoviesConnectionFilters {
              \\"\\"\\"Filter Actors by aggregating results on related ActorMoviesConnections\\"\\"\\"
              aggregate: ActorMoviesConnectionAggregateInput
              \\"\\"\\"
              Return Actors where all of the related ActorMoviesConnections match this filter
              \\"\\"\\"
              all: ActorMoviesConnectionWhere
              \\"\\"\\"
              Return Actors where none of the related ActorMoviesConnections match this filter
              \\"\\"\\"
              none: ActorMoviesConnectionWhere
              \\"\\"\\"
              Return Actors where one of the related ActorMoviesConnections match this filter
              \\"\\"\\"
              single: ActorMoviesConnectionWhere
              \\"\\"\\"
              Return Actors where some of the related ActorMoviesConnections match this filter
              \\"\\"\\"
              some: ActorMoviesConnectionWhere
            }

            input ActorMoviesConnectionSort {
              edge: ActedInSort
              node: MovieSort
            }

            input ActorMoviesConnectionWhere {
              AND: [ActorMoviesConnectionWhere!]
              NOT: ActorMoviesConnectionWhere
              OR: [ActorMoviesConnectionWhere!]
              edge: ActedInWhere
              node: MovieWhere
            }

            input ActorMoviesCreateFieldInput {
              edge: ActedInCreateInput!
              node: MovieCreateInput!
            }

            input ActorMoviesDeleteFieldInput {
              where: ActorMoviesConnectionWhere
            }

            input ActorMoviesDisconnectFieldInput {
              where: ActorMoviesConnectionWhere
            }

            input ActorMoviesFieldInput {
              connect: [ActorMoviesConnectFieldInput!]
              create: [ActorMoviesCreateFieldInput!]
            }

            input ActorMoviesNodeAggregationWhereInput {
              AND: [ActorMoviesNodeAggregationWhereInput!]
              NOT: ActorMoviesNodeAggregationWhereInput
              OR: [ActorMoviesNodeAggregationWhereInput!]
              description: StringScalarAggregationFilters
              description_AVERAGE_LENGTH_EQUAL: Float @deprecated(reason: \\"Please use the relevant generic filter 'description: { averageLength: { eq: ... } } }' instead.\\")
              description_AVERAGE_LENGTH_GT: Float @deprecated(reason: \\"Please use the relevant generic filter 'description: { averageLength: { gt: ... } } }' instead.\\")
              description_AVERAGE_LENGTH_GTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'description: { averageLength: { gte: ... } } }' instead.\\")
              description_AVERAGE_LENGTH_LT: Float @deprecated(reason: \\"Please use the relevant generic filter 'description: { averageLength: { lt: ... } } }' instead.\\")
              description_AVERAGE_LENGTH_LTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'description: { averageLength: { lte: ... } } }' instead.\\")
              description_LONGEST_LENGTH_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'description: { longestLength: { eq: ... } } }' instead.\\")
              description_LONGEST_LENGTH_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'description: { longestLength: { gt: ... } } }' instead.\\")
              description_LONGEST_LENGTH_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'description: { longestLength: { gte: ... } } }' instead.\\")
              description_LONGEST_LENGTH_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'description: { longestLength: { lt: ... } } }' instead.\\")
              description_LONGEST_LENGTH_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'description: { longestLength: { lte: ... } } }' instead.\\")
              description_SHORTEST_LENGTH_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'description: { shortestLength: { eq: ... } } }' instead.\\")
              description_SHORTEST_LENGTH_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'description: { shortestLength: { gt: ... } } }' instead.\\")
              description_SHORTEST_LENGTH_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'description: { shortestLength: { gte: ... } } }' instead.\\")
              description_SHORTEST_LENGTH_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'description: { shortestLength: { lt: ... } } }' instead.\\")
              description_SHORTEST_LENGTH_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'description: { shortestLength: { lte: ... } } }' instead.\\")
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

            type ActorMoviesRelationship {
              cursor: String!
              node: Movie!
              properties: ActedIn!
            }

            input ActorMoviesUpdateConnectionInput {
              edge: ActedInUpdateInput
              node: MovieUpdateInput
              where: ActorMoviesConnectionWhere
            }

            input ActorMoviesUpdateFieldInput {
              connect: [ActorMoviesConnectFieldInput!]
              create: [ActorMoviesCreateFieldInput!]
              delete: [ActorMoviesDeleteFieldInput!]
              disconnect: [ActorMoviesDisconnectFieldInput!]
              update: ActorMoviesUpdateConnectionInput
            }

            \\"\\"\\"
            Fields to sort Actors by. The order in which sorts are applied is not guaranteed when specifying many fields in one ActorSort object.
            \\"\\"\\"
            input ActorSort {
              id: SortDirection
              name: SortDirection
            }

            input ActorUpdateInput {
              id: IDScalarMutations
              id_SET: ID @deprecated(reason: \\"Please use the generic mutation 'id: { set: ... } }' instead.\\")
              movies: [ActorMoviesUpdateFieldInput!]
              name: StringScalarMutations
              name_SET: String @deprecated(reason: \\"Please use the generic mutation 'name: { set: ... } }' instead.\\")
            }

            input ActorWhere {
              AND: [ActorWhere!]
              NOT: ActorWhere
              OR: [ActorWhere!]
              id: IDScalarFilters
              id_CONTAINS: ID @deprecated(reason: \\"Please use the relevant generic filter id: { contains: ... }\\")
              id_ENDS_WITH: ID @deprecated(reason: \\"Please use the relevant generic filter id: { endsWith: ... }\\")
              id_EQ: ID @deprecated(reason: \\"Please use the relevant generic filter id: { eq: ... }\\")
              id_IN: [ID!] @deprecated(reason: \\"Please use the relevant generic filter id: { in: ... }\\")
              id_STARTS_WITH: ID @deprecated(reason: \\"Please use the relevant generic filter id: { startsWith: ... }\\")
              movies: MovieRelationshipFilters
              moviesAggregate: ActorMoviesAggregateInput @deprecated(reason: \\"Aggregate filters are moved inside the moviesConnection filter, please use { moviesConnection: { aggregate: {...} } } instead\\")
              moviesConnection: ActorMoviesConnectionFilters
              \\"\\"\\"
              Return Actors where all of the related ActorMoviesConnections match this filter
              \\"\\"\\"
              moviesConnection_ALL: ActorMoviesConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'moviesConnection: { all: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Actors where none of the related ActorMoviesConnections match this filter
              \\"\\"\\"
              moviesConnection_NONE: ActorMoviesConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'moviesConnection: { none: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Actors where one of the related ActorMoviesConnections match this filter
              \\"\\"\\"
              moviesConnection_SINGLE: ActorMoviesConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'moviesConnection: { single: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Actors where some of the related ActorMoviesConnections match this filter
              \\"\\"\\"
              moviesConnection_SOME: ActorMoviesConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'moviesConnection: { some: { node: ... } } }' instead.\\")
              \\"\\"\\"Return Actors where all of the related Movies match this filter\\"\\"\\"
              movies_ALL: MovieWhere @deprecated(reason: \\"Please use the relevant generic filter 'movies: { all: ... }' instead.\\")
              \\"\\"\\"Return Actors where none of the related Movies match this filter\\"\\"\\"
              movies_NONE: MovieWhere @deprecated(reason: \\"Please use the relevant generic filter 'movies: { none: ... }' instead.\\")
              \\"\\"\\"Return Actors where one of the related Movies match this filter\\"\\"\\"
              movies_SINGLE: MovieWhere @deprecated(reason: \\"Please use the relevant generic filter 'movies: {  single: ... }' instead.\\")
              \\"\\"\\"Return Actors where some of the related Movies match this filter\\"\\"\\"
              movies_SOME: MovieWhere @deprecated(reason: \\"Please use the relevant generic filter 'movies: {  some: ... }' instead.\\")
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

            \\"\\"\\"The input for filtering a float\\"\\"\\"
            input FloatWhere {
              max: Float
              min: Float
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

            type Movie {
              description: String
              title: String
            }

            type MovieAggregate {
              count: Count!
              node: MovieAggregateNode!
            }

            type MovieAggregateNode {
              description: StringAggregateSelection!
              title: StringAggregateSelection!
            }

            input MovieConnectWhere {
              node: MovieWhere!
            }

            input MovieCreateInput {
              description: String
              title: String
            }

            type MovieEdge {
              cursor: String!
              node: Movie!
            }

            type MovieIndexEdge {
              cursor: String!
              node: Movie!
              score: Float!
            }

            \\"\\"\\"The input for sorting a Vector query on an index of Movie\\"\\"\\"
            input MovieIndexSort {
              node: MovieSort
              score: SortDirection
            }

            \\"\\"\\"The input for filtering a Vector query on an index of Movie\\"\\"\\"
            input MovieIndexWhere {
              node: MovieWhere
              score: FloatWhere
            }

            input MovieRelationshipFilters {
              \\"\\"\\"Filter type where all of the related Movies match this filter\\"\\"\\"
              all: MovieWhere
              \\"\\"\\"Filter type where none of the related Movies match this filter\\"\\"\\"
              none: MovieWhere
              \\"\\"\\"Filter type where one of the related Movies match this filter\\"\\"\\"
              single: MovieWhere
              \\"\\"\\"Filter type where some of the related Movies match this filter\\"\\"\\"
              some: MovieWhere
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
              description_SET: String @deprecated(reason: \\"Please use the generic mutation 'description: { set: ... } }' instead.\\")
              title: StringScalarMutations
              title_SET: String @deprecated(reason: \\"Please use the generic mutation 'title: { set: ... } }' instead.\\")
            }

            input MovieWhere {
              AND: [MovieWhere!]
              NOT: MovieWhere
              OR: [MovieWhere!]
              description: StringScalarFilters
              description_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter description: { contains: ... }\\")
              description_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter description: { endsWith: ... }\\")
              description_EQ: String @deprecated(reason: \\"Please use the relevant generic filter description: { eq: ... }\\")
              description_IN: [String] @deprecated(reason: \\"Please use the relevant generic filter description: { in: ... }\\")
              description_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter description: { startsWith: ... }\\")
              title: StringScalarFilters
              title_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter title: { contains: ... }\\")
              title_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter title: { endsWith: ... }\\")
              title_EQ: String @deprecated(reason: \\"Please use the relevant generic filter title: { eq: ... }\\")
              title_IN: [String] @deprecated(reason: \\"Please use the relevant generic filter title: { in: ... }\\")
              title_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter title: { startsWith: ... }\\")
            }

            type MoviesConnection {
              aggregate: MovieAggregate!
              edges: [MovieEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            type MoviesIndexConnection {
              edges: [MovieIndexEdge!]!
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
              actors(limit: Int!, offset: Int, sort: [ActorSort!], where: ActorWhere): [Actor!]!
              actorsConnection(after: String, first: Int!, sort: [ActorSort!], where: ActorWhere): ActorsConnection!
              descriptionQuery(after: String, first: Int!, sort: [MovieIndexSort!], vector: [Float!], where: MovieIndexWhere): MoviesIndexConnection!
              movies(limit: Int!, offset: Int, sort: [MovieSort!], where: MovieWhere): [Movie!]!
              moviesConnection(after: String, first: Int!, sort: [MovieSort!], where: MovieWhere): MoviesConnection!
              titleQuery(after: String, first: Int!, sort: [MovieIndexSort!], vector: [Float!], where: MovieIndexWhere): MoviesIndexConnection!
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
            }"
        `);
    });
});
