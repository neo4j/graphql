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

describe("Relationship", () => {
    test("Multi Relationship", async () => {
        const typeDefs = gql`
            type Actor @node {
                name: String
                movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT)
            }

            type Movie @node {
                id: ID
                actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN)
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
              movies(limit: Int, offset: Int, sort: [MovieSort!], where: MovieWhere): [Movie!]!
              moviesAggregate(where: MovieWhere): ActorMovieMoviesAggregationSelection
              moviesConnection(after: String, first: Int, sort: [ActorMoviesConnectionSort!], where: ActorMoviesConnectionWhere): ActorMoviesConnection!
              name: String
            }

            type ActorAggregate {
              node: ActorAggregateNode!
            }

            type ActorAggregateNode {
              count: Int!
              name: StringAggregateSelection!
            }

            type ActorAggregateSelection {
              count: Int!
              name: StringAggregateSelection!
            }

            input ActorConnectInput {
              movies: [ActorMoviesConnectFieldInput!]
            }

            input ActorConnectWhere {
              node: ActorWhere!
            }

            input ActorCreateInput {
              movies: ActorMoviesFieldInput
              name: String
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

            type ActorMovieMoviesAggregationSelection {
              count: Int!
            }

            input ActorMoviesAggregateInput {
              AND: [ActorMoviesAggregateInput!]
              NOT: ActorMoviesAggregateInput
              OR: [ActorMoviesAggregateInput!]
              count: IntScalarFilters
              count_EQ: Int
              count_GT: Int
              count_GTE: Int
              count_LT: Int
              count_LTE: Int
            }

            input ActorMoviesConnectFieldInput {
              connect: [MovieConnectInput!]
              where: MovieConnectWhere
            }

            type ActorMoviesConnection {
              edges: [ActorMoviesRelationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input ActorMoviesConnectionAggregateInput {
              AND: [ActorMoviesConnectionAggregateInput!]
              NOT: ActorMoviesConnectionAggregateInput
              OR: [ActorMoviesConnectionAggregateInput!]
              count: ConnectionAggregationCountFilterInput
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

            type ActorMoviesRelationship {
              cursor: String!
              node: Movie!
            }

            input ActorMoviesUpdateConnectionInput {
              node: MovieUpdateInput
            }

            input ActorMoviesUpdateFieldInput {
              connect: [ActorMoviesConnectFieldInput!]
              create: [ActorMoviesCreateFieldInput!]
              delete: [ActorMoviesDeleteFieldInput!]
              disconnect: [ActorMoviesDisconnectFieldInput!]
              update: ActorMoviesUpdateConnectionInput
              where: ActorMoviesConnectionWhere
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
              movies: [ActorMoviesUpdateFieldInput!]
              name: StringScalarMutations
              name_SET: String @deprecated(reason: \\"Please use the generic mutation 'name: { set: ... } }' instead.\\")
            }

            input ActorWhere {
              AND: [ActorWhere!]
              NOT: ActorWhere
              OR: [ActorWhere!]
              movies: MovieRelationshipFilters
              moviesAggregate: ActorMoviesAggregateInput
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
              name_IN: [String] @deprecated(reason: \\"Please use the relevant generic filter name: { in: ... }\\")
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

            type Movie {
              actors(limit: Int, offset: Int, sort: [ActorSort!], where: ActorWhere): [Actor!]!
              actorsAggregate(where: ActorWhere): MovieActorActorsAggregationSelection
              actorsConnection(after: String, first: Int, sort: [MovieActorsConnectionSort!], where: MovieActorsConnectionWhere): MovieActorsConnection!
              id: ID
            }

            type MovieActorActorsAggregationSelection {
              count: Int!
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
              count_EQ: Int
              count_GT: Int
              count_GTE: Int
              count_LT: Int
              count_LTE: Int
              node: MovieActorsNodeAggregationWhereInput
            }

            input MovieActorsConnectFieldInput {
              connect: [ActorConnectInput!]
              where: ActorConnectWhere
            }

            type MovieActorsConnection {
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
            }

            input MovieActorsUpdateConnectionInput {
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

            type MovieAggregate {
              node: MovieAggregateNode!
            }

            type MovieAggregateNode {
              count: Int!
            }

            type MovieAggregateSelection {
              count: Int!
            }

            input MovieConnectInput {
              actors: [MovieActorsConnectFieldInput!]
            }

            input MovieConnectWhere {
              node: MovieWhere!
            }

            input MovieCreateInput {
              actors: MovieActorsFieldInput
              id: ID
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
            }

            input MovieUpdateInput {
              actors: [MovieActorsUpdateFieldInput!]
              id: IDScalarMutations
              id_SET: ID @deprecated(reason: \\"Please use the generic mutation 'id: { set: ... } }' instead.\\")
            }

            input MovieWhere {
              AND: [MovieWhere!]
              NOT: MovieWhere
              OR: [MovieWhere!]
              actors: ActorRelationshipFilters
              actorsAggregate: MovieActorsAggregateInput
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
              id_IN: [ID] @deprecated(reason: \\"Please use the relevant generic filter id: { in: ... }\\")
              id_STARTS_WITH: ID @deprecated(reason: \\"Please use the relevant generic filter id: { startsWith: ... }\\")
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
              actors(limit: Int, offset: Int, sort: [ActorSort!], where: ActorWhere): [Actor!]!
              actorsAggregate(where: ActorWhere): ActorAggregateSelection! @deprecated(reason: \\"Please use the explicit the field \\\\\\"aggregate\\\\\\" inside \\\\\\"actorsConnection\\\\\\"\\")
              actorsConnection(after: String, first: Int, sort: [ActorSort!], where: ActorWhere): ActorsConnection!
              movies(limit: Int, offset: Int, sort: [MovieSort!], where: MovieWhere): [Movie!]!
              moviesAggregate(where: MovieWhere): MovieAggregateSelection! @deprecated(reason: \\"Please use the explicit the field \\\\\\"aggregate\\\\\\" inside \\\\\\"moviesConnection\\\\\\"\\")
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
});
