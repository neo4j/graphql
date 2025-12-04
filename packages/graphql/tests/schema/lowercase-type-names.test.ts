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

describe("lower case type names", () => {
    test("should generate a valid schema", async () => {
        const typeDefs = gql`
            type movie @node {
                name: String
                year: Int
                createdAt: DateTime
                testId: String
                actors: [actor!]! @relationship(type: "ACTED_IN", direction: IN)
            }

            type actor @node {
                name: String
                year: Int
                createdAt: DateTime
                movies: [movie!]! @relationship(type: "ACTED_IN", direction: OUT)
            }
        `;

        const neoSchema = new Neo4jGraphQL({ typeDefs });
        const printedSchema = printSchemaWithDirectives(lexicographicSortSchema(await neoSchema.getSchema()));

        expect(printedSchema).toMatchInlineSnapshot(`
            "schema {
              query: Query
              mutation: Mutation
            }

            type ActorsConnection {
              aggregate: actorAggregate!
              edges: [actorEdge!]!
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
              actors: [actor!]!
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
              movies: [movie!]!
            }

            \\"\\"\\"A date and time, represented as an ISO-8601 string\\"\\"\\"
            scalar DateTime

            type DateTimeAggregateSelection {
              max: DateTime
              min: DateTime
            }

            \\"\\"\\"Filters for an aggregation of an DateTime input field\\"\\"\\"
            input DateTimeScalarAggregationFilters {
              max: DateTimeScalarFilters
              min: DateTimeScalarFilters
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

            type MoviesConnection {
              aggregate: movieAggregate!
              edges: [movieEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            type Mutation {
              createActors(input: [actorCreateInput!]!): CreateActorsMutationResponse!
              createMovies(input: [movieCreateInput!]!): CreateMoviesMutationResponse!
              deleteActors(delete: actorDeleteInput, where: actorWhere): DeleteInfo!
              deleteMovies(delete: movieDeleteInput, where: movieWhere): DeleteInfo!
              updateActors(update: actorUpdateInput, where: actorWhere): UpdateActorsMutationResponse!
              updateMovies(update: movieUpdateInput, where: movieWhere): UpdateMoviesMutationResponse!
            }

            \\"\\"\\"Pagination information (Relay)\\"\\"\\"
            type PageInfo {
              endCursor: String
              hasNextPage: Boolean!
              hasPreviousPage: Boolean!
              startCursor: String
            }

            type Query {
              actors(limit: Int, offset: Int, sort: [actorSort!], where: actorWhere): [actor!]!
              actorsConnection(after: String, first: Int, sort: [actorSort!], where: actorWhere): ActorsConnection!
              movies(limit: Int, offset: Int, sort: [movieSort!], where: movieWhere): [movie!]!
              moviesConnection(after: String, first: Int, sort: [movieSort!], where: movieWhere): MoviesConnection!
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
              actors: [actor!]!
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
              movies: [movie!]!
            }

            type actor {
              createdAt: DateTime
              movies(limit: Int, offset: Int, sort: [movieSort!], where: movieWhere): [movie!]!
              moviesConnection(after: String, first: Int, sort: [actorMoviesConnectionSort!], where: actorMoviesConnectionWhere): actorMoviesConnection!
              name: String
              year: Int
            }

            type actorAggregate {
              count: Count!
              node: actorAggregateNode!
            }

            type actorAggregateNode {
              createdAt: DateTimeAggregateSelection!
              name: StringAggregateSelection!
              year: IntAggregateSelection!
            }

            input actorConnectInput {
              movies: [actorMoviesConnectFieldInput!]
            }

            input actorConnectWhere {
              node: actorWhere!
            }

            input actorCreateInput {
              createdAt: DateTime
              movies: actorMoviesFieldInput
              name: String
              year: Int
            }

            input actorDeleteInput {
              movies: [actorMoviesDeleteFieldInput!]
            }

            input actorDisconnectInput {
              movies: [actorMoviesDisconnectFieldInput!]
            }

            type actorEdge {
              cursor: String!
              node: actor!
            }

            input actorMoviesAggregateInput {
              AND: [actorMoviesAggregateInput!]
              NOT: actorMoviesAggregateInput
              OR: [actorMoviesAggregateInput!]
              count: IntScalarFilters
              count_EQ: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { eq: ... } } }' instead.\\")
              count_GT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gt: ... } } }' instead.\\")
              count_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gte: ... } } }' instead.\\")
              count_LT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lt: ... } } }' instead.\\")
              count_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lte: ... } } }' instead.\\")
              node: actorMoviesNodeAggregationWhereInput
            }

            input actorMoviesConnectFieldInput {
              connect: [movieConnectInput!]
              where: movieConnectWhere
            }

            type actorMoviesConnection {
              aggregate: actormovieMoviesAggregateSelection!
              edges: [actorMoviesRelationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input actorMoviesConnectionAggregateInput {
              AND: [actorMoviesConnectionAggregateInput!]
              NOT: actorMoviesConnectionAggregateInput
              OR: [actorMoviesConnectionAggregateInput!]
              count: ConnectionAggregationCountFilterInput
              node: actorMoviesNodeAggregationWhereInput
            }

            input actorMoviesConnectionFilters {
              \\"\\"\\"Filter actors by aggregating results on related actorMoviesConnections\\"\\"\\"
              aggregate: actorMoviesConnectionAggregateInput
              \\"\\"\\"
              Return actors where all of the related actorMoviesConnections match this filter
              \\"\\"\\"
              all: actorMoviesConnectionWhere
              \\"\\"\\"
              Return actors where none of the related actorMoviesConnections match this filter
              \\"\\"\\"
              none: actorMoviesConnectionWhere
              \\"\\"\\"
              Return actors where one of the related actorMoviesConnections match this filter
              \\"\\"\\"
              single: actorMoviesConnectionWhere
              \\"\\"\\"
              Return actors where some of the related actorMoviesConnections match this filter
              \\"\\"\\"
              some: actorMoviesConnectionWhere
            }

            input actorMoviesConnectionSort {
              node: movieSort
            }

            input actorMoviesConnectionWhere {
              AND: [actorMoviesConnectionWhere!]
              NOT: actorMoviesConnectionWhere
              OR: [actorMoviesConnectionWhere!]
              node: movieWhere
            }

            input actorMoviesCreateFieldInput {
              node: movieCreateInput!
            }

            input actorMoviesDeleteFieldInput {
              delete: movieDeleteInput
              where: actorMoviesConnectionWhere
            }

            input actorMoviesDisconnectFieldInput {
              disconnect: movieDisconnectInput
              where: actorMoviesConnectionWhere
            }

            input actorMoviesFieldInput {
              connect: [actorMoviesConnectFieldInput!]
              create: [actorMoviesCreateFieldInput!]
            }

            input actorMoviesNodeAggregationWhereInput {
              AND: [actorMoviesNodeAggregationWhereInput!]
              NOT: actorMoviesNodeAggregationWhereInput
              OR: [actorMoviesNodeAggregationWhereInput!]
              createdAt: DateTimeScalarAggregationFilters
              createdAt_MAX_EQUAL: DateTime @deprecated(reason: \\"Please use the relevant generic filter 'createdAt: { max: { eq: ... } } }' instead.\\")
              createdAt_MAX_GT: DateTime @deprecated(reason: \\"Please use the relevant generic filter 'createdAt: { max: { gt: ... } } }' instead.\\")
              createdAt_MAX_GTE: DateTime @deprecated(reason: \\"Please use the relevant generic filter 'createdAt: { max: { gte: ... } } }' instead.\\")
              createdAt_MAX_LT: DateTime @deprecated(reason: \\"Please use the relevant generic filter 'createdAt: { max: { lt: ... } } }' instead.\\")
              createdAt_MAX_LTE: DateTime @deprecated(reason: \\"Please use the relevant generic filter 'createdAt: { max: { lte: ... } } }' instead.\\")
              createdAt_MIN_EQUAL: DateTime @deprecated(reason: \\"Please use the relevant generic filter 'createdAt: { min: { eq: ... } } }' instead.\\")
              createdAt_MIN_GT: DateTime @deprecated(reason: \\"Please use the relevant generic filter 'createdAt: { min: { gt: ... } } }' instead.\\")
              createdAt_MIN_GTE: DateTime @deprecated(reason: \\"Please use the relevant generic filter 'createdAt: { min: { gte: ... } } }' instead.\\")
              createdAt_MIN_LT: DateTime @deprecated(reason: \\"Please use the relevant generic filter 'createdAt: { min: { lt: ... } } }' instead.\\")
              createdAt_MIN_LTE: DateTime @deprecated(reason: \\"Please use the relevant generic filter 'createdAt: { min: { lte: ... } } }' instead.\\")
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
              testId: StringScalarAggregationFilters
              testId_AVERAGE_LENGTH_EQUAL: Float @deprecated(reason: \\"Please use the relevant generic filter 'testId: { averageLength: { eq: ... } } }' instead.\\")
              testId_AVERAGE_LENGTH_GT: Float @deprecated(reason: \\"Please use the relevant generic filter 'testId: { averageLength: { gt: ... } } }' instead.\\")
              testId_AVERAGE_LENGTH_GTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'testId: { averageLength: { gte: ... } } }' instead.\\")
              testId_AVERAGE_LENGTH_LT: Float @deprecated(reason: \\"Please use the relevant generic filter 'testId: { averageLength: { lt: ... } } }' instead.\\")
              testId_AVERAGE_LENGTH_LTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'testId: { averageLength: { lte: ... } } }' instead.\\")
              testId_LONGEST_LENGTH_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'testId: { longestLength: { eq: ... } } }' instead.\\")
              testId_LONGEST_LENGTH_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'testId: { longestLength: { gt: ... } } }' instead.\\")
              testId_LONGEST_LENGTH_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'testId: { longestLength: { gte: ... } } }' instead.\\")
              testId_LONGEST_LENGTH_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'testId: { longestLength: { lt: ... } } }' instead.\\")
              testId_LONGEST_LENGTH_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'testId: { longestLength: { lte: ... } } }' instead.\\")
              testId_SHORTEST_LENGTH_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'testId: { shortestLength: { eq: ... } } }' instead.\\")
              testId_SHORTEST_LENGTH_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'testId: { shortestLength: { gt: ... } } }' instead.\\")
              testId_SHORTEST_LENGTH_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'testId: { shortestLength: { gte: ... } } }' instead.\\")
              testId_SHORTEST_LENGTH_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'testId: { shortestLength: { lt: ... } } }' instead.\\")
              testId_SHORTEST_LENGTH_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'testId: { shortestLength: { lte: ... } } }' instead.\\")
              year: IntScalarAggregationFilters
              year_AVERAGE_EQUAL: Float @deprecated(reason: \\"Please use the relevant generic filter 'year: { average: { eq: ... } } }' instead.\\")
              year_AVERAGE_GT: Float @deprecated(reason: \\"Please use the relevant generic filter 'year: { average: { gt: ... } } }' instead.\\")
              year_AVERAGE_GTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'year: { average: { gte: ... } } }' instead.\\")
              year_AVERAGE_LT: Float @deprecated(reason: \\"Please use the relevant generic filter 'year: { average: { lt: ... } } }' instead.\\")
              year_AVERAGE_LTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'year: { average: { lte: ... } } }' instead.\\")
              year_MAX_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'year: { max: { eq: ... } } }' instead.\\")
              year_MAX_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'year: { max: { gt: ... } } }' instead.\\")
              year_MAX_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'year: { max: { gte: ... } } }' instead.\\")
              year_MAX_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'year: { max: { lt: ... } } }' instead.\\")
              year_MAX_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'year: { max: { lte: ... } } }' instead.\\")
              year_MIN_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'year: { min: { eq: ... } } }' instead.\\")
              year_MIN_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'year: { min: { gt: ... } } }' instead.\\")
              year_MIN_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'year: { min: { gte: ... } } }' instead.\\")
              year_MIN_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'year: { min: { lt: ... } } }' instead.\\")
              year_MIN_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'year: { min: { lte: ... } } }' instead.\\")
              year_SUM_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'year: { sum: { eq: ... } } }' instead.\\")
              year_SUM_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'year: { sum: { gt: ... } } }' instead.\\")
              year_SUM_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'year: { sum: { gte: ... } } }' instead.\\")
              year_SUM_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'year: { sum: { lt: ... } } }' instead.\\")
              year_SUM_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'year: { sum: { lte: ... } } }' instead.\\")
            }

            type actorMoviesRelationship {
              cursor: String!
              node: movie!
            }

            input actorMoviesUpdateConnectionInput {
              node: movieUpdateInput
              where: actorMoviesConnectionWhere
            }

            input actorMoviesUpdateFieldInput {
              connect: [actorMoviesConnectFieldInput!]
              create: [actorMoviesCreateFieldInput!]
              delete: [actorMoviesDeleteFieldInput!]
              disconnect: [actorMoviesDisconnectFieldInput!]
              update: actorMoviesUpdateConnectionInput
            }

            input actorRelationshipFilters {
              \\"\\"\\"Filter type where all of the related actors match this filter\\"\\"\\"
              all: actorWhere
              \\"\\"\\"Filter type where none of the related actors match this filter\\"\\"\\"
              none: actorWhere
              \\"\\"\\"Filter type where one of the related actors match this filter\\"\\"\\"
              single: actorWhere
              \\"\\"\\"Filter type where some of the related actors match this filter\\"\\"\\"
              some: actorWhere
            }

            \\"\\"\\"
            Fields to sort Actors by. The order in which sorts are applied is not guaranteed when specifying many fields in one actorSort object.
            \\"\\"\\"
            input actorSort {
              createdAt: SortDirection
              name: SortDirection
              year: SortDirection
            }

            input actorUpdateInput {
              createdAt: DateTimeScalarMutations
              createdAt_SET: DateTime @deprecated(reason: \\"Please use the generic mutation 'createdAt: { set: ... } }' instead.\\")
              movies: [actorMoviesUpdateFieldInput!]
              name: StringScalarMutations
              name_SET: String @deprecated(reason: \\"Please use the generic mutation 'name: { set: ... } }' instead.\\")
              year: IntScalarMutations
              year_DECREMENT: Int @deprecated(reason: \\"Please use the relevant generic mutation 'year: { decrement: ... } }' instead.\\")
              year_INCREMENT: Int @deprecated(reason: \\"Please use the relevant generic mutation 'year: { increment: ... } }' instead.\\")
              year_SET: Int @deprecated(reason: \\"Please use the generic mutation 'year: { set: ... } }' instead.\\")
            }

            input actorWhere {
              AND: [actorWhere!]
              NOT: actorWhere
              OR: [actorWhere!]
              createdAt: DateTimeScalarFilters
              createdAt_EQ: DateTime @deprecated(reason: \\"Please use the relevant generic filter createdAt: { eq: ... }\\")
              createdAt_GT: DateTime @deprecated(reason: \\"Please use the relevant generic filter createdAt: { gt: ... }\\")
              createdAt_GTE: DateTime @deprecated(reason: \\"Please use the relevant generic filter createdAt: { gte: ... }\\")
              createdAt_IN: [DateTime] @deprecated(reason: \\"Please use the relevant generic filter createdAt: { in: ... }\\")
              createdAt_LT: DateTime @deprecated(reason: \\"Please use the relevant generic filter createdAt: { lt: ... }\\")
              createdAt_LTE: DateTime @deprecated(reason: \\"Please use the relevant generic filter createdAt: { lte: ... }\\")
              movies: movieRelationshipFilters
              moviesAggregate: actorMoviesAggregateInput @deprecated(reason: \\"Aggregate filters are moved inside the moviesConnection filter, please use { moviesConnection: { aggregate: {...} } } instead\\")
              moviesConnection: actorMoviesConnectionFilters
              \\"\\"\\"
              Return actors where all of the related actorMoviesConnections match this filter
              \\"\\"\\"
              moviesConnection_ALL: actorMoviesConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'moviesConnection: { all: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return actors where none of the related actorMoviesConnections match this filter
              \\"\\"\\"
              moviesConnection_NONE: actorMoviesConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'moviesConnection: { none: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return actors where one of the related actorMoviesConnections match this filter
              \\"\\"\\"
              moviesConnection_SINGLE: actorMoviesConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'moviesConnection: { single: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return actors where some of the related actorMoviesConnections match this filter
              \\"\\"\\"
              moviesConnection_SOME: actorMoviesConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'moviesConnection: { some: { node: ... } } }' instead.\\")
              \\"\\"\\"Return actors where all of the related movies match this filter\\"\\"\\"
              movies_ALL: movieWhere @deprecated(reason: \\"Please use the relevant generic filter 'movies: { all: ... }' instead.\\")
              \\"\\"\\"Return actors where none of the related movies match this filter\\"\\"\\"
              movies_NONE: movieWhere @deprecated(reason: \\"Please use the relevant generic filter 'movies: { none: ... }' instead.\\")
              \\"\\"\\"Return actors where one of the related movies match this filter\\"\\"\\"
              movies_SINGLE: movieWhere @deprecated(reason: \\"Please use the relevant generic filter 'movies: {  single: ... }' instead.\\")
              \\"\\"\\"Return actors where some of the related movies match this filter\\"\\"\\"
              movies_SOME: movieWhere @deprecated(reason: \\"Please use the relevant generic filter 'movies: {  some: ... }' instead.\\")
              name: StringScalarFilters
              name_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter name: { contains: ... }\\")
              name_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter name: { endsWith: ... }\\")
              name_EQ: String @deprecated(reason: \\"Please use the relevant generic filter name: { eq: ... }\\")
              name_IN: [String] @deprecated(reason: \\"Please use the relevant generic filter name: { in: ... }\\")
              name_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter name: { startsWith: ... }\\")
              year: IntScalarFilters
              year_EQ: Int @deprecated(reason: \\"Please use the relevant generic filter year: { eq: ... }\\")
              year_GT: Int @deprecated(reason: \\"Please use the relevant generic filter year: { gt: ... }\\")
              year_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter year: { gte: ... }\\")
              year_IN: [Int] @deprecated(reason: \\"Please use the relevant generic filter year: { in: ... }\\")
              year_LT: Int @deprecated(reason: \\"Please use the relevant generic filter year: { lt: ... }\\")
              year_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter year: { lte: ... }\\")
            }

            type actormovieMoviesAggregateSelection {
              count: CountConnection!
              node: actormovieMoviesNodeAggregateSelection
            }

            type actormovieMoviesNodeAggregateSelection {
              createdAt: DateTimeAggregateSelection!
              name: StringAggregateSelection!
              testId: StringAggregateSelection!
              year: IntAggregateSelection!
            }

            type movie {
              actors(limit: Int, offset: Int, sort: [actorSort!], where: actorWhere): [actor!]!
              actorsConnection(after: String, first: Int, sort: [movieActorsConnectionSort!], where: movieActorsConnectionWhere): movieActorsConnection!
              createdAt: DateTime
              name: String
              testId: String
              year: Int
            }

            input movieActorsAggregateInput {
              AND: [movieActorsAggregateInput!]
              NOT: movieActorsAggregateInput
              OR: [movieActorsAggregateInput!]
              count: IntScalarFilters
              count_EQ: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { eq: ... } } }' instead.\\")
              count_GT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gt: ... } } }' instead.\\")
              count_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gte: ... } } }' instead.\\")
              count_LT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lt: ... } } }' instead.\\")
              count_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lte: ... } } }' instead.\\")
              node: movieActorsNodeAggregationWhereInput
            }

            input movieActorsConnectFieldInput {
              connect: [actorConnectInput!]
              where: actorConnectWhere
            }

            type movieActorsConnection {
              aggregate: movieactorActorsAggregateSelection!
              edges: [movieActorsRelationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input movieActorsConnectionAggregateInput {
              AND: [movieActorsConnectionAggregateInput!]
              NOT: movieActorsConnectionAggregateInput
              OR: [movieActorsConnectionAggregateInput!]
              count: ConnectionAggregationCountFilterInput
              node: movieActorsNodeAggregationWhereInput
            }

            input movieActorsConnectionFilters {
              \\"\\"\\"Filter movies by aggregating results on related movieActorsConnections\\"\\"\\"
              aggregate: movieActorsConnectionAggregateInput
              \\"\\"\\"
              Return movies where all of the related movieActorsConnections match this filter
              \\"\\"\\"
              all: movieActorsConnectionWhere
              \\"\\"\\"
              Return movies where none of the related movieActorsConnections match this filter
              \\"\\"\\"
              none: movieActorsConnectionWhere
              \\"\\"\\"
              Return movies where one of the related movieActorsConnections match this filter
              \\"\\"\\"
              single: movieActorsConnectionWhere
              \\"\\"\\"
              Return movies where some of the related movieActorsConnections match this filter
              \\"\\"\\"
              some: movieActorsConnectionWhere
            }

            input movieActorsConnectionSort {
              node: actorSort
            }

            input movieActorsConnectionWhere {
              AND: [movieActorsConnectionWhere!]
              NOT: movieActorsConnectionWhere
              OR: [movieActorsConnectionWhere!]
              node: actorWhere
            }

            input movieActorsCreateFieldInput {
              node: actorCreateInput!
            }

            input movieActorsDeleteFieldInput {
              delete: actorDeleteInput
              where: movieActorsConnectionWhere
            }

            input movieActorsDisconnectFieldInput {
              disconnect: actorDisconnectInput
              where: movieActorsConnectionWhere
            }

            input movieActorsFieldInput {
              connect: [movieActorsConnectFieldInput!]
              create: [movieActorsCreateFieldInput!]
            }

            input movieActorsNodeAggregationWhereInput {
              AND: [movieActorsNodeAggregationWhereInput!]
              NOT: movieActorsNodeAggregationWhereInput
              OR: [movieActorsNodeAggregationWhereInput!]
              createdAt: DateTimeScalarAggregationFilters
              createdAt_MAX_EQUAL: DateTime @deprecated(reason: \\"Please use the relevant generic filter 'createdAt: { max: { eq: ... } } }' instead.\\")
              createdAt_MAX_GT: DateTime @deprecated(reason: \\"Please use the relevant generic filter 'createdAt: { max: { gt: ... } } }' instead.\\")
              createdAt_MAX_GTE: DateTime @deprecated(reason: \\"Please use the relevant generic filter 'createdAt: { max: { gte: ... } } }' instead.\\")
              createdAt_MAX_LT: DateTime @deprecated(reason: \\"Please use the relevant generic filter 'createdAt: { max: { lt: ... } } }' instead.\\")
              createdAt_MAX_LTE: DateTime @deprecated(reason: \\"Please use the relevant generic filter 'createdAt: { max: { lte: ... } } }' instead.\\")
              createdAt_MIN_EQUAL: DateTime @deprecated(reason: \\"Please use the relevant generic filter 'createdAt: { min: { eq: ... } } }' instead.\\")
              createdAt_MIN_GT: DateTime @deprecated(reason: \\"Please use the relevant generic filter 'createdAt: { min: { gt: ... } } }' instead.\\")
              createdAt_MIN_GTE: DateTime @deprecated(reason: \\"Please use the relevant generic filter 'createdAt: { min: { gte: ... } } }' instead.\\")
              createdAt_MIN_LT: DateTime @deprecated(reason: \\"Please use the relevant generic filter 'createdAt: { min: { lt: ... } } }' instead.\\")
              createdAt_MIN_LTE: DateTime @deprecated(reason: \\"Please use the relevant generic filter 'createdAt: { min: { lte: ... } } }' instead.\\")
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
              year: IntScalarAggregationFilters
              year_AVERAGE_EQUAL: Float @deprecated(reason: \\"Please use the relevant generic filter 'year: { average: { eq: ... } } }' instead.\\")
              year_AVERAGE_GT: Float @deprecated(reason: \\"Please use the relevant generic filter 'year: { average: { gt: ... } } }' instead.\\")
              year_AVERAGE_GTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'year: { average: { gte: ... } } }' instead.\\")
              year_AVERAGE_LT: Float @deprecated(reason: \\"Please use the relevant generic filter 'year: { average: { lt: ... } } }' instead.\\")
              year_AVERAGE_LTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'year: { average: { lte: ... } } }' instead.\\")
              year_MAX_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'year: { max: { eq: ... } } }' instead.\\")
              year_MAX_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'year: { max: { gt: ... } } }' instead.\\")
              year_MAX_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'year: { max: { gte: ... } } }' instead.\\")
              year_MAX_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'year: { max: { lt: ... } } }' instead.\\")
              year_MAX_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'year: { max: { lte: ... } } }' instead.\\")
              year_MIN_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'year: { min: { eq: ... } } }' instead.\\")
              year_MIN_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'year: { min: { gt: ... } } }' instead.\\")
              year_MIN_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'year: { min: { gte: ... } } }' instead.\\")
              year_MIN_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'year: { min: { lt: ... } } }' instead.\\")
              year_MIN_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'year: { min: { lte: ... } } }' instead.\\")
              year_SUM_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'year: { sum: { eq: ... } } }' instead.\\")
              year_SUM_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'year: { sum: { gt: ... } } }' instead.\\")
              year_SUM_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'year: { sum: { gte: ... } } }' instead.\\")
              year_SUM_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'year: { sum: { lt: ... } } }' instead.\\")
              year_SUM_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'year: { sum: { lte: ... } } }' instead.\\")
            }

            type movieActorsRelationship {
              cursor: String!
              node: actor!
            }

            input movieActorsUpdateConnectionInput {
              node: actorUpdateInput
              where: movieActorsConnectionWhere
            }

            input movieActorsUpdateFieldInput {
              connect: [movieActorsConnectFieldInput!]
              create: [movieActorsCreateFieldInput!]
              delete: [movieActorsDeleteFieldInput!]
              disconnect: [movieActorsDisconnectFieldInput!]
              update: movieActorsUpdateConnectionInput
            }

            type movieAggregate {
              count: Count!
              node: movieAggregateNode!
            }

            type movieAggregateNode {
              createdAt: DateTimeAggregateSelection!
              name: StringAggregateSelection!
              testId: StringAggregateSelection!
              year: IntAggregateSelection!
            }

            input movieConnectInput {
              actors: [movieActorsConnectFieldInput!]
            }

            input movieConnectWhere {
              node: movieWhere!
            }

            input movieCreateInput {
              actors: movieActorsFieldInput
              createdAt: DateTime
              name: String
              testId: String
              year: Int
            }

            input movieDeleteInput {
              actors: [movieActorsDeleteFieldInput!]
            }

            input movieDisconnectInput {
              actors: [movieActorsDisconnectFieldInput!]
            }

            type movieEdge {
              cursor: String!
              node: movie!
            }

            input movieRelationshipFilters {
              \\"\\"\\"Filter type where all of the related movies match this filter\\"\\"\\"
              all: movieWhere
              \\"\\"\\"Filter type where none of the related movies match this filter\\"\\"\\"
              none: movieWhere
              \\"\\"\\"Filter type where one of the related movies match this filter\\"\\"\\"
              single: movieWhere
              \\"\\"\\"Filter type where some of the related movies match this filter\\"\\"\\"
              some: movieWhere
            }

            \\"\\"\\"
            Fields to sort Movies by. The order in which sorts are applied is not guaranteed when specifying many fields in one movieSort object.
            \\"\\"\\"
            input movieSort {
              createdAt: SortDirection
              name: SortDirection
              testId: SortDirection
              year: SortDirection
            }

            input movieUpdateInput {
              actors: [movieActorsUpdateFieldInput!]
              createdAt: DateTimeScalarMutations
              createdAt_SET: DateTime @deprecated(reason: \\"Please use the generic mutation 'createdAt: { set: ... } }' instead.\\")
              name: StringScalarMutations
              name_SET: String @deprecated(reason: \\"Please use the generic mutation 'name: { set: ... } }' instead.\\")
              testId: StringScalarMutations
              testId_SET: String @deprecated(reason: \\"Please use the generic mutation 'testId: { set: ... } }' instead.\\")
              year: IntScalarMutations
              year_DECREMENT: Int @deprecated(reason: \\"Please use the relevant generic mutation 'year: { decrement: ... } }' instead.\\")
              year_INCREMENT: Int @deprecated(reason: \\"Please use the relevant generic mutation 'year: { increment: ... } }' instead.\\")
              year_SET: Int @deprecated(reason: \\"Please use the generic mutation 'year: { set: ... } }' instead.\\")
            }

            input movieWhere {
              AND: [movieWhere!]
              NOT: movieWhere
              OR: [movieWhere!]
              actors: actorRelationshipFilters
              actorsAggregate: movieActorsAggregateInput @deprecated(reason: \\"Aggregate filters are moved inside the actorsConnection filter, please use { actorsConnection: { aggregate: {...} } } instead\\")
              actorsConnection: movieActorsConnectionFilters
              \\"\\"\\"
              Return movies where all of the related movieActorsConnections match this filter
              \\"\\"\\"
              actorsConnection_ALL: movieActorsConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actorsConnection: { all: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return movies where none of the related movieActorsConnections match this filter
              \\"\\"\\"
              actorsConnection_NONE: movieActorsConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actorsConnection: { none: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return movies where one of the related movieActorsConnections match this filter
              \\"\\"\\"
              actorsConnection_SINGLE: movieActorsConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actorsConnection: { single: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return movies where some of the related movieActorsConnections match this filter
              \\"\\"\\"
              actorsConnection_SOME: movieActorsConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actorsConnection: { some: { node: ... } } }' instead.\\")
              \\"\\"\\"Return movies where all of the related actors match this filter\\"\\"\\"
              actors_ALL: actorWhere @deprecated(reason: \\"Please use the relevant generic filter 'actors: { all: ... }' instead.\\")
              \\"\\"\\"Return movies where none of the related actors match this filter\\"\\"\\"
              actors_NONE: actorWhere @deprecated(reason: \\"Please use the relevant generic filter 'actors: { none: ... }' instead.\\")
              \\"\\"\\"Return movies where one of the related actors match this filter\\"\\"\\"
              actors_SINGLE: actorWhere @deprecated(reason: \\"Please use the relevant generic filter 'actors: {  single: ... }' instead.\\")
              \\"\\"\\"Return movies where some of the related actors match this filter\\"\\"\\"
              actors_SOME: actorWhere @deprecated(reason: \\"Please use the relevant generic filter 'actors: {  some: ... }' instead.\\")
              createdAt: DateTimeScalarFilters
              createdAt_EQ: DateTime @deprecated(reason: \\"Please use the relevant generic filter createdAt: { eq: ... }\\")
              createdAt_GT: DateTime @deprecated(reason: \\"Please use the relevant generic filter createdAt: { gt: ... }\\")
              createdAt_GTE: DateTime @deprecated(reason: \\"Please use the relevant generic filter createdAt: { gte: ... }\\")
              createdAt_IN: [DateTime] @deprecated(reason: \\"Please use the relevant generic filter createdAt: { in: ... }\\")
              createdAt_LT: DateTime @deprecated(reason: \\"Please use the relevant generic filter createdAt: { lt: ... }\\")
              createdAt_LTE: DateTime @deprecated(reason: \\"Please use the relevant generic filter createdAt: { lte: ... }\\")
              name: StringScalarFilters
              name_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter name: { contains: ... }\\")
              name_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter name: { endsWith: ... }\\")
              name_EQ: String @deprecated(reason: \\"Please use the relevant generic filter name: { eq: ... }\\")
              name_IN: [String] @deprecated(reason: \\"Please use the relevant generic filter name: { in: ... }\\")
              name_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter name: { startsWith: ... }\\")
              testId: StringScalarFilters
              testId_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter testId: { contains: ... }\\")
              testId_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter testId: { endsWith: ... }\\")
              testId_EQ: String @deprecated(reason: \\"Please use the relevant generic filter testId: { eq: ... }\\")
              testId_IN: [String] @deprecated(reason: \\"Please use the relevant generic filter testId: { in: ... }\\")
              testId_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter testId: { startsWith: ... }\\")
              year: IntScalarFilters
              year_EQ: Int @deprecated(reason: \\"Please use the relevant generic filter year: { eq: ... }\\")
              year_GT: Int @deprecated(reason: \\"Please use the relevant generic filter year: { gt: ... }\\")
              year_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter year: { gte: ... }\\")
              year_IN: [Int] @deprecated(reason: \\"Please use the relevant generic filter year: { in: ... }\\")
              year_LT: Int @deprecated(reason: \\"Please use the relevant generic filter year: { lt: ... }\\")
              year_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter year: { lte: ... }\\")
            }

            type movieactorActorsAggregateSelection {
              count: CountConnection!
              node: movieactorActorsNodeAggregateSelection
            }

            type movieactorActorsNodeAggregateSelection {
              createdAt: DateTimeAggregateSelection!
              name: StringAggregateSelection!
              year: IntAggregateSelection!
            }"
        `);
    });
});
