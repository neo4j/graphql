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
import { Neo4jGraphQL } from "../../../src";

describe("@exclude directive", () => {
    test("can be used to skip generation of Query", () => {
        const typeDefs = gql`
            type Actor @exclude(operations: [READ]) {
                name: String
            }

            type Movie {
                title: String
            }
        `;
        const neoSchema = new Neo4jGraphQL({ typeDefs });
        const printedSchema = printSchemaWithDirectives(lexicographicSortSchema(neoSchema.schema));

        expect(printedSchema).toMatchInlineSnapshot(`
            "schema {
              query: Query
              mutation: Mutation
            }

            type Actor {
              name: String
            }

            input ActorCreateInput {
              name: String
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

            type Movie {
              title: String
            }

            type MovieAggregateSelection {
              count: Int!
              title: StringAggregateSelectionNullable!
            }

            input MovieCreateInput {
              title: String
            }

            input MovieOptions {
              limit: Int
              offset: Int
              \\"\\"\\"Specify one or more MovieSort objects to sort Movies by. The sorts will be applied in the order in which they are arranged in the array.\\"\\"\\"
              sort: [MovieSort]
            }

            \\"\\"\\"Fields to sort Movies by. The order in which sorts are applied is not guaranteed when specifying many fields in one MovieSort object.\\"\\"\\"
            input MovieSort {
              title: SortDirection
            }

            input MovieUpdateInput {
              title: String
            }

            input MovieWhere {
              AND: [MovieWhere!]
              OR: [MovieWhere!]
              title: String
              title_CONTAINS: String
              title_ENDS_WITH: String
              title_IN: [String]
              title_NOT: String
              title_NOT_CONTAINS: String
              title_NOT_ENDS_WITH: String
              title_NOT_IN: [String]
              title_NOT_STARTS_WITH: String
              title_STARTS_WITH: String
            }

            type Mutation {
              createActors(input: [ActorCreateInput!]!): CreateActorsMutationResponse!
              createMovies(input: [MovieCreateInput!]!): CreateMoviesMutationResponse!
              deleteActors(where: ActorWhere): DeleteInfo!
              deleteMovies(where: MovieWhere): DeleteInfo!
              updateActors(update: ActorUpdateInput, where: ActorWhere): UpdateActorsMutationResponse!
              updateMovies(update: MovieUpdateInput, where: MovieWhere): UpdateMoviesMutationResponse!
            }

            type Query {
              movies(options: MovieOptions, where: MovieWhere): [Movie!]!
              moviesAggregate(where: MovieWhere): MovieAggregateSelection!
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
            }
            "
        `);
    });

    test("can be used to skip generation of Mutation", () => {
        const typeDefs = gql`
            type Actor @exclude(operations: [CREATE]) {
                name: String
            }
        `;
        const neoSchema = new Neo4jGraphQL({ typeDefs });
        const printedSchema = printSchemaWithDirectives(lexicographicSortSchema(neoSchema.schema));

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

            input ActorOptions {
              limit: Int
              offset: Int
              \\"\\"\\"Specify one or more ActorSort objects to sort Actors by. The sorts will be applied in the order in which they are arranged in the array.\\"\\"\\"
              sort: [ActorSort]
            }

            \\"\\"\\"Fields to sort Actors by. The order in which sorts are applied is not guaranteed when specifying many fields in one ActorSort object.\\"\\"\\"
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

            type DeleteInfo {
              bookmark: String
              nodesDeleted: Int!
              relationshipsDeleted: Int!
            }

            type Mutation {
              deleteActors(where: ActorWhere): DeleteInfo!
              updateActors(update: ActorUpdateInput, where: ActorWhere): UpdateActorsMutationResponse!
            }

            type Query {
              actors(options: ActorOptions, where: ActorWhere): [Actor!]!
              actorsAggregate(where: ActorWhere): ActorAggregateSelection!
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
            "
        `);
    });

    test("can be used with no arguments to skip generation of all Queries and Mutations and removes the type itself if not referenced elsewhere", () => {
        const typeDefs = gql`
            type Actor @exclude {
                name: String
            }

            type Movie {
                title: String
            }
        `;
        const neoSchema = new Neo4jGraphQL({ typeDefs });
        const printedSchema = printSchemaWithDirectives(lexicographicSortSchema(neoSchema.schema));

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

            type DeleteInfo {
              bookmark: String
              nodesDeleted: Int!
              relationshipsDeleted: Int!
            }

            type Movie {
              title: String
            }

            type MovieAggregateSelection {
              count: Int!
              title: StringAggregateSelectionNullable!
            }

            input MovieCreateInput {
              title: String
            }

            input MovieOptions {
              limit: Int
              offset: Int
              \\"\\"\\"Specify one or more MovieSort objects to sort Movies by. The sorts will be applied in the order in which they are arranged in the array.\\"\\"\\"
              sort: [MovieSort]
            }

            \\"\\"\\"Fields to sort Movies by. The order in which sorts are applied is not guaranteed when specifying many fields in one MovieSort object.\\"\\"\\"
            input MovieSort {
              title: SortDirection
            }

            input MovieUpdateInput {
              title: String
            }

            input MovieWhere {
              AND: [MovieWhere!]
              OR: [MovieWhere!]
              title: String
              title_CONTAINS: String
              title_ENDS_WITH: String
              title_IN: [String]
              title_NOT: String
              title_NOT_CONTAINS: String
              title_NOT_ENDS_WITH: String
              title_NOT_IN: [String]
              title_NOT_STARTS_WITH: String
              title_STARTS_WITH: String
            }

            type Mutation {
              createMovies(input: [MovieCreateInput!]!): CreateMoviesMutationResponse!
              deleteMovies(where: MovieWhere): DeleteInfo!
              updateMovies(update: MovieUpdateInput, where: MovieWhere): UpdateMoviesMutationResponse!
            }

            type Query {
              movies(options: MovieOptions, where: MovieWhere): [Movie!]!
              moviesAggregate(where: MovieWhere): MovieAggregateSelection!
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
            "
        `);
    });

    test("can be used with no arguments to skip generation of all Queries and Mutations but retains the type itself if referenced elsewhere", () => {
        const typeDefs = gql`
            type Actor @exclude {
                name: String
            }

            type Movie {
                title: String
            }

            type Query {
                customActorQuery: Actor
            }
        `;
        const neoSchema = new Neo4jGraphQL({ typeDefs });
        const printedSchema = printSchemaWithDirectives(lexicographicSortSchema(neoSchema.schema));

        expect(printedSchema).toMatchInlineSnapshot(`
            "schema {
              query: Query
              mutation: Mutation
            }

            type Actor {
              name: String
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

            type Movie {
              title: String
            }

            type MovieAggregateSelection {
              count: Int!
              title: StringAggregateSelectionNullable!
            }

            input MovieCreateInput {
              title: String
            }

            input MovieOptions {
              limit: Int
              offset: Int
              \\"\\"\\"Specify one or more MovieSort objects to sort Movies by. The sorts will be applied in the order in which they are arranged in the array.\\"\\"\\"
              sort: [MovieSort]
            }

            \\"\\"\\"Fields to sort Movies by. The order in which sorts are applied is not guaranteed when specifying many fields in one MovieSort object.\\"\\"\\"
            input MovieSort {
              title: SortDirection
            }

            input MovieUpdateInput {
              title: String
            }

            input MovieWhere {
              AND: [MovieWhere!]
              OR: [MovieWhere!]
              title: String
              title_CONTAINS: String
              title_ENDS_WITH: String
              title_IN: [String]
              title_NOT: String
              title_NOT_CONTAINS: String
              title_NOT_ENDS_WITH: String
              title_NOT_IN: [String]
              title_NOT_STARTS_WITH: String
              title_STARTS_WITH: String
            }

            type Mutation {
              createMovies(input: [MovieCreateInput!]!): CreateMoviesMutationResponse!
              deleteMovies(where: MovieWhere): DeleteInfo!
              updateMovies(update: MovieUpdateInput, where: MovieWhere): UpdateMoviesMutationResponse!
            }

            type Query {
              customActorQuery: Actor
              movies(options: MovieOptions, where: MovieWhere): [Movie!]!
              moviesAggregate(where: MovieWhere): MovieAggregateSelection!
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
            "
        `);
    });

    test("can be used with no arguments to skip generation of all Queries and Mutations but retains the type itself if referenced in a `@relationship` directive", () => {
        const typeDefs = gql`
            type Actor @exclude {
                name: String
            }

            type Movie {
                title: String
                actors: [Actor] @relationship(type: "ACTED_IN", direction: IN)
            }
        `;
        const neoSchema = new Neo4jGraphQL({ typeDefs });
        const printedSchema = printSchemaWithDirectives(lexicographicSortSchema(neoSchema.schema));

        expect(printedSchema).toMatchInlineSnapshot(`
"schema {
  query: Query
  mutation: Mutation
}

type Actor {
  name: String
}

input ActorConnectWhere {
  node: ActorWhere!
}

input ActorCreateInput {
  name: String
}

input ActorOptions {
  limit: Int
  offset: Int
  \\"\\"\\"Specify one or more ActorSort objects to sort Actors by. The sorts will be applied in the order in which they are arranged in the array.\\"\\"\\"
  sort: [ActorSort]
}

\\"\\"\\"Fields to sort Actors by. The order in which sorts are applied is not guaranteed when specifying many fields in one ActorSort object.\\"\\"\\"
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

type Movie {
  actors(directed: Boolean, options: ActorOptions, where: ActorWhere): [Actor]
  actorsAggregate(where: ActorWhere): MovieActorActorsAggregationSelection
  actorsConnection(after: String, first: Int, sort: [MovieActorsConnectionSort!], where: MovieActorsConnectionWhere): MovieActorsConnection!
  title: String
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
  title: StringAggregateSelectionNullable!
}

input MovieConnectInput {
  actors: [MovieActorsConnectFieldInput!]
}

input MovieCreateInput {
  actors: MovieActorsFieldInput
  title: String
}

input MovieDeleteInput {
  actors: [MovieActorsDeleteFieldInput!]
}

input MovieDisconnectInput {
  actors: [MovieActorsDisconnectFieldInput!]
}

input MovieOptions {
  limit: Int
  offset: Int
  \\"\\"\\"Specify one or more MovieSort objects to sort Movies by. The sorts will be applied in the order in which they are arranged in the array.\\"\\"\\"
  sort: [MovieSort]
}

input MovieRelationInput {
  actors: [MovieActorsCreateFieldInput!]
}

\\"\\"\\"Fields to sort Movies by. The order in which sorts are applied is not guaranteed when specifying many fields in one MovieSort object.\\"\\"\\"
input MovieSort {
  title: SortDirection
}

input MovieUpdateInput {
  actors: [MovieActorsUpdateFieldInput!]
  title: String
}

input MovieWhere {
  AND: [MovieWhere!]
  OR: [MovieWhere!]
  actors: ActorWhere
  actorsAggregate: MovieActorsAggregateInput
  actorsConnection: MovieActorsConnectionWhere
  actorsConnection_NOT: MovieActorsConnectionWhere
  actors_NOT: ActorWhere
  title: String
  title_CONTAINS: String
  title_ENDS_WITH: String
  title_IN: [String]
  title_NOT: String
  title_NOT_CONTAINS: String
  title_NOT_ENDS_WITH: String
  title_NOT_IN: [String]
  title_NOT_STARTS_WITH: String
  title_STARTS_WITH: String
}

type Mutation {
  createMovies(input: [MovieCreateInput!]!): CreateMoviesMutationResponse!
  deleteMovies(delete: MovieDeleteInput, where: MovieWhere): DeleteInfo!
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
  movies(options: MovieOptions, where: MovieWhere): [Movie!]!
  moviesAggregate(where: MovieWhere): MovieAggregateSelection!
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
"
`);
    });

    test("doesn't break if provided with an empty array", () => {
        const typeDefs = gql`
            type Actor @exclude(operations: []) {
                name: String
            }
        `;
        const neoSchema = new Neo4jGraphQL({ typeDefs });
        const printedSchema = printSchemaWithDirectives(lexicographicSortSchema(neoSchema.schema));

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

            input ActorCreateInput {
              name: String
            }

            input ActorOptions {
              limit: Int
              offset: Int
              \\"\\"\\"Specify one or more ActorSort objects to sort Actors by. The sorts will be applied in the order in which they are arranged in the array.\\"\\"\\"
              sort: [ActorSort]
            }

            \\"\\"\\"Fields to sort Actors by. The order in which sorts are applied is not guaranteed when specifying many fields in one ActorSort object.\\"\\"\\"
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

            type CreateActorsMutationResponse {
              actors: [Actor!]!
              info: CreateInfo!
            }

            type CreateInfo {
              bookmark: String
              nodesCreated: Int!
              relationshipsCreated: Int!
            }

            type DeleteInfo {
              bookmark: String
              nodesDeleted: Int!
              relationshipsDeleted: Int!
            }

            type Mutation {
              createActors(input: [ActorCreateInput!]!): CreateActorsMutationResponse!
              deleteActors(where: ActorWhere): DeleteInfo!
              updateActors(update: ActorUpdateInput, where: ActorWhere): UpdateActorsMutationResponse!
            }

            type Query {
              actors(options: ActorOptions, where: ActorWhere): [Actor!]!
              actorsAggregate(where: ActorWhere): ActorAggregateSelection!
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
            "
        `);
    });

    test("can be used with interfaces", () => {
        const typeDefs = gql`
            interface Production @exclude(operations: [CREATE]) {
                title: String
            }

            type Movie implements Production {
                title: String
            }

            type Series implements Production @exclude(operations: [UPDATE]) {
                title: String
            }
        `;
        const neoSchema = new Neo4jGraphQL({ typeDefs });
        const printedSchema = printSchemaWithDirectives(lexicographicSortSchema(neoSchema.schema));

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

            type CreateSeriesMutationResponse {
              info: CreateInfo!
              series: [Series!]!
            }

            type DeleteInfo {
              bookmark: String
              nodesDeleted: Int!
              relationshipsDeleted: Int!
            }

            type Movie implements Production {
              title: String
            }

            type MovieAggregateSelection {
              count: Int!
              title: StringAggregateSelectionNullable!
            }

            input MovieOptions {
              limit: Int
              offset: Int
              \\"\\"\\"Specify one or more MovieSort objects to sort Movies by. The sorts will be applied in the order in which they are arranged in the array.\\"\\"\\"
              sort: [MovieSort]
            }

            \\"\\"\\"Fields to sort Movies by. The order in which sorts are applied is not guaranteed when specifying many fields in one MovieSort object.\\"\\"\\"
            input MovieSort {
              title: SortDirection
            }

            input MovieUpdateInput {
              title: String
            }

            input MovieWhere {
              AND: [MovieWhere!]
              OR: [MovieWhere!]
              title: String
              title_CONTAINS: String
              title_ENDS_WITH: String
              title_IN: [String]
              title_NOT: String
              title_NOT_CONTAINS: String
              title_NOT_ENDS_WITH: String
              title_NOT_IN: [String]
              title_NOT_STARTS_WITH: String
              title_STARTS_WITH: String
            }

            type Mutation {
              createSeries(input: [SeriesCreateInput!]!): CreateSeriesMutationResponse!
              deleteMovies(where: MovieWhere): DeleteInfo!
              deleteSeries(where: SeriesWhere): DeleteInfo!
              updateMovies(update: MovieUpdateInput, where: MovieWhere): UpdateMoviesMutationResponse!
            }

            interface Production {
              title: String
            }

            type Query {
              movies(options: MovieOptions, where: MovieWhere): [Movie!]!
              moviesAggregate(where: MovieWhere): MovieAggregateSelection!
              series(options: SeriesOptions, where: SeriesWhere): [Series!]!
              seriesAggregate(where: SeriesWhere): SeriesAggregateSelection!
            }

            type Series implements Production {
              title: String
            }

            type SeriesAggregateSelection {
              count: Int!
              title: StringAggregateSelectionNullable!
            }

            input SeriesCreateInput {
              title: String
            }

            input SeriesOptions {
              limit: Int
              offset: Int
              \\"\\"\\"Specify one or more SeriesSort objects to sort Series by. The sorts will be applied in the order in which they are arranged in the array.\\"\\"\\"
              sort: [SeriesSort]
            }

            \\"\\"\\"Fields to sort Series by. The order in which sorts are applied is not guaranteed when specifying many fields in one SeriesSort object.\\"\\"\\"
            input SeriesSort {
              title: SortDirection
            }

            input SeriesWhere {
              AND: [SeriesWhere!]
              OR: [SeriesWhere!]
              title: String
              title_CONTAINS: String
              title_ENDS_WITH: String
              title_IN: [String]
              title_NOT: String
              title_NOT_CONTAINS: String
              title_NOT_ENDS_WITH: String
              title_NOT_IN: [String]
              title_NOT_STARTS_WITH: String
              title_STARTS_WITH: String
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
            "
        `);
    });
});
