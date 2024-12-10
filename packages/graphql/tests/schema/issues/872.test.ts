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

describe("https://github.com/neo4j/graphql/issues/872", () => {
    test("a single type should be created for multiple actorOnCreate", async () => {
        const typeDefs = gql`
            type Movie @node {
                title: String!
                id: ID! @id
            }

            type Actor @node {
                name: String!
                movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT)
            }

            type Actor2 @node {
                name: String!
                movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT)
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
              name: String!
            }

            type Actor2 {
              movies(limit: Int, offset: Int, sort: [MovieSort!], where: MovieWhere): [Movie!]!
              moviesAggregate(where: MovieWhere): Actor2MovieMoviesAggregationSelection
              moviesConnection(after: String, first: Int, sort: [Actor2MoviesConnectionSort!], where: Actor2MoviesConnectionWhere): Actor2MoviesConnection!
              name: String!
            }

            type Actor2AggregateSelection {
              count: Int!
              name: StringAggregateSelection!
            }

            input Actor2CreateInput {
              movies: Actor2MoviesFieldInput
              name: String!
            }

            input Actor2DeleteInput {
              movies: [Actor2MoviesDeleteFieldInput!]
            }

            type Actor2Edge {
              cursor: String!
              node: Actor2!
            }

            type Actor2MovieMoviesAggregationSelection {
              count: Int!
              node: Actor2MovieMoviesNodeAggregateSelection
            }

            type Actor2MovieMoviesNodeAggregateSelection {
              id: IDAggregateSelection!
              title: StringAggregateSelection!
            }

            input Actor2MoviesAggregateInput {
              AND: [Actor2MoviesAggregateInput!]
              NOT: Actor2MoviesAggregateInput
              OR: [Actor2MoviesAggregateInput!]
              count_EQ: Int
              count_GT: Int
              count_GTE: Int
              count_LT: Int
              count_LTE: Int
              node: Actor2MoviesNodeAggregationWhereInput
            }

            input Actor2MoviesConnectFieldInput {
              where: MovieConnectWhere
            }

            type Actor2MoviesConnection {
              edges: [Actor2MoviesRelationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input Actor2MoviesConnectionSort {
              node: MovieSort
            }

            input Actor2MoviesConnectionWhere {
              AND: [Actor2MoviesConnectionWhere!]
              NOT: Actor2MoviesConnectionWhere
              OR: [Actor2MoviesConnectionWhere!]
              node: MovieWhere
            }

            input Actor2MoviesCreateFieldInput {
              node: MovieCreateInput!
            }

            input Actor2MoviesDeleteFieldInput {
              where: Actor2MoviesConnectionWhere
            }

            input Actor2MoviesDisconnectFieldInput {
              where: Actor2MoviesConnectionWhere
            }

            input Actor2MoviesFieldInput {
              connect: [Actor2MoviesConnectFieldInput!]
              create: [Actor2MoviesCreateFieldInput!]
            }

            input Actor2MoviesNodeAggregationWhereInput {
              AND: [Actor2MoviesNodeAggregationWhereInput!]
              NOT: Actor2MoviesNodeAggregationWhereInput
              OR: [Actor2MoviesNodeAggregationWhereInput!]
              id: IDScalarAggregationFilters
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
              title: StringScalarAggregationFilters
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

            type Actor2MoviesRelationship {
              cursor: String!
              node: Movie!
            }

            input Actor2MoviesUpdateConnectionInput {
              node: MovieUpdateInput
            }

            input Actor2MoviesUpdateFieldInput {
              connect: [Actor2MoviesConnectFieldInput!]
              create: [Actor2MoviesCreateFieldInput!]
              delete: [Actor2MoviesDeleteFieldInput!]
              disconnect: [Actor2MoviesDisconnectFieldInput!]
              update: Actor2MoviesUpdateConnectionInput
              where: Actor2MoviesConnectionWhere
            }

            \\"\\"\\"
            Fields to sort Actor2s by. The order in which sorts are applied is not guaranteed when specifying many fields in one Actor2Sort object.
            \\"\\"\\"
            input Actor2Sort {
              name: SortDirection
            }

            input Actor2UpdateInput {
              movies: [Actor2MoviesUpdateFieldInput!]
              name: StringScalarMutations
              name_SET: String
            }

            input Actor2Where {
              AND: [Actor2Where!]
              NOT: Actor2Where
              OR: [Actor2Where!]
              moviesAggregate: Actor2MoviesAggregateInput
              \\"\\"\\"
              Return Actor2s where all of the related Actor2MoviesConnections match this filter
              \\"\\"\\"
              moviesConnection_ALL: Actor2MoviesConnectionWhere
              \\"\\"\\"
              Return Actor2s where none of the related Actor2MoviesConnections match this filter
              \\"\\"\\"
              moviesConnection_NONE: Actor2MoviesConnectionWhere
              \\"\\"\\"
              Return Actor2s where one of the related Actor2MoviesConnections match this filter
              \\"\\"\\"
              moviesConnection_SINGLE: Actor2MoviesConnectionWhere
              \\"\\"\\"
              Return Actor2s where some of the related Actor2MoviesConnections match this filter
              \\"\\"\\"
              moviesConnection_SOME: Actor2MoviesConnectionWhere
              \\"\\"\\"Return Actor2s where all of the related Movies match this filter\\"\\"\\"
              movies_ALL: MovieWhere
              \\"\\"\\"Return Actor2s where none of the related Movies match this filter\\"\\"\\"
              movies_NONE: MovieWhere
              \\"\\"\\"Return Actor2s where one of the related Movies match this filter\\"\\"\\"
              movies_SINGLE: MovieWhere
              \\"\\"\\"Return Actor2s where some of the related Movies match this filter\\"\\"\\"
              movies_SOME: MovieWhere
              name: StringScalarFilters
              name_CONTAINS: String
              name_ENDS_WITH: String
              name_EQ: String
              name_IN: [String!]
              name_STARTS_WITH: String
            }

            type Actor2sConnection {
              edges: [Actor2Edge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            type ActorAggregateSelection {
              count: Int!
              name: StringAggregateSelection!
            }

            input ActorCreateInput {
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

            type ActorMovieMoviesAggregationSelection {
              count: Int!
              node: ActorMovieMoviesNodeAggregateSelection
            }

            type ActorMovieMoviesNodeAggregateSelection {
              id: IDAggregateSelection!
              title: StringAggregateSelection!
            }

            input ActorMoviesAggregateInput {
              AND: [ActorMoviesAggregateInput!]
              NOT: ActorMoviesAggregateInput
              OR: [ActorMoviesAggregateInput!]
              count_EQ: Int
              count_GT: Int
              count_GTE: Int
              count_LT: Int
              count_LTE: Int
              node: ActorMoviesNodeAggregationWhereInput
            }

            input ActorMoviesConnectFieldInput {
              where: MovieConnectWhere
            }

            type ActorMoviesConnection {
              edges: [ActorMoviesRelationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
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
              id: IDScalarAggregationFilters
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
              title: StringScalarAggregationFilters
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

            \\"\\"\\"
            Fields to sort Actors by. The order in which sorts are applied is not guaranteed when specifying many fields in one ActorSort object.
            \\"\\"\\"
            input ActorSort {
              name: SortDirection
            }

            input ActorUpdateInput {
              movies: [ActorMoviesUpdateFieldInput!]
              name: StringScalarMutations
              name_SET: String
            }

            input ActorWhere {
              AND: [ActorWhere!]
              NOT: ActorWhere
              OR: [ActorWhere!]
              moviesAggregate: ActorMoviesAggregateInput
              \\"\\"\\"
              Return Actors where all of the related ActorMoviesConnections match this filter
              \\"\\"\\"
              moviesConnection_ALL: ActorMoviesConnectionWhere
              \\"\\"\\"
              Return Actors where none of the related ActorMoviesConnections match this filter
              \\"\\"\\"
              moviesConnection_NONE: ActorMoviesConnectionWhere
              \\"\\"\\"
              Return Actors where one of the related ActorMoviesConnections match this filter
              \\"\\"\\"
              moviesConnection_SINGLE: ActorMoviesConnectionWhere
              \\"\\"\\"
              Return Actors where some of the related ActorMoviesConnections match this filter
              \\"\\"\\"
              moviesConnection_SOME: ActorMoviesConnectionWhere
              \\"\\"\\"Return Actors where all of the related Movies match this filter\\"\\"\\"
              movies_ALL: MovieWhere
              \\"\\"\\"Return Actors where none of the related Movies match this filter\\"\\"\\"
              movies_NONE: MovieWhere
              \\"\\"\\"Return Actors where one of the related Movies match this filter\\"\\"\\"
              movies_SINGLE: MovieWhere
              \\"\\"\\"Return Actors where some of the related Movies match this filter\\"\\"\\"
              movies_SOME: MovieWhere
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

            type CreateActor2sMutationResponse {
              actor2s: [Actor2!]!
              info: CreateInfo!
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
              id: ID!
              title: String!
            }

            type MovieAggregateSelection {
              count: Int!
              id: IDAggregateSelection!
              title: StringAggregateSelection!
            }

            input MovieConnectWhere {
              node: MovieWhere!
            }

            input MovieCreateInput {
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
              id: SortDirection
              title: SortDirection
            }

            input MovieUpdateInput {
              title: StringScalarMutations
              title_SET: String
            }

            input MovieWhere {
              AND: [MovieWhere!]
              NOT: MovieWhere
              OR: [MovieWhere!]
              id: IDScalarFilters
              id_CONTAINS: ID
              id_ENDS_WITH: ID
              id_EQ: ID
              id_IN: [ID!]
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
              createActor2s(input: [Actor2CreateInput!]!): CreateActor2sMutationResponse!
              createActors(input: [ActorCreateInput!]!): CreateActorsMutationResponse!
              createMovies(input: [MovieCreateInput!]!): CreateMoviesMutationResponse!
              deleteActor2s(delete: Actor2DeleteInput, where: Actor2Where): DeleteInfo!
              deleteActors(delete: ActorDeleteInput, where: ActorWhere): DeleteInfo!
              deleteMovies(where: MovieWhere): DeleteInfo!
              updateActor2s(update: Actor2UpdateInput, where: Actor2Where): UpdateActor2sMutationResponse!
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
              actor2s(limit: Int, offset: Int, sort: [Actor2Sort!], where: Actor2Where): [Actor2!]!
              actor2sAggregate(where: Actor2Where): Actor2AggregateSelection!
              actor2sConnection(after: String, first: Int, sort: [Actor2Sort!], where: Actor2Where): Actor2sConnection!
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

            type UpdateActor2sMutationResponse {
              actor2s: [Actor2!]!
              info: UpdateInfo!
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
