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

describe("Deprecated options argument", () => {
    test("should remove the options argument", async () => {
        const typeDefs = gql`
            type Actor @node {
                name: String!
                movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT, properties: "ActedIn")
            }

            type Movie implements Production @node {
                title: String!
                actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN, properties: "ActedIn")
            }

            type ActedIn @relationshipProperties {
                screenTime: Int!
                startDate: Date!
                leadRole: Boolean!
            }
            union Search = Movie | Genre

            type Genre @node {
                id: ID
            }

            interface Production {
                title: String!
            }
        `;
        const neoSchema = new Neo4jGraphQL({
            typeDefs,
            features: {
                excludeDeprecatedFields: {
                    bookmark: true,
                    negationFilters: true,
                    arrayFilters: true,
                    stringAggregation: true,
                    aggregationFilters: true,
                    deprecatedOptionsArgument: true,
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
            * Actor.movies
            * Movie.actors
            \\"\\"\\"
            type ActedIn {
              leadRole: Boolean!
              screenTime: Int!
              startDate: Date!
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
              leadRole: Boolean!
              screenTime: Int!
              startDate: Date!
            }

            input ActedInSort {
              leadRole: SortDirection
              screenTime: SortDirection
              startDate: SortDirection
            }

            input ActedInUpdateInput {
              leadRole: Boolean
              screenTime: Int
              screenTime_DECREMENT: Int
              screenTime_INCREMENT: Int
              startDate: Date
            }

            input ActedInWhere {
              AND: [ActedInWhere!]
              NOT: ActedInWhere
              OR: [ActedInWhere!]
              leadRole: Boolean @deprecated(reason: \\"Please use the explicit _EQ version\\")
              leadRole_EQ: Boolean
              screenTime: Int @deprecated(reason: \\"Please use the explicit _EQ version\\")
              screenTime_EQ: Int
              screenTime_GT: Int
              screenTime_GTE: Int
              screenTime_IN: [Int!]
              screenTime_LT: Int
              screenTime_LTE: Int
              startDate: Date @deprecated(reason: \\"Please use the explicit _EQ version\\")
              startDate_EQ: Date
              startDate_GT: Date
              startDate_GTE: Date
              startDate_IN: [Date!]
              startDate_LT: Date
              startDate_LTE: Date
            }

            type Actor {
              movies(directed: Boolean = true, limit: Int, offset: Int, sort: [MovieSort!], where: MovieWhere): [Movie!]!
              moviesAggregate(directed: Boolean = true, where: MovieWhere): ActorMovieMoviesAggregationSelection
              moviesConnection(after: String, directed: Boolean = true, first: Int, sort: [ActorMoviesConnectionSort!], where: ActorMoviesConnectionWhere): ActorMoviesConnection!
              name: String!
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
              name: String!
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
              edge: ActorMovieMoviesEdgeAggregateSelection
              node: ActorMovieMoviesNodeAggregateSelection
            }

            type ActorMovieMoviesEdgeAggregateSelection {
              screenTime: IntAggregateSelection!
            }

            type ActorMovieMoviesNodeAggregateSelection {
              title: StringAggregateSelection!
            }

            input ActorMoviesAggregateInput {
              AND: [ActorMoviesAggregateInput!]
              NOT: ActorMoviesAggregateInput
              OR: [ActorMoviesAggregateInput!]
              count: Int
              count_GT: Int
              count_GTE: Int
              count_LT: Int
              count_LTE: Int
              edge: ActedInAggregationWhereInput
              node: ActorMoviesNodeAggregationWhereInput
            }

            input ActorMoviesConnectFieldInput {
              connect: [MovieConnectInput!]
              edge: ActedInCreateInput!
              \\"\\"\\"
              Whether or not to overwrite any matching relationship with the new properties.
              \\"\\"\\"
              overwrite: Boolean! = true
              where: MovieConnectWhere
            }

            type ActorMoviesConnection {
              edges: [ActorMoviesRelationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
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
              properties: ActedIn!
            }

            input ActorMoviesUpdateConnectionInput {
              edge: ActedInUpdateInput
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

            input ActorRelationInput {
              movies: [ActorMoviesCreateFieldInput!]
            }

            \\"\\"\\"
            Fields to sort Actors by. The order in which sorts are applied is not guaranteed when specifying many fields in one ActorSort object.
            \\"\\"\\"
            input ActorSort {
              name: SortDirection
            }

            input ActorUpdateInput {
              movies: [ActorMoviesUpdateFieldInput!]
              name: String
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
              name: String @deprecated(reason: \\"Please use the explicit _EQ version\\")
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

            \\"\\"\\"A date, represented as a 'yyyy-mm-dd' string\\"\\"\\"
            scalar Date

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
              id: ID
            }

            input GenreWhere {
              AND: [GenreWhere!]
              NOT: GenreWhere
              OR: [GenreWhere!]
              id: ID @deprecated(reason: \\"Please use the explicit _EQ version\\")
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

            type IntAggregateSelection {
              average: Float
              max: Int
              min: Int
              sum: Int
            }

            type Movie implements Production {
              actors(directed: Boolean = true, limit: Int, offset: Int, sort: [ActorSort!], where: ActorWhere): [Actor!]!
              actorsAggregate(directed: Boolean = true, where: ActorWhere): MovieActorActorsAggregationSelection
              actorsConnection(after: String, directed: Boolean = true, first: Int, sort: [MovieActorsConnectionSort!], where: MovieActorsConnectionWhere): MovieActorsConnection!
              title: String!
            }

            type MovieActorActorsAggregationSelection {
              count: Int!
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
              count: Int
              count_GT: Int
              count_GTE: Int
              count_LT: Int
              count_LTE: Int
              edge: ActedInAggregationWhereInput
              node: MovieActorsNodeAggregationWhereInput
            }

            input MovieActorsConnectFieldInput {
              connect: [ActorConnectInput!]
              edge: ActedInCreateInput!
              \\"\\"\\"
              Whether or not to overwrite any matching relationship with the new properties.
              \\"\\"\\"
              overwrite: Boolean! = true
              where: ActorConnectWhere
            }

            type MovieActorsConnection {
              edges: [MovieActorsRelationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
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
              properties: ActedIn!
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
              count: Int!
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

            input MovieRelationInput {
              actors: [MovieActorsCreateFieldInput!]
            }

            \\"\\"\\"
            Fields to sort Movies by. The order in which sorts are applied is not guaranteed when specifying many fields in one MovieSort object.
            \\"\\"\\"
            input MovieSort {
              title: SortDirection
            }

            input MovieUpdateInput {
              actors: [MovieActorsUpdateFieldInput!]
              title: String
            }

            input MovieWhere {
              AND: [MovieWhere!]
              NOT: MovieWhere
              OR: [MovieWhere!]
              actorsAggregate: MovieActorsAggregateInput
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
              title: String @deprecated(reason: \\"Please use the explicit _EQ version\\")
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
              createGenres(input: [GenreCreateInput!]!): CreateGenresMutationResponse!
              createMovies(input: [MovieCreateInput!]!): CreateMoviesMutationResponse!
              deleteActors(delete: ActorDeleteInput, where: ActorWhere): DeleteInfo!
              deleteGenres(where: GenreWhere): DeleteInfo!
              deleteMovies(delete: MovieDeleteInput, where: MovieWhere): DeleteInfo!
              updateActors(connect: ActorConnectInput, create: ActorRelationInput, delete: ActorDeleteInput, disconnect: ActorDisconnectInput, update: ActorUpdateInput, where: ActorWhere): UpdateActorsMutationResponse!
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

            interface Production {
              title: String!
            }

            type ProductionAggregateSelection {
              count: Int!
              title: StringAggregateSelection!
            }

            type ProductionEdge {
              cursor: String!
              node: Production!
            }

            enum ProductionImplementation {
              Movie
            }

            \\"\\"\\"
            Fields to sort Productions by. The order in which sorts are applied is not guaranteed when specifying many fields in one ProductionSort object.
            \\"\\"\\"
            input ProductionSort {
              title: SortDirection
            }

            input ProductionWhere {
              AND: [ProductionWhere!]
              NOT: ProductionWhere
              OR: [ProductionWhere!]
              title: String @deprecated(reason: \\"Please use the explicit _EQ version\\")
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
              genres(limit: Int, offset: Int, sort: [GenreSort!], where: GenreWhere): [Genre!]!
              genresAggregate(where: GenreWhere): GenreAggregateSelection!
              genresConnection(after: String, first: Int, sort: [GenreSort!], where: GenreWhere): GenresConnection!
              movies(limit: Int, offset: Int, sort: [MovieSort!], where: MovieWhere): [Movie!]!
              moviesAggregate(where: MovieWhere): MovieAggregateSelection!
              moviesConnection(after: String, first: Int, sort: [MovieSort!], where: MovieWhere): MoviesConnection!
              productions(limit: Int, offset: Int, sort: [ProductionSort!], where: ProductionWhere): [Production!]!
              productionsAggregate(where: ProductionWhere): ProductionAggregateSelection!
              productionsConnection(after: String, first: Int, sort: [ProductionSort!], where: ProductionWhere): ProductionsConnection!
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

            type StringAggregateSelection {
              longest: String
              shortest: String
            }

            type UpdateActorsMutationResponse {
              actors: [Actor!]!
              info: UpdateInfo!
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
