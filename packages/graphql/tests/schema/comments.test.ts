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
import { lexicographicSortSchema } from "graphql/utilities";
import { gql } from "apollo-server";
import { Neo4jGraphQL } from "../../src";

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
            type Movie {
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
        const neoSchema = new Neo4jGraphQL({ typeDefs });
        const printedSchema = printSchemaWithDirectives(lexicographicSortSchema(await neoSchema.getSchema()));

        expect(printedSchema).toMatchInlineSnapshot(`
            "schema {
              query: Query
              mutation: Mutation
            }

            type CreateInfo {
              bookmark: String
              nodesCreated: Int!
              relationshipsCreated: Int!
            }

            type CreateMoviesMutationResponse {
              info: CreateInfo!
              movies: [Movie!]!
            }

            \\"\\"\\"A custom scalar.\\"\\"\\"
            scalar CustomScalar

            type DeleteInfo {
              bookmark: String
              nodesDeleted: Int!
              relationshipsDeleted: Int!
            }

            type FloatAggregateSelectionNullable {
              average: Float
              max: Float
              min: Float
              sum: Float
            }

            \\"\\"\\"An enumeration of movie genres.\\"\\"\\"
            enum Genre {
              ACTION
              DRAMA
              ROMANCE
            }

            type IDAggregateSelectionNullable {
              longest: ID
              shortest: ID
            }

            type IntAggregateSelectionNullable {
              average: Float
              max: Int
              min: Int
              sum: Int
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
              actorCount: IntAggregateSelectionNullable!
              averageRating: FloatAggregateSelectionNullable!
              count: Int!
              id: IDAggregateSelectionNullable!
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

            input MovieOptions {
              limit: Int
              offset: Int
              \\"\\"\\"
              Specify one or more MovieSort objects to sort Movies by. The sorts will be applied in the order in which they are arranged in the array.
              \\"\\"\\"
              sort: [MovieSort!]
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
              actorCount: Int
              averageRating: Float
              customScalar: CustomScalar
              genre: Genre
              id: ID
              isActive: Boolean
            }

            input MovieWhere {
              AND: [MovieWhere!]
              OR: [MovieWhere!]
              actorCount: Int
              actorCount_GT: Int
              actorCount_GTE: Int
              actorCount_IN: [Int]
              actorCount_LT: Int
              actorCount_LTE: Int
              actorCount_NOT: Int
              actorCount_NOT_IN: [Int]
              averageRating: Float
              averageRating_GT: Float
              averageRating_GTE: Float
              averageRating_IN: [Float]
              averageRating_LT: Float
              averageRating_LTE: Float
              averageRating_NOT: Float
              averageRating_NOT_IN: [Float]
              customScalar: CustomScalar
              genre: Genre
              genre_IN: [Genre]
              genre_NOT: Genre
              genre_NOT_IN: [Genre]
              id: ID
              id_CONTAINS: ID
              id_ENDS_WITH: ID
              id_IN: [ID]
              id_NOT: ID
              id_NOT_CONTAINS: ID
              id_NOT_ENDS_WITH: ID
              id_NOT_IN: [ID]
              id_NOT_STARTS_WITH: ID
              id_STARTS_WITH: ID
              isActive: Boolean
              isActive_NOT: Boolean
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
              movies(options: MovieOptions, where: MovieWhere): [Movie!]!
              moviesAggregate(where: MovieWhere): MovieAggregateSelection!
              moviesConnection(after: String, first: Int, sort: [MovieSort], where: MovieWhere): MoviesConnection!
            }

            enum SortDirection {
              \\"\\"\\"Sort by field values in ascending order.\\"\\"\\"
              ASC
              \\"\\"\\"Sort by field values in descending order.\\"\\"\\"
              DESC
            }

            type UpdateInfo {
              bookmark: String
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
                type Actor {
                    name: String
                }

                type Movie {
                    id: ID
                    "Actors in Movie"
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
                  name: String
                }

                type ActorAggregateSelection {
                  count: Int!
                  name: StringAggregateSelectionNullable!
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

                input ActorOptions {
                  limit: Int
                  offset: Int
                  \\"\\"\\"
                  Specify one or more ActorSort objects to sort Actors by. The sorts will be applied in the order in which they are arranged in the array.
                  \\"\\"\\"
                  sort: [ActorSort!]
                }

                \\"\\"\\"
                Fields to sort Actors by. The order in which sorts are applied is not guaranteed when specifying many fields in one ActorSort object.
                \\"\\"\\"
                input ActorSort {
                  name: SortDirection
                }

                input ActorUpdateInput {
                  name: String
                }

                input ActorWhere {
                  AND: [ActorWhere!]
                  OR: [ActorWhere!]
                  name: String
                  name_CONTAINS: String
                  name_ENDS_WITH: String
                  name_IN: [String]
                  name_NOT: String
                  name_NOT_CONTAINS: String
                  name_NOT_ENDS_WITH: String
                  name_NOT_IN: [String]
                  name_NOT_STARTS_WITH: String
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

                type CreateInfo {
                  bookmark: String
                  nodesCreated: Int!
                  relationshipsCreated: Int!
                }

                type CreateMoviesMutationResponse {
                  info: CreateInfo!
                  movies: [Movie!]!
                }

                type DeleteInfo {
                  bookmark: String
                  nodesDeleted: Int!
                  relationshipsDeleted: Int!
                }

                type IDAggregateSelectionNullable {
                  longest: ID
                  shortest: ID
                }

                type Movie {
                  \\"\\"\\"Actors in Movie\\"\\"\\"
                  actors(directed: Boolean = true, options: ActorOptions, where: ActorWhere): [Actor!]!
                  actorsAggregate(directed: Boolean = true, where: ActorWhere): MovieActorActorsAggregationSelection
                  actorsConnection(after: String, directed: Boolean = true, first: Int, sort: [MovieActorsConnectionSort!], where: MovieActorsConnectionWhere): MovieActorsConnection!
                  id: ID
                }

                type MovieActorActorsAggregationSelection {
                  count: Int!
                  node: MovieActorActorsNodeAggregateSelection
                }

                type MovieActorActorsNodeAggregateSelection {
                  name: StringAggregateSelectionNullable!
                }

                input MovieActorsAggregateInput {
                  AND: [MovieActorsAggregateInput!]
                  OR: [MovieActorsAggregateInput!]
                  count: Int
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

                input MovieActorsConnectionSort {
                  node: ActorSort
                }

                input MovieActorsConnectionWhere {
                  AND: [MovieActorsConnectionWhere!]
                  OR: [MovieActorsConnectionWhere!]
                  node: ActorWhere
                  node_NOT: ActorWhere
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
                  OR: [MovieActorsNodeAggregationWhereInput!]
                  name_AVERAGE_EQUAL: Float
                  name_AVERAGE_GT: Float
                  name_AVERAGE_GTE: Float
                  name_AVERAGE_LT: Float
                  name_AVERAGE_LTE: Float
                  name_EQUAL: String
                  name_GT: Int
                  name_GTE: Int
                  name_LONGEST_EQUAL: Int
                  name_LONGEST_GT: Int
                  name_LONGEST_GTE: Int
                  name_LONGEST_LT: Int
                  name_LONGEST_LTE: Int
                  name_LT: Int
                  name_LTE: Int
                  name_SHORTEST_EQUAL: Int
                  name_SHORTEST_GT: Int
                  name_SHORTEST_GTE: Int
                  name_SHORTEST_LT: Int
                  name_SHORTEST_LTE: Int
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

                type MovieAggregateSelection {
                  count: Int!
                  id: IDAggregateSelectionNullable!
                }

                input MovieConnectInput {
                  actors: [MovieActorsConnectFieldInput!]
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

                input MovieOptions {
                  limit: Int
                  offset: Int
                  \\"\\"\\"
                  Specify one or more MovieSort objects to sort Movies by. The sorts will be applied in the order in which they are arranged in the array.
                  \\"\\"\\"
                  sort: [MovieSort!]
                }

                input MovieRelationInput {
                  actors: [MovieActorsCreateFieldInput!]
                }

                \\"\\"\\"
                Fields to sort Movies by. The order in which sorts are applied is not guaranteed when specifying many fields in one MovieSort object.
                \\"\\"\\"
                input MovieSort {
                  id: SortDirection
                }

                input MovieUpdateInput {
                  actors: [MovieActorsUpdateFieldInput!]
                  id: ID
                }

                input MovieWhere {
                  AND: [MovieWhere!]
                  OR: [MovieWhere!]
                  actors: ActorWhere @deprecated(reason: \\"Use \`actors_SOME\` instead.\\")
                  actorsAggregate: MovieActorsAggregateInput
                  actorsConnection: MovieActorsConnectionWhere @deprecated(reason: \\"Use \`actorsConnection_SOME\` instead.\\")
                  actorsConnection_ALL: MovieActorsConnectionWhere
                  actorsConnection_NONE: MovieActorsConnectionWhere
                  actorsConnection_NOT: MovieActorsConnectionWhere @deprecated(reason: \\"Use \`actorsConnection_NONE\` instead.\\")
                  actorsConnection_SINGLE: MovieActorsConnectionWhere
                  actorsConnection_SOME: MovieActorsConnectionWhere
                  \\"\\"\\"Return Movies where all of the related Actors match this filter\\"\\"\\"
                  actors_ALL: ActorWhere
                  \\"\\"\\"Return Movies where none of the related Actors match this filter\\"\\"\\"
                  actors_NONE: ActorWhere
                  actors_NOT: ActorWhere @deprecated(reason: \\"Use \`actors_NONE\` instead.\\")
                  \\"\\"\\"Return Movies where one of the related Actors match this filter\\"\\"\\"
                  actors_SINGLE: ActorWhere
                  \\"\\"\\"Return Movies where some of the related Actors match this filter\\"\\"\\"
                  actors_SOME: ActorWhere
                  id: ID
                  id_CONTAINS: ID
                  id_ENDS_WITH: ID
                  id_IN: [ID]
                  id_NOT: ID
                  id_NOT_CONTAINS: ID
                  id_NOT_ENDS_WITH: ID
                  id_NOT_IN: [ID]
                  id_NOT_STARTS_WITH: ID
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
                  updateMovies(connect: MovieConnectInput, create: MovieRelationInput, delete: MovieDeleteInput, disconnect: MovieDisconnectInput, update: MovieUpdateInput, where: MovieWhere): UpdateMoviesMutationResponse!
                }

                \\"\\"\\"Pagination information (Relay)\\"\\"\\"
                type PageInfo {
                  endCursor: String
                  hasNextPage: Boolean!
                  hasPreviousPage: Boolean!
                  startCursor: String
                }

                type Query {
                  actors(options: ActorOptions, where: ActorWhere): [Actor!]!
                  actorsAggregate(where: ActorWhere): ActorAggregateSelection!
                  actorsConnection(after: String, first: Int, sort: [ActorSort], where: ActorWhere): ActorsConnection!
                  movies(options: MovieOptions, where: MovieWhere): [Movie!]!
                  moviesAggregate(where: MovieWhere): MovieAggregateSelection!
                  moviesConnection(after: String, first: Int, sort: [MovieSort], where: MovieWhere): MoviesConnection!
                }

                enum SortDirection {
                  \\"\\"\\"Sort by field values in ascending order.\\"\\"\\"
                  ASC
                  \\"\\"\\"Sort by field values in descending order.\\"\\"\\"
                  DESC
                }

                type StringAggregateSelectionNullable {
                  longest: String
                  shortest: String
                }

                type UpdateActorsMutationResponse {
                  actors: [Actor!]!
                  info: UpdateInfo!
                }

                type UpdateInfo {
                  bookmark: String
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

                type Movie implements Production {
                    title: String!
                    runtime: Int!
                }

                type Series implements Production {
                    title: String!
                    episodes: Int!
                }

                interface ActedIn @relationshipProperties {
                    screenTime: Int!
                }

                type Actor {
                    name: String!
                    "Acted in Production"
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

                interface ActedIn {
                  screenTime: Int!
                }

                input ActedInCreateInput {
                  screenTime: Int!
                }

                input ActedInSort {
                  screenTime: SortDirection
                }

                input ActedInUpdateInput {
                  screenTime: Int
                }

                input ActedInWhere {
                  AND: [ActedInWhere!]
                  OR: [ActedInWhere!]
                  screenTime: Int
                  screenTime_GT: Int
                  screenTime_GTE: Int
                  screenTime_IN: [Int!]
                  screenTime_LT: Int
                  screenTime_LTE: Int
                  screenTime_NOT: Int
                  screenTime_NOT_IN: [Int!]
                }

                type Actor {
                  \\"\\"\\"Acted in Production\\"\\"\\"
                  actedIn(directed: Boolean = true, options: ProductionOptions, where: ProductionWhere): [Production!]!
                  actedInConnection(after: String, directed: Boolean = true, first: Int, sort: [ActorActedInConnectionSort!], where: ActorActedInConnectionWhere): ActorActedInConnection!
                  name: String!
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

                input ActorActedInConnectionSort {
                  edge: ActedInSort
                  node: ProductionSort
                }

                input ActorActedInConnectionWhere {
                  AND: [ActorActedInConnectionWhere!]
                  OR: [ActorActedInConnectionWhere!]
                  edge: ActedInWhere
                  edge_NOT: ActedInWhere
                  node: ProductionWhere
                  node_NOT: ProductionWhere
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

                type ActorActedInRelationship implements ActedIn {
                  cursor: String!
                  node: Production!
                  screenTime: Int!
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
                  name: StringAggregateSelectionNonNullable!
                }

                input ActorConnectInput {
                  actedIn: [ActorActedInConnectFieldInput!]
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

                input ActorOptions {
                  limit: Int
                  offset: Int
                  \\"\\"\\"
                  Specify one or more ActorSort objects to sort Actors by. The sorts will be applied in the order in which they are arranged in the array.
                  \\"\\"\\"
                  sort: [ActorSort!]
                }

                input ActorRelationInput {
                  actedIn: [ActorActedInCreateFieldInput!]
                }

                \\"\\"\\"
                Fields to sort Actors by. The order in which sorts are applied is not guaranteed when specifying many fields in one ActorSort object.
                \\"\\"\\"
                input ActorSort {
                  name: SortDirection
                }

                input ActorUpdateInput {
                  actedIn: [ActorActedInUpdateFieldInput!]
                  name: String
                }

                input ActorWhere {
                  AND: [ActorWhere!]
                  OR: [ActorWhere!]
                  actedInConnection: ActorActedInConnectionWhere @deprecated(reason: \\"Use \`actedInConnection_SOME\` instead.\\")
                  actedInConnection_ALL: ActorActedInConnectionWhere
                  actedInConnection_NONE: ActorActedInConnectionWhere
                  actedInConnection_NOT: ActorActedInConnectionWhere @deprecated(reason: \\"Use \`actedInConnection_NONE\` instead.\\")
                  actedInConnection_SINGLE: ActorActedInConnectionWhere
                  actedInConnection_SOME: ActorActedInConnectionWhere
                  name: String
                  name_CONTAINS: String
                  name_ENDS_WITH: String
                  name_IN: [String!]
                  name_NOT: String
                  name_NOT_CONTAINS: String
                  name_NOT_ENDS_WITH: String
                  name_NOT_IN: [String!]
                  name_NOT_STARTS_WITH: String
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

                type CreateInfo {
                  bookmark: String
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

                type DeleteInfo {
                  bookmark: String
                  nodesDeleted: Int!
                  relationshipsDeleted: Int!
                }

                type IntAggregateSelectionNonNullable {
                  average: Float!
                  max: Int!
                  min: Int!
                  sum: Int!
                }

                type Movie implements Production {
                  runtime: Int!
                  title: String!
                }

                type MovieAggregateSelection {
                  count: Int!
                  runtime: IntAggregateSelectionNonNullable!
                  title: StringAggregateSelectionNonNullable!
                }

                input MovieCreateInput {
                  runtime: Int!
                  title: String!
                }

                type MovieEdge {
                  cursor: String!
                  node: Movie!
                }

                input MovieOptions {
                  limit: Int
                  offset: Int
                  \\"\\"\\"
                  Specify one or more MovieSort objects to sort Movies by. The sorts will be applied in the order in which they are arranged in the array.
                  \\"\\"\\"
                  sort: [MovieSort!]
                }

                \\"\\"\\"
                Fields to sort Movies by. The order in which sorts are applied is not guaranteed when specifying many fields in one MovieSort object.
                \\"\\"\\"
                input MovieSort {
                  runtime: SortDirection
                  title: SortDirection
                }

                input MovieUpdateInput {
                  runtime: Int
                  title: String
                }

                input MovieWhere {
                  AND: [MovieWhere!]
                  OR: [MovieWhere!]
                  runtime: Int
                  runtime_GT: Int
                  runtime_GTE: Int
                  runtime_IN: [Int!]
                  runtime_LT: Int
                  runtime_LTE: Int
                  runtime_NOT: Int
                  runtime_NOT_IN: [Int!]
                  title: String
                  title_CONTAINS: String
                  title_ENDS_WITH: String
                  title_IN: [String!]
                  title_NOT: String
                  title_NOT_CONTAINS: String
                  title_NOT_ENDS_WITH: String
                  title_NOT_IN: [String!]
                  title_NOT_STARTS_WITH: String
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
                  updateActors(connect: ActorConnectInput, create: ActorRelationInput, delete: ActorDeleteInput, disconnect: ActorDisconnectInput, update: ActorUpdateInput, where: ActorWhere): UpdateActorsMutationResponse!
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

                input ProductionConnectWhere {
                  node: ProductionWhere!
                }

                input ProductionCreateInput {
                  Movie: MovieCreateInput
                  Series: SeriesCreateInput
                }

                input ProductionImplementationsUpdateInput {
                  Movie: MovieUpdateInput
                  Series: SeriesUpdateInput
                }

                input ProductionImplementationsWhere {
                  Movie: MovieWhere
                  Series: SeriesWhere
                }

                input ProductionOptions {
                  limit: Int
                  offset: Int
                  \\"\\"\\"
                  Specify one or more ProductionSort objects to sort Productions by. The sorts will be applied in the order in which they are arranged in the array.
                  \\"\\"\\"
                  sort: [ProductionSort]
                }

                \\"\\"\\"
                Fields to sort Productions by. The order in which sorts are applied is not guaranteed when specifying many fields in one ProductionSort object.
                \\"\\"\\"
                input ProductionSort {
                  title: SortDirection
                }

                input ProductionUpdateInput {
                  _on: ProductionImplementationsUpdateInput
                  title: String
                }

                input ProductionWhere {
                  _on: ProductionImplementationsWhere
                  title: String
                  title_CONTAINS: String
                  title_ENDS_WITH: String
                  title_IN: [String!]
                  title_NOT: String
                  title_NOT_CONTAINS: String
                  title_NOT_ENDS_WITH: String
                  title_NOT_IN: [String!]
                  title_NOT_STARTS_WITH: String
                  title_STARTS_WITH: String
                }

                type Query {
                  actors(options: ActorOptions, where: ActorWhere): [Actor!]!
                  actorsAggregate(where: ActorWhere): ActorAggregateSelection!
                  actorsConnection(after: String, first: Int, sort: [ActorSort], where: ActorWhere): ActorsConnection!
                  movies(options: MovieOptions, where: MovieWhere): [Movie!]!
                  moviesAggregate(where: MovieWhere): MovieAggregateSelection!
                  moviesConnection(after: String, first: Int, sort: [MovieSort], where: MovieWhere): MoviesConnection!
                  series(options: SeriesOptions, where: SeriesWhere): [Series!]!
                  seriesAggregate(where: SeriesWhere): SeriesAggregateSelection!
                  seriesConnection(after: String, first: Int, sort: [SeriesSort], where: SeriesWhere): SeriesConnection!
                }

                type Series implements Production {
                  episodes: Int!
                  title: String!
                }

                type SeriesAggregateSelection {
                  count: Int!
                  episodes: IntAggregateSelectionNonNullable!
                  title: StringAggregateSelectionNonNullable!
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

                input SeriesOptions {
                  limit: Int
                  offset: Int
                  \\"\\"\\"
                  Specify one or more SeriesSort objects to sort Series by. The sorts will be applied in the order in which they are arranged in the array.
                  \\"\\"\\"
                  sort: [SeriesSort!]
                }

                \\"\\"\\"
                Fields to sort Series by. The order in which sorts are applied is not guaranteed when specifying many fields in one SeriesSort object.
                \\"\\"\\"
                input SeriesSort {
                  episodes: SortDirection
                  title: SortDirection
                }

                input SeriesUpdateInput {
                  episodes: Int
                  title: String
                }

                input SeriesWhere {
                  AND: [SeriesWhere!]
                  OR: [SeriesWhere!]
                  episodes: Int
                  episodes_GT: Int
                  episodes_GTE: Int
                  episodes_IN: [Int!]
                  episodes_LT: Int
                  episodes_LTE: Int
                  episodes_NOT: Int
                  episodes_NOT_IN: [Int!]
                  title: String
                  title_CONTAINS: String
                  title_ENDS_WITH: String
                  title_IN: [String!]
                  title_NOT: String
                  title_NOT_CONTAINS: String
                  title_NOT_ENDS_WITH: String
                  title_NOT_IN: [String!]
                  title_NOT_STARTS_WITH: String
                  title_STARTS_WITH: String
                }

                enum SortDirection {
                  \\"\\"\\"Sort by field values in ascending order.\\"\\"\\"
                  ASC
                  \\"\\"\\"Sort by field values in descending order.\\"\\"\\"
                  DESC
                }

                type StringAggregateSelectionNonNullable {
                  longest: String!
                  shortest: String!
                }

                type UpdateActorsMutationResponse {
                  actors: [Actor!]!
                  info: UpdateInfo!
                }

                type UpdateInfo {
                  bookmark: String
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

                type Genre {
                    id: ID
                }

                type Movie {
                    id: ID
                    search: [Search!]! @relationship(type: "SEARCH", direction: OUT)
                    searchNoDirective: Search
                }
            `;
            const neoSchema = new Neo4jGraphQL({ typeDefs });
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

                type CreateInfo {
                  bookmark: String
                  nodesCreated: Int!
                  relationshipsCreated: Int!
                }

                type CreateMoviesMutationResponse {
                  info: CreateInfo!
                  movies: [Movie!]!
                }

                type DeleteInfo {
                  bookmark: String
                  nodesDeleted: Int!
                  relationshipsDeleted: Int!
                }

                type Genre {
                  id: ID
                }

                type GenreAggregateSelection {
                  count: Int!
                  id: IDAggregateSelectionNullable!
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

                input GenreOptions {
                  limit: Int
                  offset: Int
                  \\"\\"\\"
                  Specify one or more GenreSort objects to sort Genres by. The sorts will be applied in the order in which they are arranged in the array.
                  \\"\\"\\"
                  sort: [GenreSort!]
                }

                \\"\\"\\"
                Fields to sort Genres by. The order in which sorts are applied is not guaranteed when specifying many fields in one GenreSort object.
                \\"\\"\\"
                input GenreSort {
                  id: SortDirection
                }

                input GenreUpdateInput {
                  id: ID
                }

                input GenreWhere {
                  AND: [GenreWhere!]
                  OR: [GenreWhere!]
                  id: ID
                  id_CONTAINS: ID
                  id_ENDS_WITH: ID
                  id_IN: [ID]
                  id_NOT: ID
                  id_NOT_CONTAINS: ID
                  id_NOT_ENDS_WITH: ID
                  id_NOT_IN: [ID]
                  id_NOT_STARTS_WITH: ID
                  id_STARTS_WITH: ID
                }

                type GenresConnection {
                  edges: [GenreEdge!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
                }

                type IDAggregateSelectionNullable {
                  longest: ID
                  shortest: ID
                }

                type Movie {
                  id: ID
                  search(directed: Boolean = true, options: QueryOptions, where: SearchWhere): [Search!]!
                  searchConnection(after: String, directed: Boolean = true, first: Int, where: MovieSearchConnectionWhere): MovieSearchConnection!
                  searchNoDirective: Search
                }

                type MovieAggregateSelection {
                  count: Int!
                  id: IDAggregateSelectionNullable!
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

                input MovieOptions {
                  limit: Int
                  offset: Int
                  \\"\\"\\"
                  Specify one or more MovieSort objects to sort Movies by. The sorts will be applied in the order in which they are arranged in the array.
                  \\"\\"\\"
                  sort: [MovieSort!]
                }

                input MovieRelationInput {
                  search: MovieSearchCreateFieldInput
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

                input MovieSearchConnectionWhere {
                  Genre: MovieSearchGenreConnectionWhere
                  Movie: MovieSearchMovieConnectionWhere
                }

                input MovieSearchCreateFieldInput {
                  Genre: [MovieSearchGenreCreateFieldInput!]
                  Movie: [MovieSearchMovieCreateFieldInput!]
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
                  OR: [MovieSearchGenreConnectionWhere!]
                  node: GenreWhere
                  node_NOT: GenreWhere
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
                  OR: [MovieSearchMovieConnectionWhere!]
                  node: MovieWhere
                  node_NOT: MovieWhere
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
                  id: ID
                  search: MovieSearchUpdateInput
                }

                input MovieWhere {
                  AND: [MovieWhere!]
                  OR: [MovieWhere!]
                  id: ID
                  id_CONTAINS: ID
                  id_ENDS_WITH: ID
                  id_IN: [ID]
                  id_NOT: ID
                  id_NOT_CONTAINS: ID
                  id_NOT_ENDS_WITH: ID
                  id_NOT_IN: [ID]
                  id_NOT_STARTS_WITH: ID
                  id_STARTS_WITH: ID
                  searchConnection: MovieSearchConnectionWhere @deprecated(reason: \\"Use \`searchConnection_SOME\` instead.\\")
                  searchConnection_ALL: MovieSearchConnectionWhere
                  searchConnection_NONE: MovieSearchConnectionWhere
                  searchConnection_NOT: MovieSearchConnectionWhere @deprecated(reason: \\"Use \`searchConnection_NONE\` instead.\\")
                  searchConnection_SINGLE: MovieSearchConnectionWhere
                  searchConnection_SOME: MovieSearchConnectionWhere
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
                  updateMovies(connect: MovieConnectInput, create: MovieRelationInput, delete: MovieDeleteInput, disconnect: MovieDisconnectInput, update: MovieUpdateInput, where: MovieWhere): UpdateMoviesMutationResponse!
                }

                \\"\\"\\"Pagination information (Relay)\\"\\"\\"
                type PageInfo {
                  endCursor: String
                  hasNextPage: Boolean!
                  hasPreviousPage: Boolean!
                  startCursor: String
                }

                type Query {
                  genres(options: GenreOptions, where: GenreWhere): [Genre!]!
                  genresAggregate(where: GenreWhere): GenreAggregateSelection!
                  genresConnection(after: String, first: Int, sort: [GenreSort], where: GenreWhere): GenresConnection!
                  movies(options: MovieOptions, where: MovieWhere): [Movie!]!
                  moviesAggregate(where: MovieWhere): MovieAggregateSelection!
                  moviesConnection(after: String, first: Int, sort: [MovieSort], where: MovieWhere): MoviesConnection!
                }

                input QueryOptions {
                  limit: Int
                  offset: Int
                }

                union Search = Genre | Movie

                input SearchWhere {
                  Genre: GenreWhere
                  Movie: MovieWhere
                }

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

                type UpdateInfo {
                  bookmark: String
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
