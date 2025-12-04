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
import { TestCDCEngine } from "../utils/builders/TestCDCEngine";

describe("Subscriptions", () => {
    test("Subscriptions", async () => {
        const typeDefs = gql`
            type Movie @node {
                id: ID
                actorCount: Int
                averageRating: Float
                isActive: Boolean
                actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN)
            }

            type Actor @node {
                name: String!
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
            }

            type Actor {
              name: String!
            }

            type ActorAggregate {
              count: Count!
              node: ActorAggregateNode!
            }

            type ActorAggregateNode {
              name: StringAggregateSelection!
            }

            input ActorConnectWhere {
              node: ActorWhere!
            }

            input ActorCreateInput {
              name: String!
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

            \\"\\"\\"
            Fields to sort Actors by. The order in which sorts are applied is not guaranteed when specifying many fields in one ActorSort object.
            \\"\\"\\"
            input ActorSort {
              name: SortDirection
            }

            input ActorUpdateInput {
              name: StringScalarMutations
              name_SET: String @deprecated(reason: \\"Please use the generic mutation 'name: { set: ... } }' instead.\\")
            }

            input ActorWhere {
              AND: [ActorWhere!]
              NOT: ActorWhere
              OR: [ActorWhere!]
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

            \\"\\"\\"Boolean filters\\"\\"\\"
            input BooleanScalarFilters {
              eq: Boolean
            }

            \\"\\"\\"Boolean mutations\\"\\"\\"
            input BooleanScalarMutations {
              set: Boolean
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

            type FloatAggregateSelection {
              average: Float
              max: Float
              min: Float
              sum: Float
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
              actorCount: Int
              actors(limit: Int, offset: Int, sort: [ActorSort!], where: ActorWhere): [Actor!]!
              actorsConnection(after: String, first: Int, sort: [MovieActorsConnectionSort!], where: MovieActorsConnectionWhere): MovieActorsConnection!
              averageRating: Float
              id: ID
              isActive: Boolean
            }

            type MovieActorActorsAggregateSelection {
              count: CountConnection!
              node: MovieActorActorsNodeAggregateSelection
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
              node: MovieActorsNodeAggregationWhereInput
            }

            input MovieActorsConnectFieldInput {
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
              node: ActorSort
            }

            input MovieActorsConnectionWhere {
              AND: [MovieActorsConnectionWhere!]
              NOT: MovieActorsConnectionWhere
              OR: [MovieActorsConnectionWhere!]
              node: ActorWhere
            }

            input MovieActorsCreateFieldInput {
              node: ActorCreateInput!
            }

            input MovieActorsDeleteFieldInput {
              where: MovieActorsConnectionWhere
            }

            input MovieActorsDisconnectFieldInput {
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
            }

            input MovieActorsUpdateConnectionInput {
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
              actorCount: IntAggregateSelection!
              averageRating: FloatAggregateSelection!
            }

            input MovieCreateInput {
              actorCount: Int
              actors: MovieActorsFieldInput
              averageRating: Float
              id: ID
              isActive: Boolean
            }

            input MovieDeleteInput {
              actors: [MovieActorsDeleteFieldInput!]
            }

            type MovieEdge {
              cursor: String!
              node: Movie!
            }

            \\"\\"\\"
            Fields to sort Movies by. The order in which sorts are applied is not guaranteed when specifying many fields in one MovieSort object.
            \\"\\"\\"
            input MovieSort {
              actorCount: SortDirection
              averageRating: SortDirection
              id: SortDirection
              isActive: SortDirection
            }

            input MovieUpdateInput {
              actorCount: IntScalarMutations
              actorCount_DECREMENT: Int @deprecated(reason: \\"Please use the relevant generic mutation 'actorCount: { decrement: ... } }' instead.\\")
              actorCount_INCREMENT: Int @deprecated(reason: \\"Please use the relevant generic mutation 'actorCount: { increment: ... } }' instead.\\")
              actorCount_SET: Int @deprecated(reason: \\"Please use the generic mutation 'actorCount: { set: ... } }' instead.\\")
              actors: [MovieActorsUpdateFieldInput!]
              averageRating: FloatScalarMutations
              averageRating_ADD: Float @deprecated(reason: \\"Please use the relevant generic mutation 'averageRating: { add: ... } }' instead.\\")
              averageRating_DIVIDE: Float @deprecated(reason: \\"Please use the relevant generic mutation 'averageRating: { divide: ... } }' instead.\\")
              averageRating_MULTIPLY: Float @deprecated(reason: \\"Please use the relevant generic mutation 'averageRating: { multiply: ... } }' instead.\\")
              averageRating_SET: Float @deprecated(reason: \\"Please use the generic mutation 'averageRating: { set: ... } }' instead.\\")
              averageRating_SUBTRACT: Float @deprecated(reason: \\"Please use the relevant generic mutation 'averageRating: { subtract: ... } }' instead.\\")
              id: IDScalarMutations
              id_SET: ID @deprecated(reason: \\"Please use the generic mutation 'id: { set: ... } }' instead.\\")
              isActive: BooleanScalarMutations
              isActive_SET: Boolean @deprecated(reason: \\"Please use the generic mutation 'isActive: { set: ... } }' instead.\\")
            }

            input MovieWhere {
              AND: [MovieWhere!]
              NOT: MovieWhere
              OR: [MovieWhere!]
              actorCount: IntScalarFilters
              actorCount_EQ: Int @deprecated(reason: \\"Please use the relevant generic filter actorCount: { eq: ... }\\")
              actorCount_GT: Int @deprecated(reason: \\"Please use the relevant generic filter actorCount: { gt: ... }\\")
              actorCount_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter actorCount: { gte: ... }\\")
              actorCount_IN: [Int] @deprecated(reason: \\"Please use the relevant generic filter actorCount: { in: ... }\\")
              actorCount_LT: Int @deprecated(reason: \\"Please use the relevant generic filter actorCount: { lt: ... }\\")
              actorCount_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter actorCount: { lte: ... }\\")
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
              averageRating: FloatScalarFilters
              averageRating_EQ: Float @deprecated(reason: \\"Please use the relevant generic filter averageRating: { eq: ... }\\")
              averageRating_GT: Float @deprecated(reason: \\"Please use the relevant generic filter averageRating: { gt: ... }\\")
              averageRating_GTE: Float @deprecated(reason: \\"Please use the relevant generic filter averageRating: { gte: ... }\\")
              averageRating_IN: [Float] @deprecated(reason: \\"Please use the relevant generic filter averageRating: { in: ... }\\")
              averageRating_LT: Float @deprecated(reason: \\"Please use the relevant generic filter averageRating: { lt: ... }\\")
              averageRating_LTE: Float @deprecated(reason: \\"Please use the relevant generic filter averageRating: { lte: ... }\\")
              id: IDScalarFilters
              id_CONTAINS: ID @deprecated(reason: \\"Please use the relevant generic filter id: { contains: ... }\\")
              id_ENDS_WITH: ID @deprecated(reason: \\"Please use the relevant generic filter id: { endsWith: ... }\\")
              id_EQ: ID @deprecated(reason: \\"Please use the relevant generic filter id: { eq: ... }\\")
              id_IN: [ID] @deprecated(reason: \\"Please use the relevant generic filter id: { in: ... }\\")
              id_STARTS_WITH: ID @deprecated(reason: \\"Please use the relevant generic filter id: { startsWith: ... }\\")
              isActive: BooleanScalarFilters
              isActive_EQ: Boolean @deprecated(reason: \\"Please use the relevant generic filter isActive: { eq: ... }\\")
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
              deleteActors(where: ActorWhere): DeleteInfo!
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

            type Query {
              actors(limit: Int, offset: Int, sort: [ActorSort!], where: ActorWhere): [Actor!]!
              actorsConnection(after: String, first: Int, sort: [ActorSort!], where: ActorWhere): ActorsConnection!
              movies(limit: Int, offset: Int, sort: [MovieSort!], where: MovieWhere): [Movie!]!
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

    test("Empty EventPayload type", async () => {
        const typeDefs = gql`
            type Movie @node {
                id: ID
                actorCount: Int
                averageRating: Float
                isActive: Boolean
                actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN)
            }

            type Actor @node {
                movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT)
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
            }

            type Actor {
              movies(limit: Int, offset: Int, sort: [MovieSort!], where: MovieWhere): [Movie!]!
              moviesConnection(after: String, first: Int, sort: [ActorMoviesConnectionSort!], where: ActorMoviesConnectionWhere): ActorMoviesConnection!
            }

            type ActorAggregate {
              count: Count!
            }

            input ActorConnectInput {
              movies: [ActorMoviesConnectFieldInput!]
            }

            input ActorConnectWhere {
              node: ActorWhere!
            }

            input ActorCreateInput {
              movies: ActorMoviesFieldInput
            }

            input ActorDeleteInput {
              movies: [ActorMoviesDeleteFieldInput!]
            }

            input ActorDisconnectInput {
              movies: [ActorMoviesDisconnectFieldInput!]
            }

            type ActorEdge {
              cursor: String!
              node: Actor!
            }

            type ActorMovieMoviesAggregateSelection {
              count: CountConnection!
              node: ActorMovieMoviesNodeAggregateSelection
            }

            type ActorMovieMoviesNodeAggregateSelection {
              actorCount: IntAggregateSelection!
              averageRating: FloatAggregateSelection!
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
              node: ActorMoviesNodeAggregationWhereInput
            }

            input ActorMoviesConnectFieldInput {
              connect: [MovieConnectInput!]
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
              node: MovieSort
            }

            input ActorMoviesConnectionWhere {
              AND: [ActorMoviesConnectionWhere!]
              NOT: ActorMoviesConnectionWhere
              OR: [ActorMoviesConnectionWhere!]
              node: MovieWhere
            }

            input ActorMoviesCreateFieldInput {
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
              actorCount: IntScalarAggregationFilters
              actorCount_AVERAGE_EQUAL: Float @deprecated(reason: \\"Please use the relevant generic filter 'actorCount: { average: { eq: ... } } }' instead.\\")
              actorCount_AVERAGE_GT: Float @deprecated(reason: \\"Please use the relevant generic filter 'actorCount: { average: { gt: ... } } }' instead.\\")
              actorCount_AVERAGE_GTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'actorCount: { average: { gte: ... } } }' instead.\\")
              actorCount_AVERAGE_LT: Float @deprecated(reason: \\"Please use the relevant generic filter 'actorCount: { average: { lt: ... } } }' instead.\\")
              actorCount_AVERAGE_LTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'actorCount: { average: { lte: ... } } }' instead.\\")
              actorCount_MAX_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'actorCount: { max: { eq: ... } } }' instead.\\")
              actorCount_MAX_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'actorCount: { max: { gt: ... } } }' instead.\\")
              actorCount_MAX_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'actorCount: { max: { gte: ... } } }' instead.\\")
              actorCount_MAX_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'actorCount: { max: { lt: ... } } }' instead.\\")
              actorCount_MAX_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'actorCount: { max: { lte: ... } } }' instead.\\")
              actorCount_MIN_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'actorCount: { min: { eq: ... } } }' instead.\\")
              actorCount_MIN_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'actorCount: { min: { gt: ... } } }' instead.\\")
              actorCount_MIN_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'actorCount: { min: { gte: ... } } }' instead.\\")
              actorCount_MIN_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'actorCount: { min: { lt: ... } } }' instead.\\")
              actorCount_MIN_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'actorCount: { min: { lte: ... } } }' instead.\\")
              actorCount_SUM_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'actorCount: { sum: { eq: ... } } }' instead.\\")
              actorCount_SUM_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'actorCount: { sum: { gt: ... } } }' instead.\\")
              actorCount_SUM_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'actorCount: { sum: { gte: ... } } }' instead.\\")
              actorCount_SUM_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'actorCount: { sum: { lt: ... } } }' instead.\\")
              actorCount_SUM_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'actorCount: { sum: { lte: ... } } }' instead.\\")
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
            }

            type ActorMoviesRelationship {
              cursor: String!
              node: Movie!
            }

            input ActorMoviesUpdateConnectionInput {
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

            input ActorUpdateInput {
              movies: [ActorMoviesUpdateFieldInput!]
            }

            input ActorWhere {
              AND: [ActorWhere!]
              NOT: ActorWhere
              OR: [ActorWhere!]
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
            }

            type ActorsConnection {
              aggregate: ActorAggregate!
              edges: [ActorEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            \\"\\"\\"Boolean filters\\"\\"\\"
            input BooleanScalarFilters {
              eq: Boolean
            }

            \\"\\"\\"Boolean mutations\\"\\"\\"
            input BooleanScalarMutations {
              set: Boolean
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

            type FloatAggregateSelection {
              average: Float
              max: Float
              min: Float
              sum: Float
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
              actorCount: Int
              actors(limit: Int, offset: Int, where: ActorWhere): [Actor!]!
              actorsConnection(after: String, first: Int, where: MovieActorsConnectionWhere): MovieActorsConnection!
              averageRating: Float
              id: ID
              isActive: Boolean
            }

            type MovieActorActorsAggregateSelection {
              count: CountConnection!
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
            }

            input MovieActorsConnectFieldInput {
              connect: [ActorConnectInput!]
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

            input MovieActorsConnectionWhere {
              AND: [MovieActorsConnectionWhere!]
              NOT: MovieActorsConnectionWhere
              OR: [MovieActorsConnectionWhere!]
              node: ActorWhere
            }

            input MovieActorsCreateFieldInput {
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

            type MovieActorsRelationship {
              cursor: String!
              node: Actor!
            }

            input MovieActorsUpdateConnectionInput {
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
              actorCount: IntAggregateSelection!
              averageRating: FloatAggregateSelection!
            }

            input MovieConnectInput {
              actors: [MovieActorsConnectFieldInput!]
            }

            input MovieConnectWhere {
              node: MovieWhere!
            }

            input MovieCreateInput {
              actorCount: Int
              actors: MovieActorsFieldInput
              averageRating: Float
              id: ID
              isActive: Boolean
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
              actorCount: SortDirection
              averageRating: SortDirection
              id: SortDirection
              isActive: SortDirection
            }

            input MovieUpdateInput {
              actorCount: IntScalarMutations
              actorCount_DECREMENT: Int @deprecated(reason: \\"Please use the relevant generic mutation 'actorCount: { decrement: ... } }' instead.\\")
              actorCount_INCREMENT: Int @deprecated(reason: \\"Please use the relevant generic mutation 'actorCount: { increment: ... } }' instead.\\")
              actorCount_SET: Int @deprecated(reason: \\"Please use the generic mutation 'actorCount: { set: ... } }' instead.\\")
              actors: [MovieActorsUpdateFieldInput!]
              averageRating: FloatScalarMutations
              averageRating_ADD: Float @deprecated(reason: \\"Please use the relevant generic mutation 'averageRating: { add: ... } }' instead.\\")
              averageRating_DIVIDE: Float @deprecated(reason: \\"Please use the relevant generic mutation 'averageRating: { divide: ... } }' instead.\\")
              averageRating_MULTIPLY: Float @deprecated(reason: \\"Please use the relevant generic mutation 'averageRating: { multiply: ... } }' instead.\\")
              averageRating_SET: Float @deprecated(reason: \\"Please use the generic mutation 'averageRating: { set: ... } }' instead.\\")
              averageRating_SUBTRACT: Float @deprecated(reason: \\"Please use the relevant generic mutation 'averageRating: { subtract: ... } }' instead.\\")
              id: IDScalarMutations
              id_SET: ID @deprecated(reason: \\"Please use the generic mutation 'id: { set: ... } }' instead.\\")
              isActive: BooleanScalarMutations
              isActive_SET: Boolean @deprecated(reason: \\"Please use the generic mutation 'isActive: { set: ... } }' instead.\\")
            }

            input MovieWhere {
              AND: [MovieWhere!]
              NOT: MovieWhere
              OR: [MovieWhere!]
              actorCount: IntScalarFilters
              actorCount_EQ: Int @deprecated(reason: \\"Please use the relevant generic filter actorCount: { eq: ... }\\")
              actorCount_GT: Int @deprecated(reason: \\"Please use the relevant generic filter actorCount: { gt: ... }\\")
              actorCount_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter actorCount: { gte: ... }\\")
              actorCount_IN: [Int] @deprecated(reason: \\"Please use the relevant generic filter actorCount: { in: ... }\\")
              actorCount_LT: Int @deprecated(reason: \\"Please use the relevant generic filter actorCount: { lt: ... }\\")
              actorCount_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter actorCount: { lte: ... }\\")
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
              averageRating: FloatScalarFilters
              averageRating_EQ: Float @deprecated(reason: \\"Please use the relevant generic filter averageRating: { eq: ... }\\")
              averageRating_GT: Float @deprecated(reason: \\"Please use the relevant generic filter averageRating: { gt: ... }\\")
              averageRating_GTE: Float @deprecated(reason: \\"Please use the relevant generic filter averageRating: { gte: ... }\\")
              averageRating_IN: [Float] @deprecated(reason: \\"Please use the relevant generic filter averageRating: { in: ... }\\")
              averageRating_LT: Float @deprecated(reason: \\"Please use the relevant generic filter averageRating: { lt: ... }\\")
              averageRating_LTE: Float @deprecated(reason: \\"Please use the relevant generic filter averageRating: { lte: ... }\\")
              id: IDScalarFilters
              id_CONTAINS: ID @deprecated(reason: \\"Please use the relevant generic filter id: { contains: ... }\\")
              id_ENDS_WITH: ID @deprecated(reason: \\"Please use the relevant generic filter id: { endsWith: ... }\\")
              id_EQ: ID @deprecated(reason: \\"Please use the relevant generic filter id: { eq: ... }\\")
              id_IN: [ID] @deprecated(reason: \\"Please use the relevant generic filter id: { in: ... }\\")
              id_STARTS_WITH: ID @deprecated(reason: \\"Please use the relevant generic filter id: { startsWith: ... }\\")
              isActive: BooleanScalarFilters
              isActive_EQ: Boolean @deprecated(reason: \\"Please use the relevant generic filter isActive: { eq: ... }\\")
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

            type Query {
              actors(limit: Int, offset: Int, where: ActorWhere): [Actor!]!
              actorsConnection(after: String, first: Int, where: ActorWhere): ActorsConnection!
              movies(limit: Int, offset: Int, sort: [MovieSort!], where: MovieWhere): [Movie!]!
              moviesConnection(after: String, first: Int, sort: [MovieSort!], where: MovieWhere): MoviesConnection!
            }

            \\"\\"\\"An enum for sorting in either ascending or descending order.\\"\\"\\"
            enum SortDirection {
              \\"\\"\\"Sort by field values in ascending order.\\"\\"\\"
              ASC
              \\"\\"\\"Sort by field values in descending order.\\"\\"\\"
              DESC
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

    test("Empty EventPayload type on Union type", async () => {
        const typeDefs = gql`
            type Movie @node {
                id: ID
                actorCount: Int
                averageRating: Float
                isActive: Boolean
                actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN)
            }

            union Actor = Star | Person

            type Star @node {
                movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT)
            }
            type Person @node {
                movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT)
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
            }

            union Actor = Person | Star

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

            input ActorWhere {
              Person: PersonWhere
              Star: StarWhere
            }

            \\"\\"\\"Boolean filters\\"\\"\\"
            input BooleanScalarFilters {
              eq: Boolean
            }

            \\"\\"\\"Boolean mutations\\"\\"\\"
            input BooleanScalarMutations {
              set: Boolean
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

            type CreateMoviesMutationResponse {
              info: CreateInfo!
              movies: [Movie!]!
            }

            type CreatePeopleMutationResponse {
              info: CreateInfo!
              people: [Person!]!
            }

            type CreateStarsMutationResponse {
              info: CreateInfo!
              stars: [Star!]!
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
              actorCount: Int
              actors(limit: Int, offset: Int, where: ActorWhere): [Actor!]!
              actorsConnection(after: String, first: Int, where: MovieActorsConnectionWhere): MovieActorsConnection!
              averageRating: Float
              id: ID
              isActive: Boolean
            }

            input MovieActorsConnectInput {
              Person: [MovieActorsPersonConnectFieldInput!]
              Star: [MovieActorsStarConnectFieldInput!]
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

            input MovieActorsConnectionWhere {
              Person: MovieActorsPersonConnectionWhere
              Star: MovieActorsStarConnectionWhere
            }

            input MovieActorsCreateInput {
              Person: MovieActorsPersonFieldInput
              Star: MovieActorsStarFieldInput
            }

            input MovieActorsDeleteInput {
              Person: [MovieActorsPersonDeleteFieldInput!]
              Star: [MovieActorsStarDeleteFieldInput!]
            }

            input MovieActorsDisconnectInput {
              Person: [MovieActorsPersonDisconnectFieldInput!]
              Star: [MovieActorsStarDisconnectFieldInput!]
            }

            input MovieActorsPersonConnectFieldInput {
              connect: [PersonConnectInput!]
              where: PersonConnectWhere
            }

            input MovieActorsPersonConnectionWhere {
              AND: [MovieActorsPersonConnectionWhere!]
              NOT: MovieActorsPersonConnectionWhere
              OR: [MovieActorsPersonConnectionWhere!]
              node: PersonWhere
            }

            input MovieActorsPersonCreateFieldInput {
              node: PersonCreateInput!
            }

            input MovieActorsPersonDeleteFieldInput {
              delete: PersonDeleteInput
              where: MovieActorsPersonConnectionWhere
            }

            input MovieActorsPersonDisconnectFieldInput {
              disconnect: PersonDisconnectInput
              where: MovieActorsPersonConnectionWhere
            }

            input MovieActorsPersonFieldInput {
              connect: [MovieActorsPersonConnectFieldInput!]
              create: [MovieActorsPersonCreateFieldInput!]
            }

            input MovieActorsPersonUpdateConnectionInput {
              node: PersonUpdateInput
              where: MovieActorsPersonConnectionWhere
            }

            input MovieActorsPersonUpdateFieldInput {
              connect: [MovieActorsPersonConnectFieldInput!]
              create: [MovieActorsPersonCreateFieldInput!]
              delete: [MovieActorsPersonDeleteFieldInput!]
              disconnect: [MovieActorsPersonDisconnectFieldInput!]
              update: MovieActorsPersonUpdateConnectionInput
            }

            type MovieActorsRelationship {
              cursor: String!
              node: Actor!
            }

            input MovieActorsStarConnectFieldInput {
              connect: [StarConnectInput!]
              where: StarConnectWhere
            }

            input MovieActorsStarConnectionWhere {
              AND: [MovieActorsStarConnectionWhere!]
              NOT: MovieActorsStarConnectionWhere
              OR: [MovieActorsStarConnectionWhere!]
              node: StarWhere
            }

            input MovieActorsStarCreateFieldInput {
              node: StarCreateInput!
            }

            input MovieActorsStarDeleteFieldInput {
              delete: StarDeleteInput
              where: MovieActorsStarConnectionWhere
            }

            input MovieActorsStarDisconnectFieldInput {
              disconnect: StarDisconnectInput
              where: MovieActorsStarConnectionWhere
            }

            input MovieActorsStarFieldInput {
              connect: [MovieActorsStarConnectFieldInput!]
              create: [MovieActorsStarCreateFieldInput!]
            }

            input MovieActorsStarUpdateConnectionInput {
              node: StarUpdateInput
              where: MovieActorsStarConnectionWhere
            }

            input MovieActorsStarUpdateFieldInput {
              connect: [MovieActorsStarConnectFieldInput!]
              create: [MovieActorsStarCreateFieldInput!]
              delete: [MovieActorsStarDeleteFieldInput!]
              disconnect: [MovieActorsStarDisconnectFieldInput!]
              update: MovieActorsStarUpdateConnectionInput
            }

            input MovieActorsUpdateInput {
              Person: [MovieActorsPersonUpdateFieldInput!]
              Star: [MovieActorsStarUpdateFieldInput!]
            }

            type MovieAggregate {
              count: Count!
              node: MovieAggregateNode!
            }

            type MovieAggregateNode {
              actorCount: IntAggregateSelection!
              averageRating: FloatAggregateSelection!
            }

            input MovieConnectInput {
              actors: MovieActorsConnectInput
            }

            input MovieConnectWhere {
              node: MovieWhere!
            }

            input MovieCreateInput {
              actorCount: Int
              actors: MovieActorsCreateInput
              averageRating: Float
              id: ID
              isActive: Boolean
            }

            input MovieDeleteInput {
              actors: MovieActorsDeleteInput
            }

            input MovieDisconnectInput {
              actors: MovieActorsDisconnectInput
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
              actorCount: SortDirection
              averageRating: SortDirection
              id: SortDirection
              isActive: SortDirection
            }

            input MovieUpdateInput {
              actorCount: IntScalarMutations
              actorCount_DECREMENT: Int @deprecated(reason: \\"Please use the relevant generic mutation 'actorCount: { decrement: ... } }' instead.\\")
              actorCount_INCREMENT: Int @deprecated(reason: \\"Please use the relevant generic mutation 'actorCount: { increment: ... } }' instead.\\")
              actorCount_SET: Int @deprecated(reason: \\"Please use the generic mutation 'actorCount: { set: ... } }' instead.\\")
              actors: MovieActorsUpdateInput
              averageRating: FloatScalarMutations
              averageRating_ADD: Float @deprecated(reason: \\"Please use the relevant generic mutation 'averageRating: { add: ... } }' instead.\\")
              averageRating_DIVIDE: Float @deprecated(reason: \\"Please use the relevant generic mutation 'averageRating: { divide: ... } }' instead.\\")
              averageRating_MULTIPLY: Float @deprecated(reason: \\"Please use the relevant generic mutation 'averageRating: { multiply: ... } }' instead.\\")
              averageRating_SET: Float @deprecated(reason: \\"Please use the generic mutation 'averageRating: { set: ... } }' instead.\\")
              averageRating_SUBTRACT: Float @deprecated(reason: \\"Please use the relevant generic mutation 'averageRating: { subtract: ... } }' instead.\\")
              id: IDScalarMutations
              id_SET: ID @deprecated(reason: \\"Please use the generic mutation 'id: { set: ... } }' instead.\\")
              isActive: BooleanScalarMutations
              isActive_SET: Boolean @deprecated(reason: \\"Please use the generic mutation 'isActive: { set: ... } }' instead.\\")
            }

            input MovieWhere {
              AND: [MovieWhere!]
              NOT: MovieWhere
              OR: [MovieWhere!]
              actorCount: IntScalarFilters
              actorCount_EQ: Int @deprecated(reason: \\"Please use the relevant generic filter actorCount: { eq: ... }\\")
              actorCount_GT: Int @deprecated(reason: \\"Please use the relevant generic filter actorCount: { gt: ... }\\")
              actorCount_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter actorCount: { gte: ... }\\")
              actorCount_IN: [Int] @deprecated(reason: \\"Please use the relevant generic filter actorCount: { in: ... }\\")
              actorCount_LT: Int @deprecated(reason: \\"Please use the relevant generic filter actorCount: { lt: ... }\\")
              actorCount_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter actorCount: { lte: ... }\\")
              actors: ActorRelationshipFilters
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
              averageRating: FloatScalarFilters
              averageRating_EQ: Float @deprecated(reason: \\"Please use the relevant generic filter averageRating: { eq: ... }\\")
              averageRating_GT: Float @deprecated(reason: \\"Please use the relevant generic filter averageRating: { gt: ... }\\")
              averageRating_GTE: Float @deprecated(reason: \\"Please use the relevant generic filter averageRating: { gte: ... }\\")
              averageRating_IN: [Float] @deprecated(reason: \\"Please use the relevant generic filter averageRating: { in: ... }\\")
              averageRating_LT: Float @deprecated(reason: \\"Please use the relevant generic filter averageRating: { lt: ... }\\")
              averageRating_LTE: Float @deprecated(reason: \\"Please use the relevant generic filter averageRating: { lte: ... }\\")
              id: IDScalarFilters
              id_CONTAINS: ID @deprecated(reason: \\"Please use the relevant generic filter id: { contains: ... }\\")
              id_ENDS_WITH: ID @deprecated(reason: \\"Please use the relevant generic filter id: { endsWith: ... }\\")
              id_EQ: ID @deprecated(reason: \\"Please use the relevant generic filter id: { eq: ... }\\")
              id_IN: [ID] @deprecated(reason: \\"Please use the relevant generic filter id: { in: ... }\\")
              id_STARTS_WITH: ID @deprecated(reason: \\"Please use the relevant generic filter id: { startsWith: ... }\\")
              isActive: BooleanScalarFilters
              isActive_EQ: Boolean @deprecated(reason: \\"Please use the relevant generic filter isActive: { eq: ... }\\")
            }

            type MoviesConnection {
              aggregate: MovieAggregate!
              edges: [MovieEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            type Mutation {
              createMovies(input: [MovieCreateInput!]!): CreateMoviesMutationResponse!
              createPeople(input: [PersonCreateInput!]!): CreatePeopleMutationResponse!
              createStars(input: [StarCreateInput!]!): CreateStarsMutationResponse!
              deleteMovies(delete: MovieDeleteInput, where: MovieWhere): DeleteInfo!
              deletePeople(delete: PersonDeleteInput, where: PersonWhere): DeleteInfo!
              deleteStars(delete: StarDeleteInput, where: StarWhere): DeleteInfo!
              updateMovies(update: MovieUpdateInput, where: MovieWhere): UpdateMoviesMutationResponse!
              updatePeople(update: PersonUpdateInput, where: PersonWhere): UpdatePeopleMutationResponse!
              updateStars(update: StarUpdateInput, where: StarWhere): UpdateStarsMutationResponse!
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

            type Person {
              movies(limit: Int, offset: Int, sort: [MovieSort!], where: MovieWhere): [Movie!]!
              moviesConnection(after: String, first: Int, sort: [PersonMoviesConnectionSort!], where: PersonMoviesConnectionWhere): PersonMoviesConnection!
            }

            type PersonAggregate {
              count: Count!
            }

            input PersonConnectInput {
              movies: [PersonMoviesConnectFieldInput!]
            }

            input PersonConnectWhere {
              node: PersonWhere!
            }

            input PersonCreateInput {
              movies: PersonMoviesFieldInput
            }

            input PersonDeleteInput {
              movies: [PersonMoviesDeleteFieldInput!]
            }

            input PersonDisconnectInput {
              movies: [PersonMoviesDisconnectFieldInput!]
            }

            type PersonEdge {
              cursor: String!
              node: Person!
            }

            type PersonMovieMoviesAggregateSelection {
              count: CountConnection!
              node: PersonMovieMoviesNodeAggregateSelection
            }

            type PersonMovieMoviesNodeAggregateSelection {
              actorCount: IntAggregateSelection!
              averageRating: FloatAggregateSelection!
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
              node: PersonMoviesNodeAggregationWhereInput
            }

            input PersonMoviesConnectFieldInput {
              connect: [MovieConnectInput!]
              where: MovieConnectWhere
            }

            type PersonMoviesConnection {
              aggregate: PersonMovieMoviesAggregateSelection!
              edges: [PersonMoviesRelationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input PersonMoviesConnectionAggregateInput {
              AND: [PersonMoviesConnectionAggregateInput!]
              NOT: PersonMoviesConnectionAggregateInput
              OR: [PersonMoviesConnectionAggregateInput!]
              count: ConnectionAggregationCountFilterInput
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
              node: MovieSort
            }

            input PersonMoviesConnectionWhere {
              AND: [PersonMoviesConnectionWhere!]
              NOT: PersonMoviesConnectionWhere
              OR: [PersonMoviesConnectionWhere!]
              node: MovieWhere
            }

            input PersonMoviesCreateFieldInput {
              node: MovieCreateInput!
            }

            input PersonMoviesDeleteFieldInput {
              delete: MovieDeleteInput
              where: PersonMoviesConnectionWhere
            }

            input PersonMoviesDisconnectFieldInput {
              disconnect: MovieDisconnectInput
              where: PersonMoviesConnectionWhere
            }

            input PersonMoviesFieldInput {
              connect: [PersonMoviesConnectFieldInput!]
              create: [PersonMoviesCreateFieldInput!]
            }

            input PersonMoviesNodeAggregationWhereInput {
              AND: [PersonMoviesNodeAggregationWhereInput!]
              NOT: PersonMoviesNodeAggregationWhereInput
              OR: [PersonMoviesNodeAggregationWhereInput!]
              actorCount: IntScalarAggregationFilters
              actorCount_AVERAGE_EQUAL: Float @deprecated(reason: \\"Please use the relevant generic filter 'actorCount: { average: { eq: ... } } }' instead.\\")
              actorCount_AVERAGE_GT: Float @deprecated(reason: \\"Please use the relevant generic filter 'actorCount: { average: { gt: ... } } }' instead.\\")
              actorCount_AVERAGE_GTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'actorCount: { average: { gte: ... } } }' instead.\\")
              actorCount_AVERAGE_LT: Float @deprecated(reason: \\"Please use the relevant generic filter 'actorCount: { average: { lt: ... } } }' instead.\\")
              actorCount_AVERAGE_LTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'actorCount: { average: { lte: ... } } }' instead.\\")
              actorCount_MAX_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'actorCount: { max: { eq: ... } } }' instead.\\")
              actorCount_MAX_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'actorCount: { max: { gt: ... } } }' instead.\\")
              actorCount_MAX_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'actorCount: { max: { gte: ... } } }' instead.\\")
              actorCount_MAX_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'actorCount: { max: { lt: ... } } }' instead.\\")
              actorCount_MAX_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'actorCount: { max: { lte: ... } } }' instead.\\")
              actorCount_MIN_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'actorCount: { min: { eq: ... } } }' instead.\\")
              actorCount_MIN_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'actorCount: { min: { gt: ... } } }' instead.\\")
              actorCount_MIN_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'actorCount: { min: { gte: ... } } }' instead.\\")
              actorCount_MIN_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'actorCount: { min: { lt: ... } } }' instead.\\")
              actorCount_MIN_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'actorCount: { min: { lte: ... } } }' instead.\\")
              actorCount_SUM_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'actorCount: { sum: { eq: ... } } }' instead.\\")
              actorCount_SUM_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'actorCount: { sum: { gt: ... } } }' instead.\\")
              actorCount_SUM_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'actorCount: { sum: { gte: ... } } }' instead.\\")
              actorCount_SUM_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'actorCount: { sum: { lt: ... } } }' instead.\\")
              actorCount_SUM_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'actorCount: { sum: { lte: ... } } }' instead.\\")
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
            }

            type PersonMoviesRelationship {
              cursor: String!
              node: Movie!
            }

            input PersonMoviesUpdateConnectionInput {
              node: MovieUpdateInput
              where: PersonMoviesConnectionWhere
            }

            input PersonMoviesUpdateFieldInput {
              connect: [PersonMoviesConnectFieldInput!]
              create: [PersonMoviesCreateFieldInput!]
              delete: [PersonMoviesDeleteFieldInput!]
              disconnect: [PersonMoviesDisconnectFieldInput!]
              update: PersonMoviesUpdateConnectionInput
            }

            input PersonUpdateInput {
              movies: [PersonMoviesUpdateFieldInput!]
            }

            input PersonWhere {
              AND: [PersonWhere!]
              NOT: PersonWhere
              OR: [PersonWhere!]
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
            }

            type Query {
              actors(limit: Int, offset: Int, where: ActorWhere): [Actor!]!
              movies(limit: Int, offset: Int, sort: [MovieSort!], where: MovieWhere): [Movie!]!
              moviesConnection(after: String, first: Int, sort: [MovieSort!], where: MovieWhere): MoviesConnection!
              people(limit: Int, offset: Int, where: PersonWhere): [Person!]!
              peopleConnection(after: String, first: Int, where: PersonWhere): PeopleConnection!
              stars(limit: Int, offset: Int, where: StarWhere): [Star!]!
              starsConnection(after: String, first: Int, where: StarWhere): StarsConnection!
            }

            \\"\\"\\"An enum for sorting in either ascending or descending order.\\"\\"\\"
            enum SortDirection {
              \\"\\"\\"Sort by field values in ascending order.\\"\\"\\"
              ASC
              \\"\\"\\"Sort by field values in descending order.\\"\\"\\"
              DESC
            }

            type Star {
              movies(limit: Int, offset: Int, sort: [MovieSort!], where: MovieWhere): [Movie!]!
              moviesConnection(after: String, first: Int, sort: [StarMoviesConnectionSort!], where: StarMoviesConnectionWhere): StarMoviesConnection!
            }

            type StarAggregate {
              count: Count!
            }

            input StarConnectInput {
              movies: [StarMoviesConnectFieldInput!]
            }

            input StarConnectWhere {
              node: StarWhere!
            }

            input StarCreateInput {
              movies: StarMoviesFieldInput
            }

            input StarDeleteInput {
              movies: [StarMoviesDeleteFieldInput!]
            }

            input StarDisconnectInput {
              movies: [StarMoviesDisconnectFieldInput!]
            }

            type StarEdge {
              cursor: String!
              node: Star!
            }

            type StarMovieMoviesAggregateSelection {
              count: CountConnection!
              node: StarMovieMoviesNodeAggregateSelection
            }

            type StarMovieMoviesNodeAggregateSelection {
              actorCount: IntAggregateSelection!
              averageRating: FloatAggregateSelection!
            }

            input StarMoviesAggregateInput {
              AND: [StarMoviesAggregateInput!]
              NOT: StarMoviesAggregateInput
              OR: [StarMoviesAggregateInput!]
              count: IntScalarFilters
              count_EQ: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { eq: ... } } }' instead.\\")
              count_GT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gt: ... } } }' instead.\\")
              count_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gte: ... } } }' instead.\\")
              count_LT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lt: ... } } }' instead.\\")
              count_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lte: ... } } }' instead.\\")
              node: StarMoviesNodeAggregationWhereInput
            }

            input StarMoviesConnectFieldInput {
              connect: [MovieConnectInput!]
              where: MovieConnectWhere
            }

            type StarMoviesConnection {
              aggregate: StarMovieMoviesAggregateSelection!
              edges: [StarMoviesRelationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input StarMoviesConnectionAggregateInput {
              AND: [StarMoviesConnectionAggregateInput!]
              NOT: StarMoviesConnectionAggregateInput
              OR: [StarMoviesConnectionAggregateInput!]
              count: ConnectionAggregationCountFilterInput
              node: StarMoviesNodeAggregationWhereInput
            }

            input StarMoviesConnectionFilters {
              \\"\\"\\"Filter Stars by aggregating results on related StarMoviesConnections\\"\\"\\"
              aggregate: StarMoviesConnectionAggregateInput
              \\"\\"\\"
              Return Stars where all of the related StarMoviesConnections match this filter
              \\"\\"\\"
              all: StarMoviesConnectionWhere
              \\"\\"\\"
              Return Stars where none of the related StarMoviesConnections match this filter
              \\"\\"\\"
              none: StarMoviesConnectionWhere
              \\"\\"\\"
              Return Stars where one of the related StarMoviesConnections match this filter
              \\"\\"\\"
              single: StarMoviesConnectionWhere
              \\"\\"\\"
              Return Stars where some of the related StarMoviesConnections match this filter
              \\"\\"\\"
              some: StarMoviesConnectionWhere
            }

            input StarMoviesConnectionSort {
              node: MovieSort
            }

            input StarMoviesConnectionWhere {
              AND: [StarMoviesConnectionWhere!]
              NOT: StarMoviesConnectionWhere
              OR: [StarMoviesConnectionWhere!]
              node: MovieWhere
            }

            input StarMoviesCreateFieldInput {
              node: MovieCreateInput!
            }

            input StarMoviesDeleteFieldInput {
              delete: MovieDeleteInput
              where: StarMoviesConnectionWhere
            }

            input StarMoviesDisconnectFieldInput {
              disconnect: MovieDisconnectInput
              where: StarMoviesConnectionWhere
            }

            input StarMoviesFieldInput {
              connect: [StarMoviesConnectFieldInput!]
              create: [StarMoviesCreateFieldInput!]
            }

            input StarMoviesNodeAggregationWhereInput {
              AND: [StarMoviesNodeAggregationWhereInput!]
              NOT: StarMoviesNodeAggregationWhereInput
              OR: [StarMoviesNodeAggregationWhereInput!]
              actorCount: IntScalarAggregationFilters
              actorCount_AVERAGE_EQUAL: Float @deprecated(reason: \\"Please use the relevant generic filter 'actorCount: { average: { eq: ... } } }' instead.\\")
              actorCount_AVERAGE_GT: Float @deprecated(reason: \\"Please use the relevant generic filter 'actorCount: { average: { gt: ... } } }' instead.\\")
              actorCount_AVERAGE_GTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'actorCount: { average: { gte: ... } } }' instead.\\")
              actorCount_AVERAGE_LT: Float @deprecated(reason: \\"Please use the relevant generic filter 'actorCount: { average: { lt: ... } } }' instead.\\")
              actorCount_AVERAGE_LTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'actorCount: { average: { lte: ... } } }' instead.\\")
              actorCount_MAX_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'actorCount: { max: { eq: ... } } }' instead.\\")
              actorCount_MAX_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'actorCount: { max: { gt: ... } } }' instead.\\")
              actorCount_MAX_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'actorCount: { max: { gte: ... } } }' instead.\\")
              actorCount_MAX_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'actorCount: { max: { lt: ... } } }' instead.\\")
              actorCount_MAX_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'actorCount: { max: { lte: ... } } }' instead.\\")
              actorCount_MIN_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'actorCount: { min: { eq: ... } } }' instead.\\")
              actorCount_MIN_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'actorCount: { min: { gt: ... } } }' instead.\\")
              actorCount_MIN_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'actorCount: { min: { gte: ... } } }' instead.\\")
              actorCount_MIN_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'actorCount: { min: { lt: ... } } }' instead.\\")
              actorCount_MIN_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'actorCount: { min: { lte: ... } } }' instead.\\")
              actorCount_SUM_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'actorCount: { sum: { eq: ... } } }' instead.\\")
              actorCount_SUM_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'actorCount: { sum: { gt: ... } } }' instead.\\")
              actorCount_SUM_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'actorCount: { sum: { gte: ... } } }' instead.\\")
              actorCount_SUM_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'actorCount: { sum: { lt: ... } } }' instead.\\")
              actorCount_SUM_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'actorCount: { sum: { lte: ... } } }' instead.\\")
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
            }

            type StarMoviesRelationship {
              cursor: String!
              node: Movie!
            }

            input StarMoviesUpdateConnectionInput {
              node: MovieUpdateInput
              where: StarMoviesConnectionWhere
            }

            input StarMoviesUpdateFieldInput {
              connect: [StarMoviesConnectFieldInput!]
              create: [StarMoviesCreateFieldInput!]
              delete: [StarMoviesDeleteFieldInput!]
              disconnect: [StarMoviesDisconnectFieldInput!]
              update: StarMoviesUpdateConnectionInput
            }

            input StarUpdateInput {
              movies: [StarMoviesUpdateFieldInput!]
            }

            input StarWhere {
              AND: [StarWhere!]
              NOT: StarWhere
              OR: [StarWhere!]
              movies: MovieRelationshipFilters
              moviesAggregate: StarMoviesAggregateInput @deprecated(reason: \\"Aggregate filters are moved inside the moviesConnection filter, please use { moviesConnection: { aggregate: {...} } } instead\\")
              moviesConnection: StarMoviesConnectionFilters
              \\"\\"\\"
              Return Stars where all of the related StarMoviesConnections match this filter
              \\"\\"\\"
              moviesConnection_ALL: StarMoviesConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'moviesConnection: { all: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Stars where none of the related StarMoviesConnections match this filter
              \\"\\"\\"
              moviesConnection_NONE: StarMoviesConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'moviesConnection: { none: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Stars where one of the related StarMoviesConnections match this filter
              \\"\\"\\"
              moviesConnection_SINGLE: StarMoviesConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'moviesConnection: { single: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Stars where some of the related StarMoviesConnections match this filter
              \\"\\"\\"
              moviesConnection_SOME: StarMoviesConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'moviesConnection: { some: { node: ... } } }' instead.\\")
              \\"\\"\\"Return Stars where all of the related Movies match this filter\\"\\"\\"
              movies_ALL: MovieWhere @deprecated(reason: \\"Please use the relevant generic filter 'movies: { all: ... }' instead.\\")
              \\"\\"\\"Return Stars where none of the related Movies match this filter\\"\\"\\"
              movies_NONE: MovieWhere @deprecated(reason: \\"Please use the relevant generic filter 'movies: { none: ... }' instead.\\")
              \\"\\"\\"Return Stars where one of the related Movies match this filter\\"\\"\\"
              movies_SINGLE: MovieWhere @deprecated(reason: \\"Please use the relevant generic filter 'movies: {  single: ... }' instead.\\")
              \\"\\"\\"Return Stars where some of the related Movies match this filter\\"\\"\\"
              movies_SOME: MovieWhere @deprecated(reason: \\"Please use the relevant generic filter 'movies: {  some: ... }' instead.\\")
            }

            type StarsConnection {
              aggregate: StarAggregate!
              edges: [StarEdge!]!
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

            type UpdateMoviesMutationResponse {
              info: UpdateInfo!
              movies: [Movie!]!
            }

            type UpdatePeopleMutationResponse {
              info: UpdateInfo!
              people: [Person!]!
            }

            type UpdateStarsMutationResponse {
              info: UpdateInfo!
              stars: [Star!]!
            }"
        `);
    });

    test("Empty EventPayload type, but @relationshipProperty exists", async () => {
        const typeDefs = gql`
            type Movie @node {
                id: ID
                actorCount: Int
                averageRating: Float
                isActive: Boolean
                actors: [Actor!]! @relationship(type: "ACTED_IN", properties: "ActedIn", direction: IN)
            }

            type ActedIn @relationshipProperties {
                screenTime: Int!
            }

            type Actor @node {
                movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT)
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
            }

            \\"\\"\\"
            The edge properties for the following fields:
            * Movie.actors
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
              movies(limit: Int, offset: Int, sort: [MovieSort!], where: MovieWhere): [Movie!]!
              moviesConnection(after: String, first: Int, sort: [ActorMoviesConnectionSort!], where: ActorMoviesConnectionWhere): ActorMoviesConnection!
            }

            type ActorAggregate {
              count: Count!
            }

            input ActorConnectInput {
              movies: [ActorMoviesConnectFieldInput!]
            }

            input ActorConnectWhere {
              node: ActorWhere!
            }

            input ActorCreateInput {
              movies: ActorMoviesFieldInput
            }

            input ActorDeleteInput {
              movies: [ActorMoviesDeleteFieldInput!]
            }

            input ActorDisconnectInput {
              movies: [ActorMoviesDisconnectFieldInput!]
            }

            type ActorEdge {
              cursor: String!
              node: Actor!
            }

            type ActorMovieMoviesAggregateSelection {
              count: CountConnection!
              node: ActorMovieMoviesNodeAggregateSelection
            }

            type ActorMovieMoviesNodeAggregateSelection {
              actorCount: IntAggregateSelection!
              averageRating: FloatAggregateSelection!
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
              node: ActorMoviesNodeAggregationWhereInput
            }

            input ActorMoviesConnectFieldInput {
              connect: [MovieConnectInput!]
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
              node: MovieSort
            }

            input ActorMoviesConnectionWhere {
              AND: [ActorMoviesConnectionWhere!]
              NOT: ActorMoviesConnectionWhere
              OR: [ActorMoviesConnectionWhere!]
              node: MovieWhere
            }

            input ActorMoviesCreateFieldInput {
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
              actorCount: IntScalarAggregationFilters
              actorCount_AVERAGE_EQUAL: Float @deprecated(reason: \\"Please use the relevant generic filter 'actorCount: { average: { eq: ... } } }' instead.\\")
              actorCount_AVERAGE_GT: Float @deprecated(reason: \\"Please use the relevant generic filter 'actorCount: { average: { gt: ... } } }' instead.\\")
              actorCount_AVERAGE_GTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'actorCount: { average: { gte: ... } } }' instead.\\")
              actorCount_AVERAGE_LT: Float @deprecated(reason: \\"Please use the relevant generic filter 'actorCount: { average: { lt: ... } } }' instead.\\")
              actorCount_AVERAGE_LTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'actorCount: { average: { lte: ... } } }' instead.\\")
              actorCount_MAX_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'actorCount: { max: { eq: ... } } }' instead.\\")
              actorCount_MAX_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'actorCount: { max: { gt: ... } } }' instead.\\")
              actorCount_MAX_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'actorCount: { max: { gte: ... } } }' instead.\\")
              actorCount_MAX_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'actorCount: { max: { lt: ... } } }' instead.\\")
              actorCount_MAX_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'actorCount: { max: { lte: ... } } }' instead.\\")
              actorCount_MIN_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'actorCount: { min: { eq: ... } } }' instead.\\")
              actorCount_MIN_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'actorCount: { min: { gt: ... } } }' instead.\\")
              actorCount_MIN_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'actorCount: { min: { gte: ... } } }' instead.\\")
              actorCount_MIN_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'actorCount: { min: { lt: ... } } }' instead.\\")
              actorCount_MIN_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'actorCount: { min: { lte: ... } } }' instead.\\")
              actorCount_SUM_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'actorCount: { sum: { eq: ... } } }' instead.\\")
              actorCount_SUM_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'actorCount: { sum: { gt: ... } } }' instead.\\")
              actorCount_SUM_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'actorCount: { sum: { gte: ... } } }' instead.\\")
              actorCount_SUM_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'actorCount: { sum: { lt: ... } } }' instead.\\")
              actorCount_SUM_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'actorCount: { sum: { lte: ... } } }' instead.\\")
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
            }

            type ActorMoviesRelationship {
              cursor: String!
              node: Movie!
            }

            input ActorMoviesUpdateConnectionInput {
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

            input ActorUpdateInput {
              movies: [ActorMoviesUpdateFieldInput!]
            }

            input ActorWhere {
              AND: [ActorWhere!]
              NOT: ActorWhere
              OR: [ActorWhere!]
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
            }

            type ActorsConnection {
              aggregate: ActorAggregate!
              edges: [ActorEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            \\"\\"\\"Boolean filters\\"\\"\\"
            input BooleanScalarFilters {
              eq: Boolean
            }

            \\"\\"\\"Boolean mutations\\"\\"\\"
            input BooleanScalarMutations {
              set: Boolean
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

            type FloatAggregateSelection {
              average: Float
              max: Float
              min: Float
              sum: Float
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
              actorCount: Int
              actors(limit: Int, offset: Int, where: ActorWhere): [Actor!]!
              actorsConnection(after: String, first: Int, sort: [MovieActorsConnectionSort!], where: MovieActorsConnectionWhere): MovieActorsConnection!
              averageRating: Float
              id: ID
              isActive: Boolean
            }

            type MovieActorActorsAggregateSelection {
              count: CountConnection!
              edge: MovieActorActorsEdgeAggregateSelection
            }

            type MovieActorActorsEdgeAggregateSelection {
              screenTime: IntAggregateSelection!
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
              actorCount: IntAggregateSelection!
              averageRating: FloatAggregateSelection!
            }

            input MovieConnectInput {
              actors: [MovieActorsConnectFieldInput!]
            }

            input MovieConnectWhere {
              node: MovieWhere!
            }

            input MovieCreateInput {
              actorCount: Int
              actors: MovieActorsFieldInput
              averageRating: Float
              id: ID
              isActive: Boolean
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
              actorCount: SortDirection
              averageRating: SortDirection
              id: SortDirection
              isActive: SortDirection
            }

            input MovieUpdateInput {
              actorCount: IntScalarMutations
              actorCount_DECREMENT: Int @deprecated(reason: \\"Please use the relevant generic mutation 'actorCount: { decrement: ... } }' instead.\\")
              actorCount_INCREMENT: Int @deprecated(reason: \\"Please use the relevant generic mutation 'actorCount: { increment: ... } }' instead.\\")
              actorCount_SET: Int @deprecated(reason: \\"Please use the generic mutation 'actorCount: { set: ... } }' instead.\\")
              actors: [MovieActorsUpdateFieldInput!]
              averageRating: FloatScalarMutations
              averageRating_ADD: Float @deprecated(reason: \\"Please use the relevant generic mutation 'averageRating: { add: ... } }' instead.\\")
              averageRating_DIVIDE: Float @deprecated(reason: \\"Please use the relevant generic mutation 'averageRating: { divide: ... } }' instead.\\")
              averageRating_MULTIPLY: Float @deprecated(reason: \\"Please use the relevant generic mutation 'averageRating: { multiply: ... } }' instead.\\")
              averageRating_SET: Float @deprecated(reason: \\"Please use the generic mutation 'averageRating: { set: ... } }' instead.\\")
              averageRating_SUBTRACT: Float @deprecated(reason: \\"Please use the relevant generic mutation 'averageRating: { subtract: ... } }' instead.\\")
              id: IDScalarMutations
              id_SET: ID @deprecated(reason: \\"Please use the generic mutation 'id: { set: ... } }' instead.\\")
              isActive: BooleanScalarMutations
              isActive_SET: Boolean @deprecated(reason: \\"Please use the generic mutation 'isActive: { set: ... } }' instead.\\")
            }

            input MovieWhere {
              AND: [MovieWhere!]
              NOT: MovieWhere
              OR: [MovieWhere!]
              actorCount: IntScalarFilters
              actorCount_EQ: Int @deprecated(reason: \\"Please use the relevant generic filter actorCount: { eq: ... }\\")
              actorCount_GT: Int @deprecated(reason: \\"Please use the relevant generic filter actorCount: { gt: ... }\\")
              actorCount_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter actorCount: { gte: ... }\\")
              actorCount_IN: [Int] @deprecated(reason: \\"Please use the relevant generic filter actorCount: { in: ... }\\")
              actorCount_LT: Int @deprecated(reason: \\"Please use the relevant generic filter actorCount: { lt: ... }\\")
              actorCount_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter actorCount: { lte: ... }\\")
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
              averageRating: FloatScalarFilters
              averageRating_EQ: Float @deprecated(reason: \\"Please use the relevant generic filter averageRating: { eq: ... }\\")
              averageRating_GT: Float @deprecated(reason: \\"Please use the relevant generic filter averageRating: { gt: ... }\\")
              averageRating_GTE: Float @deprecated(reason: \\"Please use the relevant generic filter averageRating: { gte: ... }\\")
              averageRating_IN: [Float] @deprecated(reason: \\"Please use the relevant generic filter averageRating: { in: ... }\\")
              averageRating_LT: Float @deprecated(reason: \\"Please use the relevant generic filter averageRating: { lt: ... }\\")
              averageRating_LTE: Float @deprecated(reason: \\"Please use the relevant generic filter averageRating: { lte: ... }\\")
              id: IDScalarFilters
              id_CONTAINS: ID @deprecated(reason: \\"Please use the relevant generic filter id: { contains: ... }\\")
              id_ENDS_WITH: ID @deprecated(reason: \\"Please use the relevant generic filter id: { endsWith: ... }\\")
              id_EQ: ID @deprecated(reason: \\"Please use the relevant generic filter id: { eq: ... }\\")
              id_IN: [ID] @deprecated(reason: \\"Please use the relevant generic filter id: { in: ... }\\")
              id_STARTS_WITH: ID @deprecated(reason: \\"Please use the relevant generic filter id: { startsWith: ... }\\")
              isActive: BooleanScalarFilters
              isActive_EQ: Boolean @deprecated(reason: \\"Please use the relevant generic filter isActive: { eq: ... }\\")
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

            type Query {
              actors(limit: Int, offset: Int, where: ActorWhere): [Actor!]!
              actorsConnection(after: String, first: Int, where: ActorWhere): ActorsConnection!
              movies(limit: Int, offset: Int, sort: [MovieSort!], where: MovieWhere): [Movie!]!
              moviesConnection(after: String, first: Int, sort: [MovieSort!], where: MovieWhere): MoviesConnection!
            }

            \\"\\"\\"An enum for sorting in either ascending or descending order.\\"\\"\\"
            enum SortDirection {
              \\"\\"\\"Sort by field values in ascending order.\\"\\"\\"
              ASC
              \\"\\"\\"Sort by field values in descending order.\\"\\"\\"
              DESC
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

    test("Subscriptions excluded", async () => {
        const typeDefs = gql`
            type Movie @subscription(events: []) @node {
                id: ID
                actorCount: Int
                averageRating: Float
                isActive: Boolean
                actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN)
            }

            type Actor @node {
                name: String!
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
            }

            type Actor {
              name: String!
            }

            type ActorAggregate {
              count: Count!
              node: ActorAggregateNode!
            }

            type ActorAggregateNode {
              name: StringAggregateSelection!
            }

            input ActorConnectWhere {
              node: ActorWhere!
            }

            input ActorCreateInput {
              name: String!
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

            \\"\\"\\"
            Fields to sort Actors by. The order in which sorts are applied is not guaranteed when specifying many fields in one ActorSort object.
            \\"\\"\\"
            input ActorSort {
              name: SortDirection
            }

            input ActorUpdateInput {
              name: StringScalarMutations
              name_SET: String @deprecated(reason: \\"Please use the generic mutation 'name: { set: ... } }' instead.\\")
            }

            input ActorWhere {
              AND: [ActorWhere!]
              NOT: ActorWhere
              OR: [ActorWhere!]
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

            \\"\\"\\"Boolean filters\\"\\"\\"
            input BooleanScalarFilters {
              eq: Boolean
            }

            \\"\\"\\"Boolean mutations\\"\\"\\"
            input BooleanScalarMutations {
              set: Boolean
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

            type FloatAggregateSelection {
              average: Float
              max: Float
              min: Float
              sum: Float
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
              actorCount: Int
              actors(limit: Int, offset: Int, sort: [ActorSort!], where: ActorWhere): [Actor!]!
              actorsConnection(after: String, first: Int, sort: [MovieActorsConnectionSort!], where: MovieActorsConnectionWhere): MovieActorsConnection!
              averageRating: Float
              id: ID
              isActive: Boolean
            }

            type MovieActorActorsAggregateSelection {
              count: CountConnection!
              node: MovieActorActorsNodeAggregateSelection
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
              node: MovieActorsNodeAggregationWhereInput
            }

            input MovieActorsConnectFieldInput {
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
              node: ActorSort
            }

            input MovieActorsConnectionWhere {
              AND: [MovieActorsConnectionWhere!]
              NOT: MovieActorsConnectionWhere
              OR: [MovieActorsConnectionWhere!]
              node: ActorWhere
            }

            input MovieActorsCreateFieldInput {
              node: ActorCreateInput!
            }

            input MovieActorsDeleteFieldInput {
              where: MovieActorsConnectionWhere
            }

            input MovieActorsDisconnectFieldInput {
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
            }

            input MovieActorsUpdateConnectionInput {
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
              actorCount: IntAggregateSelection!
              averageRating: FloatAggregateSelection!
            }

            input MovieCreateInput {
              actorCount: Int
              actors: MovieActorsFieldInput
              averageRating: Float
              id: ID
              isActive: Boolean
            }

            input MovieDeleteInput {
              actors: [MovieActorsDeleteFieldInput!]
            }

            type MovieEdge {
              cursor: String!
              node: Movie!
            }

            \\"\\"\\"
            Fields to sort Movies by. The order in which sorts are applied is not guaranteed when specifying many fields in one MovieSort object.
            \\"\\"\\"
            input MovieSort {
              actorCount: SortDirection
              averageRating: SortDirection
              id: SortDirection
              isActive: SortDirection
            }

            input MovieUpdateInput {
              actorCount: IntScalarMutations
              actorCount_DECREMENT: Int @deprecated(reason: \\"Please use the relevant generic mutation 'actorCount: { decrement: ... } }' instead.\\")
              actorCount_INCREMENT: Int @deprecated(reason: \\"Please use the relevant generic mutation 'actorCount: { increment: ... } }' instead.\\")
              actorCount_SET: Int @deprecated(reason: \\"Please use the generic mutation 'actorCount: { set: ... } }' instead.\\")
              actors: [MovieActorsUpdateFieldInput!]
              averageRating: FloatScalarMutations
              averageRating_ADD: Float @deprecated(reason: \\"Please use the relevant generic mutation 'averageRating: { add: ... } }' instead.\\")
              averageRating_DIVIDE: Float @deprecated(reason: \\"Please use the relevant generic mutation 'averageRating: { divide: ... } }' instead.\\")
              averageRating_MULTIPLY: Float @deprecated(reason: \\"Please use the relevant generic mutation 'averageRating: { multiply: ... } }' instead.\\")
              averageRating_SET: Float @deprecated(reason: \\"Please use the generic mutation 'averageRating: { set: ... } }' instead.\\")
              averageRating_SUBTRACT: Float @deprecated(reason: \\"Please use the relevant generic mutation 'averageRating: { subtract: ... } }' instead.\\")
              id: IDScalarMutations
              id_SET: ID @deprecated(reason: \\"Please use the generic mutation 'id: { set: ... } }' instead.\\")
              isActive: BooleanScalarMutations
              isActive_SET: Boolean @deprecated(reason: \\"Please use the generic mutation 'isActive: { set: ... } }' instead.\\")
            }

            input MovieWhere {
              AND: [MovieWhere!]
              NOT: MovieWhere
              OR: [MovieWhere!]
              actorCount: IntScalarFilters
              actorCount_EQ: Int @deprecated(reason: \\"Please use the relevant generic filter actorCount: { eq: ... }\\")
              actorCount_GT: Int @deprecated(reason: \\"Please use the relevant generic filter actorCount: { gt: ... }\\")
              actorCount_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter actorCount: { gte: ... }\\")
              actorCount_IN: [Int] @deprecated(reason: \\"Please use the relevant generic filter actorCount: { in: ... }\\")
              actorCount_LT: Int @deprecated(reason: \\"Please use the relevant generic filter actorCount: { lt: ... }\\")
              actorCount_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter actorCount: { lte: ... }\\")
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
              averageRating: FloatScalarFilters
              averageRating_EQ: Float @deprecated(reason: \\"Please use the relevant generic filter averageRating: { eq: ... }\\")
              averageRating_GT: Float @deprecated(reason: \\"Please use the relevant generic filter averageRating: { gt: ... }\\")
              averageRating_GTE: Float @deprecated(reason: \\"Please use the relevant generic filter averageRating: { gte: ... }\\")
              averageRating_IN: [Float] @deprecated(reason: \\"Please use the relevant generic filter averageRating: { in: ... }\\")
              averageRating_LT: Float @deprecated(reason: \\"Please use the relevant generic filter averageRating: { lt: ... }\\")
              averageRating_LTE: Float @deprecated(reason: \\"Please use the relevant generic filter averageRating: { lte: ... }\\")
              id: IDScalarFilters
              id_CONTAINS: ID @deprecated(reason: \\"Please use the relevant generic filter id: { contains: ... }\\")
              id_ENDS_WITH: ID @deprecated(reason: \\"Please use the relevant generic filter id: { endsWith: ... }\\")
              id_EQ: ID @deprecated(reason: \\"Please use the relevant generic filter id: { eq: ... }\\")
              id_IN: [ID] @deprecated(reason: \\"Please use the relevant generic filter id: { in: ... }\\")
              id_STARTS_WITH: ID @deprecated(reason: \\"Please use the relevant generic filter id: { startsWith: ... }\\")
              isActive: BooleanScalarFilters
              isActive_EQ: Boolean @deprecated(reason: \\"Please use the relevant generic filter isActive: { eq: ... }\\")
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
              deleteActors(where: ActorWhere): DeleteInfo!
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

            type Query {
              actors(limit: Int, offset: Int, sort: [ActorSort!], where: ActorWhere): [Actor!]!
              actorsConnection(after: String, first: Int, sort: [ActorSort!], where: ActorWhere): ActorsConnection!
              movies(limit: Int, offset: Int, sort: [MovieSort!], where: MovieWhere): [Movie!]!
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

    test("Type with relationship to a subscriptions excluded type + Union type", async () => {
        const typeDefs = gql`
            type Movie @node {
                id: ID
                actorCount: Int
                averageRating: Float
                isActive: Boolean
                actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN)
            }

            union Actor = Star | Person

            type Star @subscription(events: []) @node {
                movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT)
            }
            type Person @node {
                movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT)
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
            }

            union Actor = Person | Star

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

            input ActorWhere {
              Person: PersonWhere
              Star: StarWhere
            }

            \\"\\"\\"Boolean filters\\"\\"\\"
            input BooleanScalarFilters {
              eq: Boolean
            }

            \\"\\"\\"Boolean mutations\\"\\"\\"
            input BooleanScalarMutations {
              set: Boolean
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

            type CreateMoviesMutationResponse {
              info: CreateInfo!
              movies: [Movie!]!
            }

            type CreatePeopleMutationResponse {
              info: CreateInfo!
              people: [Person!]!
            }

            type CreateStarsMutationResponse {
              info: CreateInfo!
              stars: [Star!]!
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
              actorCount: Int
              actors(limit: Int, offset: Int, where: ActorWhere): [Actor!]!
              actorsConnection(after: String, first: Int, where: MovieActorsConnectionWhere): MovieActorsConnection!
              averageRating: Float
              id: ID
              isActive: Boolean
            }

            input MovieActorsConnectInput {
              Person: [MovieActorsPersonConnectFieldInput!]
              Star: [MovieActorsStarConnectFieldInput!]
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

            input MovieActorsConnectionWhere {
              Person: MovieActorsPersonConnectionWhere
              Star: MovieActorsStarConnectionWhere
            }

            input MovieActorsCreateInput {
              Person: MovieActorsPersonFieldInput
              Star: MovieActorsStarFieldInput
            }

            input MovieActorsDeleteInput {
              Person: [MovieActorsPersonDeleteFieldInput!]
              Star: [MovieActorsStarDeleteFieldInput!]
            }

            input MovieActorsDisconnectInput {
              Person: [MovieActorsPersonDisconnectFieldInput!]
              Star: [MovieActorsStarDisconnectFieldInput!]
            }

            input MovieActorsPersonConnectFieldInput {
              connect: [PersonConnectInput!]
              where: PersonConnectWhere
            }

            input MovieActorsPersonConnectionWhere {
              AND: [MovieActorsPersonConnectionWhere!]
              NOT: MovieActorsPersonConnectionWhere
              OR: [MovieActorsPersonConnectionWhere!]
              node: PersonWhere
            }

            input MovieActorsPersonCreateFieldInput {
              node: PersonCreateInput!
            }

            input MovieActorsPersonDeleteFieldInput {
              delete: PersonDeleteInput
              where: MovieActorsPersonConnectionWhere
            }

            input MovieActorsPersonDisconnectFieldInput {
              disconnect: PersonDisconnectInput
              where: MovieActorsPersonConnectionWhere
            }

            input MovieActorsPersonFieldInput {
              connect: [MovieActorsPersonConnectFieldInput!]
              create: [MovieActorsPersonCreateFieldInput!]
            }

            input MovieActorsPersonUpdateConnectionInput {
              node: PersonUpdateInput
              where: MovieActorsPersonConnectionWhere
            }

            input MovieActorsPersonUpdateFieldInput {
              connect: [MovieActorsPersonConnectFieldInput!]
              create: [MovieActorsPersonCreateFieldInput!]
              delete: [MovieActorsPersonDeleteFieldInput!]
              disconnect: [MovieActorsPersonDisconnectFieldInput!]
              update: MovieActorsPersonUpdateConnectionInput
            }

            type MovieActorsRelationship {
              cursor: String!
              node: Actor!
            }

            input MovieActorsStarConnectFieldInput {
              connect: [StarConnectInput!]
              where: StarConnectWhere
            }

            input MovieActorsStarConnectionWhere {
              AND: [MovieActorsStarConnectionWhere!]
              NOT: MovieActorsStarConnectionWhere
              OR: [MovieActorsStarConnectionWhere!]
              node: StarWhere
            }

            input MovieActorsStarCreateFieldInput {
              node: StarCreateInput!
            }

            input MovieActorsStarDeleteFieldInput {
              delete: StarDeleteInput
              where: MovieActorsStarConnectionWhere
            }

            input MovieActorsStarDisconnectFieldInput {
              disconnect: StarDisconnectInput
              where: MovieActorsStarConnectionWhere
            }

            input MovieActorsStarFieldInput {
              connect: [MovieActorsStarConnectFieldInput!]
              create: [MovieActorsStarCreateFieldInput!]
            }

            input MovieActorsStarUpdateConnectionInput {
              node: StarUpdateInput
              where: MovieActorsStarConnectionWhere
            }

            input MovieActorsStarUpdateFieldInput {
              connect: [MovieActorsStarConnectFieldInput!]
              create: [MovieActorsStarCreateFieldInput!]
              delete: [MovieActorsStarDeleteFieldInput!]
              disconnect: [MovieActorsStarDisconnectFieldInput!]
              update: MovieActorsStarUpdateConnectionInput
            }

            input MovieActorsUpdateInput {
              Person: [MovieActorsPersonUpdateFieldInput!]
              Star: [MovieActorsStarUpdateFieldInput!]
            }

            type MovieAggregate {
              count: Count!
              node: MovieAggregateNode!
            }

            type MovieAggregateNode {
              actorCount: IntAggregateSelection!
              averageRating: FloatAggregateSelection!
            }

            input MovieConnectInput {
              actors: MovieActorsConnectInput
            }

            input MovieConnectWhere {
              node: MovieWhere!
            }

            input MovieCreateInput {
              actorCount: Int
              actors: MovieActorsCreateInput
              averageRating: Float
              id: ID
              isActive: Boolean
            }

            input MovieDeleteInput {
              actors: MovieActorsDeleteInput
            }

            input MovieDisconnectInput {
              actors: MovieActorsDisconnectInput
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
              actorCount: SortDirection
              averageRating: SortDirection
              id: SortDirection
              isActive: SortDirection
            }

            input MovieUpdateInput {
              actorCount: IntScalarMutations
              actorCount_DECREMENT: Int @deprecated(reason: \\"Please use the relevant generic mutation 'actorCount: { decrement: ... } }' instead.\\")
              actorCount_INCREMENT: Int @deprecated(reason: \\"Please use the relevant generic mutation 'actorCount: { increment: ... } }' instead.\\")
              actorCount_SET: Int @deprecated(reason: \\"Please use the generic mutation 'actorCount: { set: ... } }' instead.\\")
              actors: MovieActorsUpdateInput
              averageRating: FloatScalarMutations
              averageRating_ADD: Float @deprecated(reason: \\"Please use the relevant generic mutation 'averageRating: { add: ... } }' instead.\\")
              averageRating_DIVIDE: Float @deprecated(reason: \\"Please use the relevant generic mutation 'averageRating: { divide: ... } }' instead.\\")
              averageRating_MULTIPLY: Float @deprecated(reason: \\"Please use the relevant generic mutation 'averageRating: { multiply: ... } }' instead.\\")
              averageRating_SET: Float @deprecated(reason: \\"Please use the generic mutation 'averageRating: { set: ... } }' instead.\\")
              averageRating_SUBTRACT: Float @deprecated(reason: \\"Please use the relevant generic mutation 'averageRating: { subtract: ... } }' instead.\\")
              id: IDScalarMutations
              id_SET: ID @deprecated(reason: \\"Please use the generic mutation 'id: { set: ... } }' instead.\\")
              isActive: BooleanScalarMutations
              isActive_SET: Boolean @deprecated(reason: \\"Please use the generic mutation 'isActive: { set: ... } }' instead.\\")
            }

            input MovieWhere {
              AND: [MovieWhere!]
              NOT: MovieWhere
              OR: [MovieWhere!]
              actorCount: IntScalarFilters
              actorCount_EQ: Int @deprecated(reason: \\"Please use the relevant generic filter actorCount: { eq: ... }\\")
              actorCount_GT: Int @deprecated(reason: \\"Please use the relevant generic filter actorCount: { gt: ... }\\")
              actorCount_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter actorCount: { gte: ... }\\")
              actorCount_IN: [Int] @deprecated(reason: \\"Please use the relevant generic filter actorCount: { in: ... }\\")
              actorCount_LT: Int @deprecated(reason: \\"Please use the relevant generic filter actorCount: { lt: ... }\\")
              actorCount_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter actorCount: { lte: ... }\\")
              actors: ActorRelationshipFilters
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
              averageRating: FloatScalarFilters
              averageRating_EQ: Float @deprecated(reason: \\"Please use the relevant generic filter averageRating: { eq: ... }\\")
              averageRating_GT: Float @deprecated(reason: \\"Please use the relevant generic filter averageRating: { gt: ... }\\")
              averageRating_GTE: Float @deprecated(reason: \\"Please use the relevant generic filter averageRating: { gte: ... }\\")
              averageRating_IN: [Float] @deprecated(reason: \\"Please use the relevant generic filter averageRating: { in: ... }\\")
              averageRating_LT: Float @deprecated(reason: \\"Please use the relevant generic filter averageRating: { lt: ... }\\")
              averageRating_LTE: Float @deprecated(reason: \\"Please use the relevant generic filter averageRating: { lte: ... }\\")
              id: IDScalarFilters
              id_CONTAINS: ID @deprecated(reason: \\"Please use the relevant generic filter id: { contains: ... }\\")
              id_ENDS_WITH: ID @deprecated(reason: \\"Please use the relevant generic filter id: { endsWith: ... }\\")
              id_EQ: ID @deprecated(reason: \\"Please use the relevant generic filter id: { eq: ... }\\")
              id_IN: [ID] @deprecated(reason: \\"Please use the relevant generic filter id: { in: ... }\\")
              id_STARTS_WITH: ID @deprecated(reason: \\"Please use the relevant generic filter id: { startsWith: ... }\\")
              isActive: BooleanScalarFilters
              isActive_EQ: Boolean @deprecated(reason: \\"Please use the relevant generic filter isActive: { eq: ... }\\")
            }

            type MoviesConnection {
              aggregate: MovieAggregate!
              edges: [MovieEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            type Mutation {
              createMovies(input: [MovieCreateInput!]!): CreateMoviesMutationResponse!
              createPeople(input: [PersonCreateInput!]!): CreatePeopleMutationResponse!
              createStars(input: [StarCreateInput!]!): CreateStarsMutationResponse!
              deleteMovies(delete: MovieDeleteInput, where: MovieWhere): DeleteInfo!
              deletePeople(delete: PersonDeleteInput, where: PersonWhere): DeleteInfo!
              deleteStars(delete: StarDeleteInput, where: StarWhere): DeleteInfo!
              updateMovies(update: MovieUpdateInput, where: MovieWhere): UpdateMoviesMutationResponse!
              updatePeople(update: PersonUpdateInput, where: PersonWhere): UpdatePeopleMutationResponse!
              updateStars(update: StarUpdateInput, where: StarWhere): UpdateStarsMutationResponse!
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

            type Person {
              movies(limit: Int, offset: Int, sort: [MovieSort!], where: MovieWhere): [Movie!]!
              moviesConnection(after: String, first: Int, sort: [PersonMoviesConnectionSort!], where: PersonMoviesConnectionWhere): PersonMoviesConnection!
            }

            type PersonAggregate {
              count: Count!
            }

            input PersonConnectInput {
              movies: [PersonMoviesConnectFieldInput!]
            }

            input PersonConnectWhere {
              node: PersonWhere!
            }

            input PersonCreateInput {
              movies: PersonMoviesFieldInput
            }

            input PersonDeleteInput {
              movies: [PersonMoviesDeleteFieldInput!]
            }

            input PersonDisconnectInput {
              movies: [PersonMoviesDisconnectFieldInput!]
            }

            type PersonEdge {
              cursor: String!
              node: Person!
            }

            type PersonMovieMoviesAggregateSelection {
              count: CountConnection!
              node: PersonMovieMoviesNodeAggregateSelection
            }

            type PersonMovieMoviesNodeAggregateSelection {
              actorCount: IntAggregateSelection!
              averageRating: FloatAggregateSelection!
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
              node: PersonMoviesNodeAggregationWhereInput
            }

            input PersonMoviesConnectFieldInput {
              connect: [MovieConnectInput!]
              where: MovieConnectWhere
            }

            type PersonMoviesConnection {
              aggregate: PersonMovieMoviesAggregateSelection!
              edges: [PersonMoviesRelationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input PersonMoviesConnectionAggregateInput {
              AND: [PersonMoviesConnectionAggregateInput!]
              NOT: PersonMoviesConnectionAggregateInput
              OR: [PersonMoviesConnectionAggregateInput!]
              count: ConnectionAggregationCountFilterInput
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
              node: MovieSort
            }

            input PersonMoviesConnectionWhere {
              AND: [PersonMoviesConnectionWhere!]
              NOT: PersonMoviesConnectionWhere
              OR: [PersonMoviesConnectionWhere!]
              node: MovieWhere
            }

            input PersonMoviesCreateFieldInput {
              node: MovieCreateInput!
            }

            input PersonMoviesDeleteFieldInput {
              delete: MovieDeleteInput
              where: PersonMoviesConnectionWhere
            }

            input PersonMoviesDisconnectFieldInput {
              disconnect: MovieDisconnectInput
              where: PersonMoviesConnectionWhere
            }

            input PersonMoviesFieldInput {
              connect: [PersonMoviesConnectFieldInput!]
              create: [PersonMoviesCreateFieldInput!]
            }

            input PersonMoviesNodeAggregationWhereInput {
              AND: [PersonMoviesNodeAggregationWhereInput!]
              NOT: PersonMoviesNodeAggregationWhereInput
              OR: [PersonMoviesNodeAggregationWhereInput!]
              actorCount: IntScalarAggregationFilters
              actorCount_AVERAGE_EQUAL: Float @deprecated(reason: \\"Please use the relevant generic filter 'actorCount: { average: { eq: ... } } }' instead.\\")
              actorCount_AVERAGE_GT: Float @deprecated(reason: \\"Please use the relevant generic filter 'actorCount: { average: { gt: ... } } }' instead.\\")
              actorCount_AVERAGE_GTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'actorCount: { average: { gte: ... } } }' instead.\\")
              actorCount_AVERAGE_LT: Float @deprecated(reason: \\"Please use the relevant generic filter 'actorCount: { average: { lt: ... } } }' instead.\\")
              actorCount_AVERAGE_LTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'actorCount: { average: { lte: ... } } }' instead.\\")
              actorCount_MAX_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'actorCount: { max: { eq: ... } } }' instead.\\")
              actorCount_MAX_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'actorCount: { max: { gt: ... } } }' instead.\\")
              actorCount_MAX_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'actorCount: { max: { gte: ... } } }' instead.\\")
              actorCount_MAX_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'actorCount: { max: { lt: ... } } }' instead.\\")
              actorCount_MAX_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'actorCount: { max: { lte: ... } } }' instead.\\")
              actorCount_MIN_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'actorCount: { min: { eq: ... } } }' instead.\\")
              actorCount_MIN_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'actorCount: { min: { gt: ... } } }' instead.\\")
              actorCount_MIN_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'actorCount: { min: { gte: ... } } }' instead.\\")
              actorCount_MIN_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'actorCount: { min: { lt: ... } } }' instead.\\")
              actorCount_MIN_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'actorCount: { min: { lte: ... } } }' instead.\\")
              actorCount_SUM_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'actorCount: { sum: { eq: ... } } }' instead.\\")
              actorCount_SUM_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'actorCount: { sum: { gt: ... } } }' instead.\\")
              actorCount_SUM_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'actorCount: { sum: { gte: ... } } }' instead.\\")
              actorCount_SUM_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'actorCount: { sum: { lt: ... } } }' instead.\\")
              actorCount_SUM_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'actorCount: { sum: { lte: ... } } }' instead.\\")
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
            }

            type PersonMoviesRelationship {
              cursor: String!
              node: Movie!
            }

            input PersonMoviesUpdateConnectionInput {
              node: MovieUpdateInput
              where: PersonMoviesConnectionWhere
            }

            input PersonMoviesUpdateFieldInput {
              connect: [PersonMoviesConnectFieldInput!]
              create: [PersonMoviesCreateFieldInput!]
              delete: [PersonMoviesDeleteFieldInput!]
              disconnect: [PersonMoviesDisconnectFieldInput!]
              update: PersonMoviesUpdateConnectionInput
            }

            input PersonUpdateInput {
              movies: [PersonMoviesUpdateFieldInput!]
            }

            input PersonWhere {
              AND: [PersonWhere!]
              NOT: PersonWhere
              OR: [PersonWhere!]
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
            }

            type Query {
              actors(limit: Int, offset: Int, where: ActorWhere): [Actor!]!
              movies(limit: Int, offset: Int, sort: [MovieSort!], where: MovieWhere): [Movie!]!
              moviesConnection(after: String, first: Int, sort: [MovieSort!], where: MovieWhere): MoviesConnection!
              people(limit: Int, offset: Int, where: PersonWhere): [Person!]!
              peopleConnection(after: String, first: Int, where: PersonWhere): PeopleConnection!
              stars(limit: Int, offset: Int, where: StarWhere): [Star!]!
              starsConnection(after: String, first: Int, where: StarWhere): StarsConnection!
            }

            \\"\\"\\"An enum for sorting in either ascending or descending order.\\"\\"\\"
            enum SortDirection {
              \\"\\"\\"Sort by field values in ascending order.\\"\\"\\"
              ASC
              \\"\\"\\"Sort by field values in descending order.\\"\\"\\"
              DESC
            }

            type Star {
              movies(limit: Int, offset: Int, sort: [MovieSort!], where: MovieWhere): [Movie!]!
              moviesConnection(after: String, first: Int, sort: [StarMoviesConnectionSort!], where: StarMoviesConnectionWhere): StarMoviesConnection!
            }

            type StarAggregate {
              count: Count!
            }

            input StarConnectInput {
              movies: [StarMoviesConnectFieldInput!]
            }

            input StarConnectWhere {
              node: StarWhere!
            }

            input StarCreateInput {
              movies: StarMoviesFieldInput
            }

            input StarDeleteInput {
              movies: [StarMoviesDeleteFieldInput!]
            }

            input StarDisconnectInput {
              movies: [StarMoviesDisconnectFieldInput!]
            }

            type StarEdge {
              cursor: String!
              node: Star!
            }

            type StarMovieMoviesAggregateSelection {
              count: CountConnection!
              node: StarMovieMoviesNodeAggregateSelection
            }

            type StarMovieMoviesNodeAggregateSelection {
              actorCount: IntAggregateSelection!
              averageRating: FloatAggregateSelection!
            }

            input StarMoviesAggregateInput {
              AND: [StarMoviesAggregateInput!]
              NOT: StarMoviesAggregateInput
              OR: [StarMoviesAggregateInput!]
              count: IntScalarFilters
              count_EQ: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { eq: ... } } }' instead.\\")
              count_GT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gt: ... } } }' instead.\\")
              count_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gte: ... } } }' instead.\\")
              count_LT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lt: ... } } }' instead.\\")
              count_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lte: ... } } }' instead.\\")
              node: StarMoviesNodeAggregationWhereInput
            }

            input StarMoviesConnectFieldInput {
              connect: [MovieConnectInput!]
              where: MovieConnectWhere
            }

            type StarMoviesConnection {
              aggregate: StarMovieMoviesAggregateSelection!
              edges: [StarMoviesRelationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input StarMoviesConnectionAggregateInput {
              AND: [StarMoviesConnectionAggregateInput!]
              NOT: StarMoviesConnectionAggregateInput
              OR: [StarMoviesConnectionAggregateInput!]
              count: ConnectionAggregationCountFilterInput
              node: StarMoviesNodeAggregationWhereInput
            }

            input StarMoviesConnectionFilters {
              \\"\\"\\"Filter Stars by aggregating results on related StarMoviesConnections\\"\\"\\"
              aggregate: StarMoviesConnectionAggregateInput
              \\"\\"\\"
              Return Stars where all of the related StarMoviesConnections match this filter
              \\"\\"\\"
              all: StarMoviesConnectionWhere
              \\"\\"\\"
              Return Stars where none of the related StarMoviesConnections match this filter
              \\"\\"\\"
              none: StarMoviesConnectionWhere
              \\"\\"\\"
              Return Stars where one of the related StarMoviesConnections match this filter
              \\"\\"\\"
              single: StarMoviesConnectionWhere
              \\"\\"\\"
              Return Stars where some of the related StarMoviesConnections match this filter
              \\"\\"\\"
              some: StarMoviesConnectionWhere
            }

            input StarMoviesConnectionSort {
              node: MovieSort
            }

            input StarMoviesConnectionWhere {
              AND: [StarMoviesConnectionWhere!]
              NOT: StarMoviesConnectionWhere
              OR: [StarMoviesConnectionWhere!]
              node: MovieWhere
            }

            input StarMoviesCreateFieldInput {
              node: MovieCreateInput!
            }

            input StarMoviesDeleteFieldInput {
              delete: MovieDeleteInput
              where: StarMoviesConnectionWhere
            }

            input StarMoviesDisconnectFieldInput {
              disconnect: MovieDisconnectInput
              where: StarMoviesConnectionWhere
            }

            input StarMoviesFieldInput {
              connect: [StarMoviesConnectFieldInput!]
              create: [StarMoviesCreateFieldInput!]
            }

            input StarMoviesNodeAggregationWhereInput {
              AND: [StarMoviesNodeAggregationWhereInput!]
              NOT: StarMoviesNodeAggregationWhereInput
              OR: [StarMoviesNodeAggregationWhereInput!]
              actorCount: IntScalarAggregationFilters
              actorCount_AVERAGE_EQUAL: Float @deprecated(reason: \\"Please use the relevant generic filter 'actorCount: { average: { eq: ... } } }' instead.\\")
              actorCount_AVERAGE_GT: Float @deprecated(reason: \\"Please use the relevant generic filter 'actorCount: { average: { gt: ... } } }' instead.\\")
              actorCount_AVERAGE_GTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'actorCount: { average: { gte: ... } } }' instead.\\")
              actorCount_AVERAGE_LT: Float @deprecated(reason: \\"Please use the relevant generic filter 'actorCount: { average: { lt: ... } } }' instead.\\")
              actorCount_AVERAGE_LTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'actorCount: { average: { lte: ... } } }' instead.\\")
              actorCount_MAX_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'actorCount: { max: { eq: ... } } }' instead.\\")
              actorCount_MAX_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'actorCount: { max: { gt: ... } } }' instead.\\")
              actorCount_MAX_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'actorCount: { max: { gte: ... } } }' instead.\\")
              actorCount_MAX_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'actorCount: { max: { lt: ... } } }' instead.\\")
              actorCount_MAX_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'actorCount: { max: { lte: ... } } }' instead.\\")
              actorCount_MIN_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'actorCount: { min: { eq: ... } } }' instead.\\")
              actorCount_MIN_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'actorCount: { min: { gt: ... } } }' instead.\\")
              actorCount_MIN_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'actorCount: { min: { gte: ... } } }' instead.\\")
              actorCount_MIN_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'actorCount: { min: { lt: ... } } }' instead.\\")
              actorCount_MIN_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'actorCount: { min: { lte: ... } } }' instead.\\")
              actorCount_SUM_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'actorCount: { sum: { eq: ... } } }' instead.\\")
              actorCount_SUM_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'actorCount: { sum: { gt: ... } } }' instead.\\")
              actorCount_SUM_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'actorCount: { sum: { gte: ... } } }' instead.\\")
              actorCount_SUM_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'actorCount: { sum: { lt: ... } } }' instead.\\")
              actorCount_SUM_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'actorCount: { sum: { lte: ... } } }' instead.\\")
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
            }

            type StarMoviesRelationship {
              cursor: String!
              node: Movie!
            }

            input StarMoviesUpdateConnectionInput {
              node: MovieUpdateInput
              where: StarMoviesConnectionWhere
            }

            input StarMoviesUpdateFieldInput {
              connect: [StarMoviesConnectFieldInput!]
              create: [StarMoviesCreateFieldInput!]
              delete: [StarMoviesDeleteFieldInput!]
              disconnect: [StarMoviesDisconnectFieldInput!]
              update: StarMoviesUpdateConnectionInput
            }

            input StarUpdateInput {
              movies: [StarMoviesUpdateFieldInput!]
            }

            input StarWhere {
              AND: [StarWhere!]
              NOT: StarWhere
              OR: [StarWhere!]
              movies: MovieRelationshipFilters
              moviesAggregate: StarMoviesAggregateInput @deprecated(reason: \\"Aggregate filters are moved inside the moviesConnection filter, please use { moviesConnection: { aggregate: {...} } } instead\\")
              moviesConnection: StarMoviesConnectionFilters
              \\"\\"\\"
              Return Stars where all of the related StarMoviesConnections match this filter
              \\"\\"\\"
              moviesConnection_ALL: StarMoviesConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'moviesConnection: { all: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Stars where none of the related StarMoviesConnections match this filter
              \\"\\"\\"
              moviesConnection_NONE: StarMoviesConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'moviesConnection: { none: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Stars where one of the related StarMoviesConnections match this filter
              \\"\\"\\"
              moviesConnection_SINGLE: StarMoviesConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'moviesConnection: { single: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Stars where some of the related StarMoviesConnections match this filter
              \\"\\"\\"
              moviesConnection_SOME: StarMoviesConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'moviesConnection: { some: { node: ... } } }' instead.\\")
              \\"\\"\\"Return Stars where all of the related Movies match this filter\\"\\"\\"
              movies_ALL: MovieWhere @deprecated(reason: \\"Please use the relevant generic filter 'movies: { all: ... }' instead.\\")
              \\"\\"\\"Return Stars where none of the related Movies match this filter\\"\\"\\"
              movies_NONE: MovieWhere @deprecated(reason: \\"Please use the relevant generic filter 'movies: { none: ... }' instead.\\")
              \\"\\"\\"Return Stars where one of the related Movies match this filter\\"\\"\\"
              movies_SINGLE: MovieWhere @deprecated(reason: \\"Please use the relevant generic filter 'movies: {  single: ... }' instead.\\")
              \\"\\"\\"Return Stars where some of the related Movies match this filter\\"\\"\\"
              movies_SOME: MovieWhere @deprecated(reason: \\"Please use the relevant generic filter 'movies: {  some: ... }' instead.\\")
            }

            type StarsConnection {
              aggregate: StarAggregate!
              edges: [StarEdge!]!
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

            type UpdateMoviesMutationResponse {
              info: UpdateInfo!
              movies: [Movie!]!
            }

            type UpdatePeopleMutationResponse {
              info: UpdateInfo!
              people: [Person!]!
            }

            type UpdateStarsMutationResponse {
              info: UpdateInfo!
              stars: [Star!]!
            }"
        `);
    });
});
