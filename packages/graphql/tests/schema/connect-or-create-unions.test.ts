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

describe("Connect Or Create", () => {
    test("With Unions", async () => {
        const typeDefs = gql`
            type Movie {
                title: String!
                isan: String! @unique
            }

            type Series {
                title: String!
                isan: String! @unique
            }

            union Production = Movie | Series

            interface ActedIn @relationshipProperties {
                screenTime: Int!
            }

            type Actor {
                name: String!
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
              screenTime_DECREMENT: Int
              screenTime_INCREMENT: Int
            }

            input ActedInWhere {
              AND: [ActedInWhere!]
              NOT: ActedInWhere
              OR: [ActedInWhere!]
              screenTime: Int
              screenTime_GT: Int
              screenTime_GTE: Int
              screenTime_IN: [Int!]
              screenTime_LT: Int
              screenTime_LTE: Int
              screenTime_NOT: Int @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              screenTime_NOT_IN: [Int!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
            }

            type Actor {
              actedIn(directed: Boolean = true, options: QueryOptions, where: ProductionWhere): [Production!]!
              actedInConnection(after: String, directed: Boolean = true, first: Int, sort: [ActorActedInConnectionSort!], where: ActorActedInConnectionWhere): ActorActedInConnection!
              name: String!
            }

            input ActorActedInConnectInput {
              Movie: [ActorActedInMovieConnectFieldInput!]
              Series: [ActorActedInSeriesConnectFieldInput!]
            }

            input ActorActedInConnectOrCreateInput {
              Movie: [ActorActedInMovieConnectOrCreateFieldInput!]
              Series: [ActorActedInSeriesConnectOrCreateFieldInput!]
            }

            type ActorActedInConnection {
              edges: [ActorActedInRelationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input ActorActedInConnectionSort {
              edge: ActedInSort
            }

            input ActorActedInConnectionWhere {
              Movie: ActorActedInMovieConnectionWhere
              Series: ActorActedInSeriesConnectionWhere
            }

            input ActorActedInCreateFieldInput {
              Movie: [ActorActedInMovieCreateFieldInput!]
              Series: [ActorActedInSeriesCreateFieldInput!]
            }

            input ActorActedInCreateInput {
              Movie: ActorActedInMovieFieldInput
              Series: ActorActedInSeriesFieldInput
            }

            input ActorActedInDeleteInput {
              Movie: [ActorActedInMovieDeleteFieldInput!]
              Series: [ActorActedInSeriesDeleteFieldInput!]
            }

            input ActorActedInDisconnectInput {
              Movie: [ActorActedInMovieDisconnectFieldInput!]
              Series: [ActorActedInSeriesDisconnectFieldInput!]
            }

            input ActorActedInMovieConnectFieldInput {
              edge: ActedInCreateInput!
              where: MovieConnectWhere
            }

            input ActorActedInMovieConnectOrCreateFieldInput {
              onCreate: ActorActedInMovieConnectOrCreateFieldInputOnCreate!
              where: MovieConnectOrCreateWhere!
            }

            input ActorActedInMovieConnectOrCreateFieldInputOnCreate {
              edge: ActedInCreateInput!
              node: MovieOnCreateInput!
            }

            input ActorActedInMovieConnectionWhere {
              AND: [ActorActedInMovieConnectionWhere!]
              NOT: ActorActedInMovieConnectionWhere
              OR: [ActorActedInMovieConnectionWhere!]
              edge: ActedInWhere
              edge_NOT: ActedInWhere @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              node: MovieWhere
              node_NOT: MovieWhere @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
            }

            input ActorActedInMovieCreateFieldInput {
              edge: ActedInCreateInput!
              node: MovieCreateInput!
            }

            input ActorActedInMovieDeleteFieldInput {
              where: ActorActedInMovieConnectionWhere
            }

            input ActorActedInMovieDisconnectFieldInput {
              where: ActorActedInMovieConnectionWhere
            }

            input ActorActedInMovieFieldInput {
              connect: [ActorActedInMovieConnectFieldInput!]
              connectOrCreate: [ActorActedInMovieConnectOrCreateFieldInput!]
              create: [ActorActedInMovieCreateFieldInput!]
            }

            input ActorActedInMovieUpdateConnectionInput {
              edge: ActedInUpdateInput
              node: MovieUpdateInput
            }

            input ActorActedInMovieUpdateFieldInput {
              connect: [ActorActedInMovieConnectFieldInput!]
              connectOrCreate: [ActorActedInMovieConnectOrCreateFieldInput!]
              create: [ActorActedInMovieCreateFieldInput!]
              delete: [ActorActedInMovieDeleteFieldInput!]
              disconnect: [ActorActedInMovieDisconnectFieldInput!]
              update: ActorActedInMovieUpdateConnectionInput
              where: ActorActedInMovieConnectionWhere
            }

            type ActorActedInRelationship implements ActedIn {
              cursor: String!
              node: Production!
              screenTime: Int!
            }

            input ActorActedInSeriesConnectFieldInput {
              edge: ActedInCreateInput!
              where: SeriesConnectWhere
            }

            input ActorActedInSeriesConnectOrCreateFieldInput {
              onCreate: ActorActedInSeriesConnectOrCreateFieldInputOnCreate!
              where: SeriesConnectOrCreateWhere!
            }

            input ActorActedInSeriesConnectOrCreateFieldInputOnCreate {
              edge: ActedInCreateInput!
              node: SeriesOnCreateInput!
            }

            input ActorActedInSeriesConnectionWhere {
              AND: [ActorActedInSeriesConnectionWhere!]
              NOT: ActorActedInSeriesConnectionWhere
              OR: [ActorActedInSeriesConnectionWhere!]
              edge: ActedInWhere
              edge_NOT: ActedInWhere @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              node: SeriesWhere
              node_NOT: SeriesWhere @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
            }

            input ActorActedInSeriesCreateFieldInput {
              edge: ActedInCreateInput!
              node: SeriesCreateInput!
            }

            input ActorActedInSeriesDeleteFieldInput {
              where: ActorActedInSeriesConnectionWhere
            }

            input ActorActedInSeriesDisconnectFieldInput {
              where: ActorActedInSeriesConnectionWhere
            }

            input ActorActedInSeriesFieldInput {
              connect: [ActorActedInSeriesConnectFieldInput!]
              connectOrCreate: [ActorActedInSeriesConnectOrCreateFieldInput!]
              create: [ActorActedInSeriesCreateFieldInput!]
            }

            input ActorActedInSeriesUpdateConnectionInput {
              edge: ActedInUpdateInput
              node: SeriesUpdateInput
            }

            input ActorActedInSeriesUpdateFieldInput {
              connect: [ActorActedInSeriesConnectFieldInput!]
              connectOrCreate: [ActorActedInSeriesConnectOrCreateFieldInput!]
              create: [ActorActedInSeriesCreateFieldInput!]
              delete: [ActorActedInSeriesDeleteFieldInput!]
              disconnect: [ActorActedInSeriesDisconnectFieldInput!]
              update: ActorActedInSeriesUpdateConnectionInput
              where: ActorActedInSeriesConnectionWhere
            }

            input ActorActedInUpdateInput {
              Movie: [ActorActedInMovieUpdateFieldInput!]
              Series: [ActorActedInSeriesUpdateFieldInput!]
            }

            type ActorAggregateSelection {
              count: Int!
              name: StringAggregateSelectionNonNullable!
            }

            input ActorConnectInput {
              actedIn: ActorActedInConnectInput
            }

            input ActorConnectOrCreateInput {
              actedIn: ActorActedInConnectOrCreateInput
            }

            input ActorCreateInput {
              actedIn: ActorActedInCreateInput
              name: String!
            }

            input ActorDeleteInput {
              actedIn: ActorActedInDeleteInput
            }

            input ActorDisconnectInput {
              actedIn: ActorActedInDisconnectInput
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
              actedIn: ActorActedInCreateFieldInput
            }

            \\"\\"\\"
            Fields to sort Actors by. The order in which sorts are applied is not guaranteed when specifying many fields in one ActorSort object.
            \\"\\"\\"
            input ActorSort {
              name: SortDirection
            }

            input ActorUpdateInput {
              actedIn: ActorActedInUpdateInput
              name: String
            }

            input ActorWhere {
              AND: [ActorWhere!]
              NOT: ActorWhere
              OR: [ActorWhere!]
              actedInConnection: ActorActedInConnectionWhere @deprecated(reason: \\"Use \`actedInConnection_SOME\` instead.\\")
              \\"\\"\\"
              Return Actors where all of the related ActorActedInConnections match this filter
              \\"\\"\\"
              actedInConnection_ALL: ActorActedInConnectionWhere
              \\"\\"\\"
              Return Actors where none of the related ActorActedInConnections match this filter
              \\"\\"\\"
              actedInConnection_NONE: ActorActedInConnectionWhere
              actedInConnection_NOT: ActorActedInConnectionWhere @deprecated(reason: \\"Use \`actedInConnection_NONE\` instead.\\")
              \\"\\"\\"
              Return Actors where one of the related ActorActedInConnections match this filter
              \\"\\"\\"
              actedInConnection_SINGLE: ActorActedInConnectionWhere
              \\"\\"\\"
              Return Actors where some of the related ActorActedInConnections match this filter
              \\"\\"\\"
              actedInConnection_SOME: ActorActedInConnectionWhere
              name: String
              name_CONTAINS: String
              name_ENDS_WITH: String
              name_IN: [String!]
              name_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              name_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              name_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              name_NOT_IN: [String!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              name_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
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

            type Movie {
              isan: String!
              title: String!
            }

            type MovieAggregateSelection {
              count: Int!
              isan: StringAggregateSelectionNonNullable!
              title: StringAggregateSelectionNonNullable!
            }

            input MovieConnectOrCreateWhere {
              node: MovieUniqueWhere!
            }

            input MovieConnectWhere {
              node: MovieWhere!
            }

            input MovieCreateInput {
              isan: String!
              title: String!
            }

            type MovieEdge {
              cursor: String!
              node: Movie!
            }

            input MovieOnCreateInput {
              isan: String!
              title: String!
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
              isan: SortDirection
              title: SortDirection
            }

            input MovieUniqueWhere {
              isan: String
            }

            input MovieUpdateInput {
              isan: String
              title: String
            }

            input MovieWhere {
              AND: [MovieWhere!]
              NOT: MovieWhere
              OR: [MovieWhere!]
              isan: String
              isan_CONTAINS: String
              isan_ENDS_WITH: String
              isan_IN: [String!]
              isan_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              isan_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              isan_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              isan_NOT_IN: [String!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              isan_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              isan_STARTS_WITH: String
              title: String
              title_CONTAINS: String
              title_ENDS_WITH: String
              title_IN: [String!]
              title_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              title_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              title_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              title_NOT_IN: [String!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              title_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
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
              updateActors(connect: ActorConnectInput, connectOrCreate: ActorConnectOrCreateInput, create: ActorRelationInput, delete: ActorDeleteInput, disconnect: ActorDisconnectInput, update: ActorUpdateInput, where: ActorWhere): UpdateActorsMutationResponse!
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

            union Production = Movie | Series

            input ProductionWhere {
              Movie: MovieWhere
              Series: SeriesWhere
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

            input QueryOptions {
              limit: Int
              offset: Int
            }

            type Series {
              isan: String!
              title: String!
            }

            type SeriesAggregateSelection {
              count: Int!
              isan: StringAggregateSelectionNonNullable!
              title: StringAggregateSelectionNonNullable!
            }

            input SeriesConnectOrCreateWhere {
              node: SeriesUniqueWhere!
            }

            input SeriesConnectWhere {
              node: SeriesWhere!
            }

            type SeriesConnection {
              edges: [SeriesEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input SeriesCreateInput {
              isan: String!
              title: String!
            }

            type SeriesEdge {
              cursor: String!
              node: Series!
            }

            input SeriesOnCreateInput {
              isan: String!
              title: String!
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
              isan: SortDirection
              title: SortDirection
            }

            input SeriesUniqueWhere {
              isan: String
            }

            input SeriesUpdateInput {
              isan: String
              title: String
            }

            input SeriesWhere {
              AND: [SeriesWhere!]
              NOT: SeriesWhere
              OR: [SeriesWhere!]
              isan: String
              isan_CONTAINS: String
              isan_ENDS_WITH: String
              isan_IN: [String!]
              isan_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              isan_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              isan_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              isan_NOT_IN: [String!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              isan_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              isan_STARTS_WITH: String
              title: String
              title_CONTAINS: String
              title_ENDS_WITH: String
              title_IN: [String!]
              title_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              title_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              title_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              title_NOT_IN: [String!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              title_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
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
});
