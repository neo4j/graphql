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

describe("Comments", () => {
    test("Simple", async () => {
        const typeDefs = gql`
            "A custom scalar."
            scalar CustomScalar

            "An enumeration of movie genres."
            enum Genre {
                ACTION
                DRAMA
                ROMANCE
            }

            """
            A type describing a movie.
            """
            type Movie @node {
                id: ID
                "The number of actors who acted in the movie."
                actorCount: Int
                """
                The average rating for the movie.
                """
                averageRating: Float
                """
                Is the movie active?

                This is measured based on annual profit.
                """
                isActive: Boolean
                genre: Genre
                customScalar: CustomScalar
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

            \\"\\"\\"Boolean filters\\"\\"\\"
            input BooleanScalarFilters {
              eq: Boolean
            }

            \\"\\"\\"Boolean mutations\\"\\"\\"
            input BooleanScalarMutations {
              set: Boolean
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

            \\"\\"\\"A custom scalar.\\"\\"\\"
            scalar CustomScalar

            \\"\\"\\"CustomScalar filters\\"\\"\\"
            input CustomScalarScalarFilters {
              eq: CustomScalar
              in: [CustomScalar!]
            }

            \\"\\"\\"CustomScalar filters\\"\\"\\"
            input CustomScalarScalarMutations {
              set: CustomScalar
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

            \\"\\"\\"An enumeration of movie genres.\\"\\"\\"
            enum Genre {
              ACTION
              DRAMA
              ROMANCE
            }

            \\"\\"\\"Genre filters\\"\\"\\"
            input GenreEnumScalarFilters {
              eq: Genre
              in: [Genre!]
            }

            \\"\\"\\"Genre mutations\\"\\"\\"
            input GenreEnumScalarMutations {
              set: Genre
            }

            type IDAggregateSelection {
              longest: ID
              shortest: ID
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

            \\"\\"\\"A type describing a movie.\\"\\"\\"
            type Movie {
              \\"\\"\\"The number of actors who acted in the movie.\\"\\"\\"
              actorCount: Int
              \\"\\"\\"The average rating for the movie.\\"\\"\\"
              averageRating: Float
              customScalar: CustomScalar
              genre: Genre
              id: ID
              \\"\\"\\"
              Is the movie active?
              
              This is measured based on annual profit.
              \\"\\"\\"
              isActive: Boolean
            }

            type MovieAggregateSelection {
              actorCount: IntAggregateSelection!
              averageRating: FloatAggregateSelection!
              count: Int!
              id: IDAggregateSelection!
            }

            input MovieCreateInput {
              actorCount: Int
              averageRating: Float
              customScalar: CustomScalar
              genre: Genre
              id: ID
              isActive: Boolean
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
              customScalar: SortDirection
              genre: SortDirection
              id: SortDirection
              isActive: SortDirection
            }

            input MovieUpdateInput {
              actorCount: IntScalarMutations
              actorCount_DECREMENT: Int @deprecated(reason: \\"Please use the relevant generic mutation 'actorCount: { decrement: ... } }' instead.\\")
              actorCount_INCREMENT: Int @deprecated(reason: \\"Please use the relevant generic mutation 'actorCount: { increment: ... } }' instead.\\")
              actorCount_SET: Int @deprecated(reason: \\"Please use the generic mutation 'actorCount: { set: ... } }' instead.\\")
              averageRating: FloatScalarMutations
              averageRating_ADD: Float @deprecated(reason: \\"Please use the relevant generic mutation 'averageRating: { add: ... } }' instead.\\")
              averageRating_DIVIDE: Float @deprecated(reason: \\"Please use the relevant generic mutation 'averageRating: { divide: ... } }' instead.\\")
              averageRating_MULTIPLY: Float @deprecated(reason: \\"Please use the relevant generic mutation 'averageRating: { multiply: ... } }' instead.\\")
              averageRating_SET: Float @deprecated(reason: \\"Please use the generic mutation 'averageRating: { set: ... } }' instead.\\")
              averageRating_SUBTRACT: Float @deprecated(reason: \\"Please use the relevant generic mutation 'averageRating: { subtract: ... } }' instead.\\")
              customScalar: CustomScalarScalarMutations
              customScalar_SET: CustomScalar @deprecated(reason: \\"Please use the generic mutation 'customScalar: { set: ... } }' instead.\\")
              genre: GenreEnumScalarMutations
              genre_SET: Genre @deprecated(reason: \\"Please use the generic mutation 'genre: { set: ... } }' instead.\\")
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
              actorCount_EQ: Int
              actorCount_GT: Int
              actorCount_GTE: Int
              actorCount_IN: [Int]
              actorCount_LT: Int
              actorCount_LTE: Int
              averageRating: FloatScalarFilters
              averageRating_EQ: Float
              averageRating_GT: Float
              averageRating_GTE: Float
              averageRating_IN: [Float]
              averageRating_LT: Float
              averageRating_LTE: Float
              customScalar: CustomScalarScalarFilters
              customScalar_EQ: CustomScalar
              customScalar_IN: [CustomScalar]
              genre: GenreEnumScalarFilters
              genre_EQ: Genre
              genre_IN: [Genre]
              id: IDScalarFilters
              id_CONTAINS: ID
              id_ENDS_WITH: ID
              id_EQ: ID
              id_IN: [ID]
              id_STARTS_WITH: ID
              isActive: BooleanScalarFilters
              isActive_EQ: Boolean
            }

            type MoviesConnection {
              edges: [MovieEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            type Mutation {
              createMovies(input: [MovieCreateInput!]!): CreateMoviesMutationResponse!
              deleteMovies(where: MovieWhere): DeleteInfo!
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

    describe("Relationship", () => {
        test("Simple", async () => {
            const typeDefs = gql`
                type Actor @node {
                    name: String
                }

                type Movie @node {
                    id: ID
                    "Actors in Movie"
                    actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN)
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

                type Actor {
                  name: String
                }

                type ActorAggregateSelection {
                  count: Int!
                  name: StringAggregateSelection!
                }

                input ActorConnectWhere {
                  node: ActorWhere!
                }

                input ActorCreateInput {
                  name: String
                }

                type ActorEdge {
                  cursor: String!
                  node: Actor!
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

                type Movie {
                  \\"\\"\\"Actors in Movie\\"\\"\\"
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
                  count_EQ: Int
                  count_GT: Int
                  count_GTE: Int
                  count_LT: Int
                  count_LTE: Int
                  node: MovieActorsNodeAggregationWhereInput
                }

                input MovieActorsConnectFieldInput {
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

                type MovieActorsRelationship {
                  cursor: String!
                  node: Actor!
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
                  count: Int!
                  id: IDAggregateSelection!
                }

                input MovieCreateInput {
                  actors: MovieActorsFieldInput
                  id: ID
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
                  id: IDScalarFilters
                  id_CONTAINS: ID
                  id_ENDS_WITH: ID
                  id_EQ: ID
                  id_IN: [ID]
                  id_STARTS_WITH: ID
                }

                type MoviesConnection {
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

        test("Interface", async () => {
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
                    "Acted in Production"
                    actedIn: [Production!]! @relationship(type: "ACTED_IN", direction: OUT, properties: "ActedIn")
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
                  screenTime_EQ: Int
                  screenTime_GT: Int
                  screenTime_GTE: Int
                  screenTime_IN: [Int!]
                  screenTime_LT: Int
                  screenTime_LTE: Int
                }

                type Actor {
                  \\"\\"\\"Acted in Production\\"\\"\\"
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
                  title: StringScalarMutations
                  title_SET: String @deprecated(reason: \\"Please use the generic mutation 'title: { set: ... } }' instead.\\")
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
                }

                type UpdateSeriesMutationResponse {
                  info: UpdateInfo!
                  series: [Series!]!
                }"
            `);
        });

        test("Unions", async () => {
            const typeDefs = gql`
                union Search = Movie | Genre

                type Genre @node {
                    id: ID
                }

                type Movie @node {
                    id: ID
                    search: [Search!]! @relationship(type: "SEARCH", direction: OUT)
                    searchNoDirective: Search
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

                type CreateGenresMutationResponse {
                  genres: [Genre!]!
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

                type Genre {
                  id: ID
                }

                type GenreAggregateSelection {
                  count: Int!
                  id: IDAggregateSelection!
                }

                input GenreConnectWhere {
                  node: GenreWhere!
                }

                input GenreCreateInput {
                  id: ID
                }

                type GenreEdge {
                  cursor: String!
                  node: Genre!
                }

                \\"\\"\\"
                Fields to sort Genres by. The order in which sorts are applied is not guaranteed when specifying many fields in one GenreSort object.
                \\"\\"\\"
                input GenreSort {
                  id: SortDirection
                }

                input GenreUpdateInput {
                  id: IDScalarMutations
                  id_SET: ID @deprecated(reason: \\"Please use the generic mutation 'id: { set: ... } }' instead.\\")
                }

                input GenreWhere {
                  AND: [GenreWhere!]
                  NOT: GenreWhere
                  OR: [GenreWhere!]
                  id: IDScalarFilters
                  id_CONTAINS: ID
                  id_ENDS_WITH: ID
                  id_EQ: ID
                  id_IN: [ID]
                  id_STARTS_WITH: ID
                }

                type GenresConnection {
                  edges: [GenreEdge!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
                }

                type IDAggregateSelection {
                  longest: ID
                  shortest: ID
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

                type Movie {
                  id: ID
                  search(limit: Int, offset: Int, where: SearchWhere): [Search!]!
                  searchConnection(after: String, first: Int, where: MovieSearchConnectionWhere): MovieSearchConnection!
                  searchNoDirective: Search
                }

                type MovieAggregateSelection {
                  count: Int!
                  id: IDAggregateSelection!
                }

                input MovieConnectInput {
                  search: MovieSearchConnectInput
                }

                input MovieConnectWhere {
                  node: MovieWhere!
                }

                input MovieCreateInput {
                  id: ID
                  search: MovieSearchCreateInput
                }

                input MovieDeleteInput {
                  search: MovieSearchDeleteInput
                }

                input MovieDisconnectInput {
                  search: MovieSearchDisconnectInput
                }

                type MovieEdge {
                  cursor: String!
                  node: Movie!
                }

                input MovieSearchConnectInput {
                  Genre: [MovieSearchGenreConnectFieldInput!]
                  Movie: [MovieSearchMovieConnectFieldInput!]
                }

                type MovieSearchConnection {
                  edges: [MovieSearchRelationship!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
                }

                input MovieSearchConnectionFilters {
                  \\"\\"\\"
                  Return Movies where all of the related MovieSearchConnections match this filter
                  \\"\\"\\"
                  all: MovieSearchConnectionWhere
                  \\"\\"\\"
                  Return Movies where none of the related MovieSearchConnections match this filter
                  \\"\\"\\"
                  none: MovieSearchConnectionWhere
                  \\"\\"\\"
                  Return Movies where one of the related MovieSearchConnections match this filter
                  \\"\\"\\"
                  single: MovieSearchConnectionWhere
                  \\"\\"\\"
                  Return Movies where some of the related MovieSearchConnections match this filter
                  \\"\\"\\"
                  some: MovieSearchConnectionWhere
                }

                input MovieSearchConnectionWhere {
                  Genre: MovieSearchGenreConnectionWhere
                  Movie: MovieSearchMovieConnectionWhere
                }

                input MovieSearchCreateInput {
                  Genre: MovieSearchGenreFieldInput
                  Movie: MovieSearchMovieFieldInput
                }

                input MovieSearchDeleteInput {
                  Genre: [MovieSearchGenreDeleteFieldInput!]
                  Movie: [MovieSearchMovieDeleteFieldInput!]
                }

                input MovieSearchDisconnectInput {
                  Genre: [MovieSearchGenreDisconnectFieldInput!]
                  Movie: [MovieSearchMovieDisconnectFieldInput!]
                }

                input MovieSearchGenreConnectFieldInput {
                  where: GenreConnectWhere
                }

                input MovieSearchGenreConnectionWhere {
                  AND: [MovieSearchGenreConnectionWhere!]
                  NOT: MovieSearchGenreConnectionWhere
                  OR: [MovieSearchGenreConnectionWhere!]
                  node: GenreWhere
                }

                input MovieSearchGenreCreateFieldInput {
                  node: GenreCreateInput!
                }

                input MovieSearchGenreDeleteFieldInput {
                  where: MovieSearchGenreConnectionWhere
                }

                input MovieSearchGenreDisconnectFieldInput {
                  where: MovieSearchGenreConnectionWhere
                }

                input MovieSearchGenreFieldInput {
                  connect: [MovieSearchGenreConnectFieldInput!]
                  create: [MovieSearchGenreCreateFieldInput!]
                }

                input MovieSearchGenreUpdateConnectionInput {
                  node: GenreUpdateInput
                }

                input MovieSearchGenreUpdateFieldInput {
                  connect: [MovieSearchGenreConnectFieldInput!]
                  create: [MovieSearchGenreCreateFieldInput!]
                  delete: [MovieSearchGenreDeleteFieldInput!]
                  disconnect: [MovieSearchGenreDisconnectFieldInput!]
                  update: MovieSearchGenreUpdateConnectionInput
                  where: MovieSearchGenreConnectionWhere
                }

                input MovieSearchMovieConnectFieldInput {
                  connect: [MovieConnectInput!]
                  where: MovieConnectWhere
                }

                input MovieSearchMovieConnectionWhere {
                  AND: [MovieSearchMovieConnectionWhere!]
                  NOT: MovieSearchMovieConnectionWhere
                  OR: [MovieSearchMovieConnectionWhere!]
                  node: MovieWhere
                }

                input MovieSearchMovieCreateFieldInput {
                  node: MovieCreateInput!
                }

                input MovieSearchMovieDeleteFieldInput {
                  delete: MovieDeleteInput
                  where: MovieSearchMovieConnectionWhere
                }

                input MovieSearchMovieDisconnectFieldInput {
                  disconnect: MovieDisconnectInput
                  where: MovieSearchMovieConnectionWhere
                }

                input MovieSearchMovieFieldInput {
                  connect: [MovieSearchMovieConnectFieldInput!]
                  create: [MovieSearchMovieCreateFieldInput!]
                }

                input MovieSearchMovieUpdateConnectionInput {
                  node: MovieUpdateInput
                }

                input MovieSearchMovieUpdateFieldInput {
                  connect: [MovieSearchMovieConnectFieldInput!]
                  create: [MovieSearchMovieCreateFieldInput!]
                  delete: [MovieSearchMovieDeleteFieldInput!]
                  disconnect: [MovieSearchMovieDisconnectFieldInput!]
                  update: MovieSearchMovieUpdateConnectionInput
                  where: MovieSearchMovieConnectionWhere
                }

                type MovieSearchRelationship {
                  cursor: String!
                  node: Search!
                }

                input MovieSearchRelationshipFilters {
                  \\"\\"\\"Return Movies where all of the related Searches match this filter\\"\\"\\"
                  all: SearchWhere
                  \\"\\"\\"Return Movies where none of the related Searches match this filter\\"\\"\\"
                  none: SearchWhere
                  \\"\\"\\"Return Movies where one of the related Searches match this filter\\"\\"\\"
                  single: SearchWhere
                  \\"\\"\\"Return Movies where some of the related Searches match this filter\\"\\"\\"
                  some: SearchWhere
                }

                input MovieSearchUpdateInput {
                  Genre: [MovieSearchGenreUpdateFieldInput!]
                  Movie: [MovieSearchMovieUpdateFieldInput!]
                }

                \\"\\"\\"
                Fields to sort Movies by. The order in which sorts are applied is not guaranteed when specifying many fields in one MovieSort object.
                \\"\\"\\"
                input MovieSort {
                  id: SortDirection
                }

                input MovieUpdateInput {
                  id: IDScalarMutations
                  id_SET: ID @deprecated(reason: \\"Please use the generic mutation 'id: { set: ... } }' instead.\\")
                  search: MovieSearchUpdateInput
                }

                input MovieWhere {
                  AND: [MovieWhere!]
                  NOT: MovieWhere
                  OR: [MovieWhere!]
                  id: IDScalarFilters
                  id_CONTAINS: ID
                  id_ENDS_WITH: ID
                  id_EQ: ID
                  id_IN: [ID]
                  id_STARTS_WITH: ID
                  search: MovieSearchRelationshipFilters
                  searchConnection: MovieSearchConnectionFilters
                  \\"\\"\\"
                  Return Movies where all of the related MovieSearchConnections match this filter
                  \\"\\"\\"
                  searchConnection_ALL: MovieSearchConnectionWhere
                  \\"\\"\\"
                  Return Movies where none of the related MovieSearchConnections match this filter
                  \\"\\"\\"
                  searchConnection_NONE: MovieSearchConnectionWhere
                  \\"\\"\\"
                  Return Movies where one of the related MovieSearchConnections match this filter
                  \\"\\"\\"
                  searchConnection_SINGLE: MovieSearchConnectionWhere
                  \\"\\"\\"
                  Return Movies where some of the related MovieSearchConnections match this filter
                  \\"\\"\\"
                  searchConnection_SOME: MovieSearchConnectionWhere
                  \\"\\"\\"Return Movies where all of the related Searches match this filter\\"\\"\\"
                  search_ALL: SearchWhere
                  \\"\\"\\"Return Movies where none of the related Searches match this filter\\"\\"\\"
                  search_NONE: SearchWhere
                  \\"\\"\\"Return Movies where one of the related Searches match this filter\\"\\"\\"
                  search_SINGLE: SearchWhere
                  \\"\\"\\"Return Movies where some of the related Searches match this filter\\"\\"\\"
                  search_SOME: SearchWhere
                }

                type MoviesConnection {
                  edges: [MovieEdge!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
                }

                type Mutation {
                  createGenres(input: [GenreCreateInput!]!): CreateGenresMutationResponse!
                  createMovies(input: [MovieCreateInput!]!): CreateMoviesMutationResponse!
                  deleteGenres(where: GenreWhere): DeleteInfo!
                  deleteMovies(delete: MovieDeleteInput, where: MovieWhere): DeleteInfo!
                  updateGenres(update: GenreUpdateInput, where: GenreWhere): UpdateGenresMutationResponse!
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
                  genres(limit: Int, offset: Int, sort: [GenreSort!], where: GenreWhere): [Genre!]!
                  genresAggregate(where: GenreWhere): GenreAggregateSelection!
                  genresConnection(after: String, first: Int, sort: [GenreSort!], where: GenreWhere): GenresConnection!
                  movies(limit: Int, offset: Int, sort: [MovieSort!], where: MovieWhere): [Movie!]!
                  moviesAggregate(where: MovieWhere): MovieAggregateSelection!
                  moviesConnection(after: String, first: Int, sort: [MovieSort!], where: MovieWhere): MoviesConnection!
                  searches(limit: Int, offset: Int, where: SearchWhere): [Search!]!
                }

                union Search = Genre | Movie

                input SearchWhere {
                  Genre: GenreWhere
                  Movie: MovieWhere
                }

                \\"\\"\\"An enum for sorting in either ascending or descending order.\\"\\"\\"
                enum SortDirection {
                  \\"\\"\\"Sort by field values in ascending order.\\"\\"\\"
                  ASC
                  \\"\\"\\"Sort by field values in descending order.\\"\\"\\"
                  DESC
                }

                type UpdateGenresMutationResponse {
                  genres: [Genre!]!
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
});
