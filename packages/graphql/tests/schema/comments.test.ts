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
        const neoSchema = new Neo4jGraphQL({ typeDefs });
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

            type Count {
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
              actorCount_EQ: Int @deprecated(reason: \\"Please use the relevant generic filter actorCount: { eq: ... }\\")
              actorCount_GT: Int @deprecated(reason: \\"Please use the relevant generic filter actorCount: { gt: ... }\\")
              actorCount_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter actorCount: { gte: ... }\\")
              actorCount_IN: [Int] @deprecated(reason: \\"Please use the relevant generic filter actorCount: { in: ... }\\")
              actorCount_LT: Int @deprecated(reason: \\"Please use the relevant generic filter actorCount: { lt: ... }\\")
              actorCount_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter actorCount: { lte: ... }\\")
              averageRating: FloatScalarFilters
              averageRating_EQ: Float @deprecated(reason: \\"Please use the relevant generic filter averageRating: { eq: ... }\\")
              averageRating_GT: Float @deprecated(reason: \\"Please use the relevant generic filter averageRating: { gt: ... }\\")
              averageRating_GTE: Float @deprecated(reason: \\"Please use the relevant generic filter averageRating: { gte: ... }\\")
              averageRating_IN: [Float] @deprecated(reason: \\"Please use the relevant generic filter averageRating: { in: ... }\\")
              averageRating_LT: Float @deprecated(reason: \\"Please use the relevant generic filter averageRating: { lt: ... }\\")
              averageRating_LTE: Float @deprecated(reason: \\"Please use the relevant generic filter averageRating: { lte: ... }\\")
              customScalar: CustomScalarScalarFilters
              customScalar_EQ: CustomScalar @deprecated(reason: \\"Please use the relevant generic filter customScalar: { eq: ... }\\")
              customScalar_IN: [CustomScalar] @deprecated(reason: \\"Please use the relevant generic filter customScalar: { in: ... }\\")
              genre: GenreEnumScalarFilters
              genre_EQ: Genre @deprecated(reason: \\"Please use the relevant generic filter genre: { eq: ... }\\")
              genre_IN: [Genre] @deprecated(reason: \\"Please use the relevant generic filter genre: { in: ... }\\")
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
                  name: String
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
                  \\"\\"\\"Actors in Movie\\"\\"\\"
                  actors(limit: Int, offset: Int, sort: [ActorSort!], where: ActorWhere): [Actor!]!
                  actorsConnection(after: String, first: Int, sort: [MovieActorsConnectionSort!], where: MovieActorsConnectionWhere): MovieActorsConnection!
                  id: ID
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
                  \\"\\"\\"Acted in Production\\"\\"\\"
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
            const neoSchema = new Neo4jGraphQL({ typeDefs });
            const printedSchema = printSchemaWithDirectives(lexicographicSortSchema(await neoSchema.getSchema()));

            expect(printedSchema).toMatchInlineSnapshot(`
                "schema {
                  query: Query
                  mutation: Mutation
                }

                type Count {
                  nodes: Int!
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

                type GenreAggregate {
                  count: Count!
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
                  id_CONTAINS: ID @deprecated(reason: \\"Please use the relevant generic filter id: { contains: ... }\\")
                  id_ENDS_WITH: ID @deprecated(reason: \\"Please use the relevant generic filter id: { endsWith: ... }\\")
                  id_EQ: ID @deprecated(reason: \\"Please use the relevant generic filter id: { eq: ... }\\")
                  id_IN: [ID] @deprecated(reason: \\"Please use the relevant generic filter id: { in: ... }\\")
                  id_STARTS_WITH: ID @deprecated(reason: \\"Please use the relevant generic filter id: { startsWith: ... }\\")
                }

                type GenresConnection {
                  aggregate: GenreAggregate!
                  edges: [GenreEdge!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
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

                type Movie {
                  id: ID
                  search(limit: Int, offset: Int, where: SearchWhere): [Search!]!
                  searchConnection(after: String, first: Int, where: MovieSearchConnectionWhere): MovieSearchConnection!
                  searchNoDirective: Search
                }

                type MovieAggregate {
                  count: Count!
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
                  where: MovieSearchGenreConnectionWhere
                }

                input MovieSearchGenreUpdateFieldInput {
                  connect: [MovieSearchGenreConnectFieldInput!]
                  create: [MovieSearchGenreCreateFieldInput!]
                  delete: [MovieSearchGenreDeleteFieldInput!]
                  disconnect: [MovieSearchGenreDisconnectFieldInput!]
                  update: MovieSearchGenreUpdateConnectionInput
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
                  where: MovieSearchMovieConnectionWhere
                }

                input MovieSearchMovieUpdateFieldInput {
                  connect: [MovieSearchMovieConnectFieldInput!]
                  create: [MovieSearchMovieCreateFieldInput!]
                  delete: [MovieSearchMovieDeleteFieldInput!]
                  disconnect: [MovieSearchMovieDisconnectFieldInput!]
                  update: MovieSearchMovieUpdateConnectionInput
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
                  id: IDScalarMutations
                  id_SET: ID @deprecated(reason: \\"Please use the generic mutation 'id: { set: ... } }' instead.\\")
                  search: MovieSearchUpdateInput
                }

                input MovieWhere {
                  AND: [MovieWhere!]
                  NOT: MovieWhere
                  OR: [MovieWhere!]
                  id: IDScalarFilters
                  id_CONTAINS: ID @deprecated(reason: \\"Please use the relevant generic filter id: { contains: ... }\\")
                  id_ENDS_WITH: ID @deprecated(reason: \\"Please use the relevant generic filter id: { endsWith: ... }\\")
                  id_EQ: ID @deprecated(reason: \\"Please use the relevant generic filter id: { eq: ... }\\")
                  id_IN: [ID] @deprecated(reason: \\"Please use the relevant generic filter id: { in: ... }\\")
                  id_STARTS_WITH: ID @deprecated(reason: \\"Please use the relevant generic filter id: { startsWith: ... }\\")
                  search: SearchRelationshipFilters
                  searchConnection: MovieSearchConnectionFilters
                  \\"\\"\\"
                  Return Movies where all of the related MovieSearchConnections match this filter
                  \\"\\"\\"
                  searchConnection_ALL: MovieSearchConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'searchConnection: { all: { node: ... } } }' instead.\\")
                  \\"\\"\\"
                  Return Movies where none of the related MovieSearchConnections match this filter
                  \\"\\"\\"
                  searchConnection_NONE: MovieSearchConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'searchConnection: { none: { node: ... } } }' instead.\\")
                  \\"\\"\\"
                  Return Movies where one of the related MovieSearchConnections match this filter
                  \\"\\"\\"
                  searchConnection_SINGLE: MovieSearchConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'searchConnection: { single: { node: ... } } }' instead.\\")
                  \\"\\"\\"
                  Return Movies where some of the related MovieSearchConnections match this filter
                  \\"\\"\\"
                  searchConnection_SOME: MovieSearchConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'searchConnection: { some: { node: ... } } }' instead.\\")
                  \\"\\"\\"Return Movies where all of the related Searches match this filter\\"\\"\\"
                  search_ALL: SearchWhere @deprecated(reason: \\"Please use the relevant generic filter 'search: { all: ... }' instead.\\")
                  \\"\\"\\"Return Movies where none of the related Searches match this filter\\"\\"\\"
                  search_NONE: SearchWhere @deprecated(reason: \\"Please use the relevant generic filter 'search: { none: ... }' instead.\\")
                  \\"\\"\\"Return Movies where one of the related Searches match this filter\\"\\"\\"
                  search_SINGLE: SearchWhere @deprecated(reason: \\"Please use the relevant generic filter 'search: {  single: ... }' instead.\\")
                  \\"\\"\\"Return Movies where some of the related Searches match this filter\\"\\"\\"
                  search_SOME: SearchWhere @deprecated(reason: \\"Please use the relevant generic filter 'search: {  some: ... }' instead.\\")
                }

                type MoviesConnection {
                  aggregate: MovieAggregate!
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
                  genresConnection(after: String, first: Int, sort: [GenreSort!], where: GenreWhere): GenresConnection!
                  movies(limit: Int, offset: Int, sort: [MovieSort!], where: MovieWhere): [Movie!]!
                  moviesConnection(after: String, first: Int, sort: [MovieSort!], where: MovieWhere): MoviesConnection!
                  searches(limit: Int, offset: Int, where: SearchWhere): [Search!]!
                }

                union Search = Genre | Movie

                input SearchRelationshipFilters {
                  \\"\\"\\"Filter type where all of the related Searches match this filter\\"\\"\\"
                  all: SearchWhere
                  \\"\\"\\"Filter type where none of the related Searches match this filter\\"\\"\\"
                  none: SearchWhere
                  \\"\\"\\"Filter type where one of the related Searches match this filter\\"\\"\\"
                  single: SearchWhere
                  \\"\\"\\"Filter type where some of the related Searches match this filter\\"\\"\\"
                  some: SearchWhere
                }

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
