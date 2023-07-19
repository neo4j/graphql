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
import { gql } from "graphql-tag";
import { Neo4jGraphQL } from "../../src";

describe("Interface Relationships", () => {
    test("Interface Relationships - single", async () => {
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
              NOT: ActorActedInConnectionWhere
              OR: [ActorActedInConnectionWhere!]
              edge: ActedInWhere
              edge_NOT: ActedInWhere @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              node: ProductionWhere
              node_NOT: ProductionWhere @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
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
              bookmark: String @deprecated(reason: \\"This field has been deprecated because bookmarks are now handled by the driver.\\")
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
              bookmark: String @deprecated(reason: \\"This field has been deprecated because bookmarks are now handled by the driver.\\")
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
              runtime_DECREMENT: Int
              runtime_INCREMENT: Int
              title: String
            }

            input MovieWhere {
              AND: [MovieWhere!]
              NOT: MovieWhere
              OR: [MovieWhere!]
              runtime: Int
              runtime_GT: Int
              runtime_GTE: Int
              runtime_IN: [Int!]
              runtime_LT: Int
              runtime_LTE: Int
              runtime_NOT: Int @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              runtime_NOT_IN: [Int!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
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
              title_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              title_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              title_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              title_NOT_IN: [String!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              title_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
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
              episodes_DECREMENT: Int
              episodes_INCREMENT: Int
              title: String
            }

            input SeriesWhere {
              AND: [SeriesWhere!]
              NOT: SeriesWhere
              OR: [SeriesWhere!]
              episodes: Int
              episodes_GT: Int
              episodes_GTE: Int
              episodes_IN: [Int!]
              episodes_LT: Int
              episodes_LTE: Int
              episodes_NOT: Int @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              episodes_NOT_IN: [Int!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
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
              bookmark: String @deprecated(reason: \\"This field has been deprecated because bookmarks are now handled by the driver.\\")
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

    test("Interface Relationships - multiple", async () => {
        const typeDefs = gql`
            type Episode {
                runtime: Int!
                series: Series! @relationship(type: "HAS_EPISODE", direction: IN)
            }

            interface Production {
                title: String!
                actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN, properties: "ActedIn")
            }

            type Movie implements Production {
                title: String!
                runtime: Int!
                actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN, properties: "ActedIn")
            }

            type Series implements Production {
                title: String!
                episodeCount: Int!
                episodes: [Episode!]! @relationship(type: "HAS_EPISODE", direction: OUT)
                actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN, properties: "ActedIn")
            }

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
              actedIn(directed: Boolean = true, options: ProductionOptions, where: ProductionWhere): [Production!]!
              actedInConnection(after: String, directed: Boolean = true, first: Int, sort: [ActorActedInConnectionSort!], where: ActorActedInConnectionWhere): ActorActedInConnection!
              name: String!
            }

            input ActorActedInConnectFieldInput {
              connect: ProductionConnectInput
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
              NOT: ActorActedInConnectionWhere
              OR: [ActorActedInConnectionWhere!]
              edge: ActedInWhere
              edge_NOT: ActedInWhere @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              node: ProductionWhere
              node_NOT: ProductionWhere @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
            }

            input ActorActedInCreateFieldInput {
              edge: ActedInCreateInput!
              node: ProductionCreateInput!
            }

            input ActorActedInDeleteFieldInput {
              delete: ProductionDeleteInput
              where: ActorActedInConnectionWhere
            }

            input ActorActedInDisconnectFieldInput {
              disconnect: ProductionDisconnectInput
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

            input ActorConnectWhere {
              node: ActorWhere!
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

            type CreateEpisodesMutationResponse {
              episodes: [Episode!]!
              info: CreateInfo!
            }

            type CreateInfo {
              bookmark: String @deprecated(reason: \\"This field has been deprecated because bookmarks are now handled by the driver.\\")
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
              bookmark: String @deprecated(reason: \\"This field has been deprecated because bookmarks are now handled by the driver.\\")
              nodesDeleted: Int!
              relationshipsDeleted: Int!
            }

            type Episode {
              runtime: Int!
              series(directed: Boolean = true, options: SeriesOptions, where: SeriesWhere): Series!
              seriesAggregate(directed: Boolean = true, where: SeriesWhere): EpisodeSeriesSeriesAggregationSelection
              seriesConnection(after: String, directed: Boolean = true, first: Int, sort: [EpisodeSeriesConnectionSort!], where: EpisodeSeriesConnectionWhere): EpisodeSeriesConnection!
            }

            type EpisodeAggregateSelection {
              count: Int!
              runtime: IntAggregateSelectionNonNullable!
            }

            input EpisodeConnectInput {
              series: EpisodeSeriesConnectFieldInput
            }

            input EpisodeConnectWhere {
              node: EpisodeWhere!
            }

            input EpisodeCreateInput {
              runtime: Int!
              series: EpisodeSeriesFieldInput
            }

            input EpisodeDeleteInput {
              series: EpisodeSeriesDeleteFieldInput
            }

            input EpisodeDisconnectInput {
              series: EpisodeSeriesDisconnectFieldInput
            }

            type EpisodeEdge {
              cursor: String!
              node: Episode!
            }

            input EpisodeOptions {
              limit: Int
              offset: Int
              \\"\\"\\"
              Specify one or more EpisodeSort objects to sort Episodes by. The sorts will be applied in the order in which they are arranged in the array.
              \\"\\"\\"
              sort: [EpisodeSort!]
            }

            input EpisodeRelationInput {
              series: EpisodeSeriesCreateFieldInput
            }

            input EpisodeSeriesAggregateInput {
              AND: [EpisodeSeriesAggregateInput!]
              NOT: EpisodeSeriesAggregateInput
              OR: [EpisodeSeriesAggregateInput!]
              count: Int
              count_GT: Int
              count_GTE: Int
              count_LT: Int
              count_LTE: Int
              node: EpisodeSeriesNodeAggregationWhereInput
            }

            input EpisodeSeriesConnectFieldInput {
              connect: SeriesConnectInput
              \\"\\"\\"
              Whether or not to overwrite any matching relationship with the new properties. Will default to \`false\` in 4.0.0.
              \\"\\"\\"
              overwrite: Boolean! = true
              where: SeriesConnectWhere
            }

            type EpisodeSeriesConnection {
              edges: [EpisodeSeriesRelationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input EpisodeSeriesConnectionSort {
              node: SeriesSort
            }

            input EpisodeSeriesConnectionWhere {
              AND: [EpisodeSeriesConnectionWhere!]
              NOT: EpisodeSeriesConnectionWhere
              OR: [EpisodeSeriesConnectionWhere!]
              node: SeriesWhere
              node_NOT: SeriesWhere @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
            }

            input EpisodeSeriesCreateFieldInput {
              node: SeriesCreateInput!
            }

            input EpisodeSeriesDeleteFieldInput {
              delete: SeriesDeleteInput
              where: EpisodeSeriesConnectionWhere
            }

            input EpisodeSeriesDisconnectFieldInput {
              disconnect: SeriesDisconnectInput
              where: EpisodeSeriesConnectionWhere
            }

            input EpisodeSeriesFieldInput {
              connect: EpisodeSeriesConnectFieldInput
              create: EpisodeSeriesCreateFieldInput
            }

            input EpisodeSeriesNodeAggregationWhereInput {
              AND: [EpisodeSeriesNodeAggregationWhereInput!]
              NOT: EpisodeSeriesNodeAggregationWhereInput
              OR: [EpisodeSeriesNodeAggregationWhereInput!]
              episodeCount_AVERAGE_EQUAL: Float
              episodeCount_AVERAGE_GT: Float
              episodeCount_AVERAGE_GTE: Float
              episodeCount_AVERAGE_LT: Float
              episodeCount_AVERAGE_LTE: Float
              episodeCount_EQUAL: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              episodeCount_GT: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              episodeCount_GTE: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              episodeCount_LT: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              episodeCount_LTE: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              episodeCount_MAX_EQUAL: Int
              episodeCount_MAX_GT: Int
              episodeCount_MAX_GTE: Int
              episodeCount_MAX_LT: Int
              episodeCount_MAX_LTE: Int
              episodeCount_MIN_EQUAL: Int
              episodeCount_MIN_GT: Int
              episodeCount_MIN_GTE: Int
              episodeCount_MIN_LT: Int
              episodeCount_MIN_LTE: Int
              episodeCount_SUM_EQUAL: Int
              episodeCount_SUM_GT: Int
              episodeCount_SUM_GTE: Int
              episodeCount_SUM_LT: Int
              episodeCount_SUM_LTE: Int
              title_AVERAGE_EQUAL: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              title_AVERAGE_GT: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              title_AVERAGE_GTE: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              title_AVERAGE_LENGTH_EQUAL: Float
              title_AVERAGE_LENGTH_GT: Float
              title_AVERAGE_LENGTH_GTE: Float
              title_AVERAGE_LENGTH_LT: Float
              title_AVERAGE_LENGTH_LTE: Float
              title_AVERAGE_LT: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              title_AVERAGE_LTE: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              title_EQUAL: String @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              title_GT: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              title_GTE: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              title_LONGEST_EQUAL: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              title_LONGEST_GT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              title_LONGEST_GTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              title_LONGEST_LENGTH_EQUAL: Int
              title_LONGEST_LENGTH_GT: Int
              title_LONGEST_LENGTH_GTE: Int
              title_LONGEST_LENGTH_LT: Int
              title_LONGEST_LENGTH_LTE: Int
              title_LONGEST_LT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              title_LONGEST_LTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              title_LT: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              title_LTE: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              title_SHORTEST_EQUAL: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              title_SHORTEST_GT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              title_SHORTEST_GTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              title_SHORTEST_LENGTH_EQUAL: Int
              title_SHORTEST_LENGTH_GT: Int
              title_SHORTEST_LENGTH_GTE: Int
              title_SHORTEST_LENGTH_LT: Int
              title_SHORTEST_LENGTH_LTE: Int
              title_SHORTEST_LT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              title_SHORTEST_LTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
            }

            type EpisodeSeriesRelationship {
              cursor: String!
              node: Series!
            }

            type EpisodeSeriesSeriesAggregationSelection {
              count: Int!
              node: EpisodeSeriesSeriesNodeAggregateSelection
            }

            type EpisodeSeriesSeriesNodeAggregateSelection {
              episodeCount: IntAggregateSelectionNonNullable!
              title: StringAggregateSelectionNonNullable!
            }

            input EpisodeSeriesUpdateConnectionInput {
              node: SeriesUpdateInput
            }

            input EpisodeSeriesUpdateFieldInput {
              connect: EpisodeSeriesConnectFieldInput
              create: EpisodeSeriesCreateFieldInput
              delete: EpisodeSeriesDeleteFieldInput
              disconnect: EpisodeSeriesDisconnectFieldInput
              update: EpisodeSeriesUpdateConnectionInput
              where: EpisodeSeriesConnectionWhere
            }

            \\"\\"\\"
            Fields to sort Episodes by. The order in which sorts are applied is not guaranteed when specifying many fields in one EpisodeSort object.
            \\"\\"\\"
            input EpisodeSort {
              runtime: SortDirection
            }

            input EpisodeUpdateInput {
              runtime: Int
              runtime_DECREMENT: Int
              runtime_INCREMENT: Int
              series: EpisodeSeriesUpdateFieldInput
            }

            input EpisodeWhere {
              AND: [EpisodeWhere!]
              NOT: EpisodeWhere
              OR: [EpisodeWhere!]
              runtime: Int
              runtime_GT: Int
              runtime_GTE: Int
              runtime_IN: [Int!]
              runtime_LT: Int
              runtime_LTE: Int
              runtime_NOT: Int @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              runtime_NOT_IN: [Int!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              series: SeriesWhere
              seriesAggregate: EpisodeSeriesAggregateInput
              seriesConnection: EpisodeSeriesConnectionWhere
              seriesConnection_NOT: EpisodeSeriesConnectionWhere
              series_NOT: SeriesWhere
            }

            type EpisodesConnection {
              edges: [EpisodeEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            type IntAggregateSelectionNonNullable {
              average: Float!
              max: Int!
              min: Int!
              sum: Int!
            }

            type Movie implements Production {
              actors(directed: Boolean = true, options: ActorOptions, where: ActorWhere): [Actor!]!
              actorsAggregate(directed: Boolean = true, where: ActorWhere): MovieActorActorsAggregationSelection
              actorsConnection(after: String, directed: Boolean = true, first: Int, sort: [ProductionActorsConnectionSort!], where: ProductionActorsConnectionWhere): ProductionActorsConnection!
              runtime: Int!
              title: String!
            }

            type MovieActorActorsAggregationSelection {
              count: Int!
              edge: MovieActorActorsEdgeAggregateSelection
              node: MovieActorActorsNodeAggregateSelection
            }

            type MovieActorActorsEdgeAggregateSelection {
              screenTime: IntAggregateSelectionNonNullable!
            }

            type MovieActorActorsNodeAggregateSelection {
              name: StringAggregateSelectionNonNullable!
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
              edge: MovieActorsEdgeAggregationWhereInput
              node: MovieActorsNodeAggregationWhereInput
            }

            input MovieActorsEdgeAggregationWhereInput {
              AND: [MovieActorsEdgeAggregationWhereInput!]
              NOT: MovieActorsEdgeAggregationWhereInput
              OR: [MovieActorsEdgeAggregationWhereInput!]
              screenTime_AVERAGE_EQUAL: Float
              screenTime_AVERAGE_GT: Float
              screenTime_AVERAGE_GTE: Float
              screenTime_AVERAGE_LT: Float
              screenTime_AVERAGE_LTE: Float
              screenTime_EQUAL: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              screenTime_GT: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              screenTime_GTE: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              screenTime_LT: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              screenTime_LTE: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
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

            input MovieActorsNodeAggregationWhereInput {
              AND: [MovieActorsNodeAggregationWhereInput!]
              NOT: MovieActorsNodeAggregationWhereInput
              OR: [MovieActorsNodeAggregationWhereInput!]
              name_AVERAGE_EQUAL: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              name_AVERAGE_GT: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              name_AVERAGE_GTE: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              name_AVERAGE_LENGTH_EQUAL: Float
              name_AVERAGE_LENGTH_GT: Float
              name_AVERAGE_LENGTH_GTE: Float
              name_AVERAGE_LENGTH_LT: Float
              name_AVERAGE_LENGTH_LTE: Float
              name_AVERAGE_LT: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              name_AVERAGE_LTE: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              name_EQUAL: String @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              name_GT: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              name_GTE: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              name_LONGEST_EQUAL: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              name_LONGEST_GT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              name_LONGEST_GTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              name_LONGEST_LENGTH_EQUAL: Int
              name_LONGEST_LENGTH_GT: Int
              name_LONGEST_LENGTH_GTE: Int
              name_LONGEST_LENGTH_LT: Int
              name_LONGEST_LENGTH_LTE: Int
              name_LONGEST_LT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              name_LONGEST_LTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              name_LT: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              name_LTE: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              name_SHORTEST_EQUAL: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              name_SHORTEST_GT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              name_SHORTEST_GTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              name_SHORTEST_LENGTH_EQUAL: Int
              name_SHORTEST_LENGTH_GT: Int
              name_SHORTEST_LENGTH_GTE: Int
              name_SHORTEST_LENGTH_LT: Int
              name_SHORTEST_LENGTH_LTE: Int
              name_SHORTEST_LT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              name_SHORTEST_LTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
            }

            type MovieAggregateSelection {
              count: Int!
              runtime: IntAggregateSelectionNonNullable!
              title: StringAggregateSelectionNonNullable!
            }

            input MovieConnectInput {
              actors: [ProductionActorsConnectFieldInput!]
            }

            input MovieCreateInput {
              actors: ProductionActorsFieldInput
              runtime: Int!
              title: String!
            }

            input MovieDeleteInput {
              actors: [ProductionActorsDeleteFieldInput!]
            }

            input MovieDisconnectInput {
              actors: [ProductionActorsDisconnectFieldInput!]
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
              actors: [ProductionActorsCreateFieldInput!]
            }

            \\"\\"\\"
            Fields to sort Movies by. The order in which sorts are applied is not guaranteed when specifying many fields in one MovieSort object.
            \\"\\"\\"
            input MovieSort {
              runtime: SortDirection
              title: SortDirection
            }

            input MovieUpdateInput {
              actors: [ProductionActorsUpdateFieldInput!]
              runtime: Int
              runtime_DECREMENT: Int
              runtime_INCREMENT: Int
              title: String
            }

            input MovieWhere {
              AND: [MovieWhere!]
              NOT: MovieWhere
              OR: [MovieWhere!]
              actors: ActorWhere @deprecated(reason: \\"Use \`actors_SOME\` instead.\\")
              actorsAggregate: MovieActorsAggregateInput
              actorsConnection: ProductionActorsConnectionWhere @deprecated(reason: \\"Use \`actorsConnection_SOME\` instead.\\")
              \\"\\"\\"
              Return Movies where all of the related ProductionActorsConnections match this filter
              \\"\\"\\"
              actorsConnection_ALL: ProductionActorsConnectionWhere
              \\"\\"\\"
              Return Movies where none of the related ProductionActorsConnections match this filter
              \\"\\"\\"
              actorsConnection_NONE: ProductionActorsConnectionWhere
              actorsConnection_NOT: ProductionActorsConnectionWhere @deprecated(reason: \\"Use \`actorsConnection_NONE\` instead.\\")
              \\"\\"\\"
              Return Movies where one of the related ProductionActorsConnections match this filter
              \\"\\"\\"
              actorsConnection_SINGLE: ProductionActorsConnectionWhere
              \\"\\"\\"
              Return Movies where some of the related ProductionActorsConnections match this filter
              \\"\\"\\"
              actorsConnection_SOME: ProductionActorsConnectionWhere
              \\"\\"\\"Return Movies where all of the related Actors match this filter\\"\\"\\"
              actors_ALL: ActorWhere
              \\"\\"\\"Return Movies where none of the related Actors match this filter\\"\\"\\"
              actors_NONE: ActorWhere
              actors_NOT: ActorWhere @deprecated(reason: \\"Use \`actors_NONE\` instead.\\")
              \\"\\"\\"Return Movies where one of the related Actors match this filter\\"\\"\\"
              actors_SINGLE: ActorWhere
              \\"\\"\\"Return Movies where some of the related Actors match this filter\\"\\"\\"
              actors_SOME: ActorWhere
              runtime: Int
              runtime_GT: Int
              runtime_GTE: Int
              runtime_IN: [Int!]
              runtime_LT: Int
              runtime_LTE: Int
              runtime_NOT: Int @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              runtime_NOT_IN: [Int!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
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
              createEpisodes(input: [EpisodeCreateInput!]!): CreateEpisodesMutationResponse!
              createMovies(input: [MovieCreateInput!]!): CreateMoviesMutationResponse!
              createSeries(input: [SeriesCreateInput!]!): CreateSeriesMutationResponse!
              deleteActors(delete: ActorDeleteInput, where: ActorWhere): DeleteInfo!
              deleteEpisodes(delete: EpisodeDeleteInput, where: EpisodeWhere): DeleteInfo!
              deleteMovies(delete: MovieDeleteInput, where: MovieWhere): DeleteInfo!
              deleteSeries(delete: SeriesDeleteInput, where: SeriesWhere): DeleteInfo!
              updateActors(connect: ActorConnectInput, create: ActorRelationInput, delete: ActorDeleteInput, disconnect: ActorDisconnectInput, update: ActorUpdateInput, where: ActorWhere): UpdateActorsMutationResponse!
              updateEpisodes(connect: EpisodeConnectInput, create: EpisodeRelationInput, delete: EpisodeDeleteInput, disconnect: EpisodeDisconnectInput, update: EpisodeUpdateInput, where: EpisodeWhere): UpdateEpisodesMutationResponse!
              updateMovies(connect: MovieConnectInput, create: MovieRelationInput, delete: MovieDeleteInput, disconnect: MovieDisconnectInput, update: MovieUpdateInput, where: MovieWhere): UpdateMoviesMutationResponse!
              updateSeries(connect: SeriesConnectInput, create: SeriesRelationInput, delete: SeriesDeleteInput, disconnect: SeriesDisconnectInput, update: SeriesUpdateInput, where: SeriesWhere): UpdateSeriesMutationResponse!
            }

            \\"\\"\\"Pagination information (Relay)\\"\\"\\"
            type PageInfo {
              endCursor: String
              hasNextPage: Boolean!
              hasPreviousPage: Boolean!
              startCursor: String
            }

            interface Production {
              actors(directed: Boolean = true, options: ActorOptions, where: ActorWhere): [Actor!]!
              actorsConnection(after: String, directed: Boolean = true, first: Int, sort: [ProductionActorsConnectionSort!], where: ProductionActorsConnectionWhere): ProductionActorsConnection!
              title: String!
            }

            input ProductionActorsAggregateInput {
              AND: [ProductionActorsAggregateInput!]
              NOT: ProductionActorsAggregateInput
              OR: [ProductionActorsAggregateInput!]
              count: Int
              count_GT: Int
              count_GTE: Int
              count_LT: Int
              count_LTE: Int
              edge: ProductionActorsEdgeAggregationWhereInput
              node: ProductionActorsNodeAggregationWhereInput
            }

            input ProductionActorsConnectFieldInput {
              connect: [ActorConnectInput!]
              edge: ActedInCreateInput!
              \\"\\"\\"
              Whether or not to overwrite any matching relationship with the new properties. Will default to \`false\` in 4.0.0.
              \\"\\"\\"
              overwrite: Boolean! = true
              where: ActorConnectWhere
            }

            type ProductionActorsConnection {
              edges: [ProductionActorsRelationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input ProductionActorsConnectionSort {
              edge: ActedInSort
              node: ActorSort
            }

            input ProductionActorsConnectionWhere {
              AND: [ProductionActorsConnectionWhere!]
              NOT: ProductionActorsConnectionWhere
              OR: [ProductionActorsConnectionWhere!]
              edge: ActedInWhere
              edge_NOT: ActedInWhere @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              node: ActorWhere
              node_NOT: ActorWhere @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
            }

            input ProductionActorsCreateFieldInput {
              edge: ActedInCreateInput!
              node: ActorCreateInput!
            }

            input ProductionActorsDeleteFieldInput {
              delete: ActorDeleteInput
              where: ProductionActorsConnectionWhere
            }

            input ProductionActorsDisconnectFieldInput {
              disconnect: ActorDisconnectInput
              where: ProductionActorsConnectionWhere
            }

            input ProductionActorsEdgeAggregationWhereInput {
              AND: [ProductionActorsEdgeAggregationWhereInput!]
              NOT: ProductionActorsEdgeAggregationWhereInput
              OR: [ProductionActorsEdgeAggregationWhereInput!]
              screenTime_AVERAGE_EQUAL: Float
              screenTime_AVERAGE_GT: Float
              screenTime_AVERAGE_GTE: Float
              screenTime_AVERAGE_LT: Float
              screenTime_AVERAGE_LTE: Float
              screenTime_EQUAL: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              screenTime_GT: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              screenTime_GTE: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              screenTime_LT: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              screenTime_LTE: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
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

            input ProductionActorsFieldInput {
              connect: [ProductionActorsConnectFieldInput!]
              create: [ProductionActorsCreateFieldInput!]
            }

            input ProductionActorsNodeAggregationWhereInput {
              AND: [ProductionActorsNodeAggregationWhereInput!]
              NOT: ProductionActorsNodeAggregationWhereInput
              OR: [ProductionActorsNodeAggregationWhereInput!]
              name_AVERAGE_EQUAL: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              name_AVERAGE_GT: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              name_AVERAGE_GTE: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              name_AVERAGE_LENGTH_EQUAL: Float
              name_AVERAGE_LENGTH_GT: Float
              name_AVERAGE_LENGTH_GTE: Float
              name_AVERAGE_LENGTH_LT: Float
              name_AVERAGE_LENGTH_LTE: Float
              name_AVERAGE_LT: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              name_AVERAGE_LTE: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              name_EQUAL: String @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              name_GT: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              name_GTE: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              name_LONGEST_EQUAL: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              name_LONGEST_GT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              name_LONGEST_GTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              name_LONGEST_LENGTH_EQUAL: Int
              name_LONGEST_LENGTH_GT: Int
              name_LONGEST_LENGTH_GTE: Int
              name_LONGEST_LENGTH_LT: Int
              name_LONGEST_LENGTH_LTE: Int
              name_LONGEST_LT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              name_LONGEST_LTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              name_LT: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              name_LTE: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              name_SHORTEST_EQUAL: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              name_SHORTEST_GT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              name_SHORTEST_GTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              name_SHORTEST_LENGTH_EQUAL: Int
              name_SHORTEST_LENGTH_GT: Int
              name_SHORTEST_LENGTH_GTE: Int
              name_SHORTEST_LENGTH_LT: Int
              name_SHORTEST_LENGTH_LTE: Int
              name_SHORTEST_LT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              name_SHORTEST_LTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
            }

            type ProductionActorsRelationship implements ActedIn {
              cursor: String!
              node: Actor!
              screenTime: Int!
            }

            input ProductionActorsUpdateConnectionInput {
              edge: ActedInUpdateInput
              node: ActorUpdateInput
            }

            input ProductionActorsUpdateFieldInput {
              connect: [ProductionActorsConnectFieldInput!]
              create: [ProductionActorsCreateFieldInput!]
              delete: [ProductionActorsDeleteFieldInput!]
              disconnect: [ProductionActorsDisconnectFieldInput!]
              update: ProductionActorsUpdateConnectionInput
              where: ProductionActorsConnectionWhere
            }

            input ProductionConnectInput {
              _on: ProductionImplementationsConnectInput
              actors: [ProductionActorsConnectFieldInput!]
            }

            input ProductionConnectWhere {
              node: ProductionWhere!
            }

            input ProductionCreateInput {
              Movie: MovieCreateInput
              Series: SeriesCreateInput
            }

            input ProductionDeleteInput {
              _on: ProductionImplementationsDeleteInput
              actors: [ProductionActorsDeleteFieldInput!]
            }

            input ProductionDisconnectInput {
              _on: ProductionImplementationsDisconnectInput
              actors: [ProductionActorsDisconnectFieldInput!]
            }

            input ProductionImplementationsConnectInput {
              Movie: [MovieConnectInput!]
              Series: [SeriesConnectInput!]
            }

            input ProductionImplementationsDeleteInput {
              Movie: [MovieDeleteInput!]
              Series: [SeriesDeleteInput!]
            }

            input ProductionImplementationsDisconnectInput {
              Movie: [MovieDisconnectInput!]
              Series: [SeriesDisconnectInput!]
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
              actors: [ProductionActorsUpdateFieldInput!]
              title: String
            }

            input ProductionWhere {
              _on: ProductionImplementationsWhere
              actors: ActorWhere @deprecated(reason: \\"Use \`actors_SOME\` instead.\\")
              actorsAggregate: ProductionActorsAggregateInput
              actorsConnection: ProductionActorsConnectionWhere @deprecated(reason: \\"Use \`actorsConnection_SOME\` instead.\\")
              \\"\\"\\"
              Return Productions where all of the related ProductionActorsConnections match this filter
              \\"\\"\\"
              actorsConnection_ALL: ProductionActorsConnectionWhere
              \\"\\"\\"
              Return Productions where none of the related ProductionActorsConnections match this filter
              \\"\\"\\"
              actorsConnection_NONE: ProductionActorsConnectionWhere
              actorsConnection_NOT: ProductionActorsConnectionWhere @deprecated(reason: \\"Use \`actorsConnection_NONE\` instead.\\")
              \\"\\"\\"
              Return Productions where one of the related ProductionActorsConnections match this filter
              \\"\\"\\"
              actorsConnection_SINGLE: ProductionActorsConnectionWhere
              \\"\\"\\"
              Return Productions where some of the related ProductionActorsConnections match this filter
              \\"\\"\\"
              actorsConnection_SOME: ProductionActorsConnectionWhere
              \\"\\"\\"Return Productions where all of the related Actors match this filter\\"\\"\\"
              actors_ALL: ActorWhere
              \\"\\"\\"Return Productions where none of the related Actors match this filter\\"\\"\\"
              actors_NONE: ActorWhere
              actors_NOT: ActorWhere @deprecated(reason: \\"Use \`actors_NONE\` instead.\\")
              \\"\\"\\"Return Productions where one of the related Actors match this filter\\"\\"\\"
              actors_SINGLE: ActorWhere
              \\"\\"\\"Return Productions where some of the related Actors match this filter\\"\\"\\"
              actors_SOME: ActorWhere
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

            type Query {
              actors(options: ActorOptions, where: ActorWhere): [Actor!]!
              actorsAggregate(where: ActorWhere): ActorAggregateSelection!
              actorsConnection(after: String, first: Int, sort: [ActorSort], where: ActorWhere): ActorsConnection!
              episodes(options: EpisodeOptions, where: EpisodeWhere): [Episode!]!
              episodesAggregate(where: EpisodeWhere): EpisodeAggregateSelection!
              episodesConnection(after: String, first: Int, sort: [EpisodeSort], where: EpisodeWhere): EpisodesConnection!
              movies(options: MovieOptions, where: MovieWhere): [Movie!]!
              moviesAggregate(where: MovieWhere): MovieAggregateSelection!
              moviesConnection(after: String, first: Int, sort: [MovieSort], where: MovieWhere): MoviesConnection!
              series(options: SeriesOptions, where: SeriesWhere): [Series!]!
              seriesAggregate(where: SeriesWhere): SeriesAggregateSelection!
              seriesConnection(after: String, first: Int, sort: [SeriesSort], where: SeriesWhere): SeriesConnection!
            }

            type Series implements Production {
              actors(directed: Boolean = true, options: ActorOptions, where: ActorWhere): [Actor!]!
              actorsAggregate(directed: Boolean = true, where: ActorWhere): SeriesActorActorsAggregationSelection
              actorsConnection(after: String, directed: Boolean = true, first: Int, sort: [ProductionActorsConnectionSort!], where: ProductionActorsConnectionWhere): ProductionActorsConnection!
              episodeCount: Int!
              episodes(directed: Boolean = true, options: EpisodeOptions, where: EpisodeWhere): [Episode!]!
              episodesAggregate(directed: Boolean = true, where: EpisodeWhere): SeriesEpisodeEpisodesAggregationSelection
              episodesConnection(after: String, directed: Boolean = true, first: Int, sort: [SeriesEpisodesConnectionSort!], where: SeriesEpisodesConnectionWhere): SeriesEpisodesConnection!
              title: String!
            }

            type SeriesActorActorsAggregationSelection {
              count: Int!
              edge: SeriesActorActorsEdgeAggregateSelection
              node: SeriesActorActorsNodeAggregateSelection
            }

            type SeriesActorActorsEdgeAggregateSelection {
              screenTime: IntAggregateSelectionNonNullable!
            }

            type SeriesActorActorsNodeAggregateSelection {
              name: StringAggregateSelectionNonNullable!
            }

            input SeriesActorsAggregateInput {
              AND: [SeriesActorsAggregateInput!]
              NOT: SeriesActorsAggregateInput
              OR: [SeriesActorsAggregateInput!]
              count: Int
              count_GT: Int
              count_GTE: Int
              count_LT: Int
              count_LTE: Int
              edge: SeriesActorsEdgeAggregationWhereInput
              node: SeriesActorsNodeAggregationWhereInput
            }

            input SeriesActorsEdgeAggregationWhereInput {
              AND: [SeriesActorsEdgeAggregationWhereInput!]
              NOT: SeriesActorsEdgeAggregationWhereInput
              OR: [SeriesActorsEdgeAggregationWhereInput!]
              screenTime_AVERAGE_EQUAL: Float
              screenTime_AVERAGE_GT: Float
              screenTime_AVERAGE_GTE: Float
              screenTime_AVERAGE_LT: Float
              screenTime_AVERAGE_LTE: Float
              screenTime_EQUAL: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              screenTime_GT: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              screenTime_GTE: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              screenTime_LT: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              screenTime_LTE: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
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

            input SeriesActorsNodeAggregationWhereInput {
              AND: [SeriesActorsNodeAggregationWhereInput!]
              NOT: SeriesActorsNodeAggregationWhereInput
              OR: [SeriesActorsNodeAggregationWhereInput!]
              name_AVERAGE_EQUAL: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              name_AVERAGE_GT: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              name_AVERAGE_GTE: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              name_AVERAGE_LENGTH_EQUAL: Float
              name_AVERAGE_LENGTH_GT: Float
              name_AVERAGE_LENGTH_GTE: Float
              name_AVERAGE_LENGTH_LT: Float
              name_AVERAGE_LENGTH_LTE: Float
              name_AVERAGE_LT: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              name_AVERAGE_LTE: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              name_EQUAL: String @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              name_GT: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              name_GTE: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              name_LONGEST_EQUAL: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              name_LONGEST_GT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              name_LONGEST_GTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              name_LONGEST_LENGTH_EQUAL: Int
              name_LONGEST_LENGTH_GT: Int
              name_LONGEST_LENGTH_GTE: Int
              name_LONGEST_LENGTH_LT: Int
              name_LONGEST_LENGTH_LTE: Int
              name_LONGEST_LT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              name_LONGEST_LTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              name_LT: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              name_LTE: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              name_SHORTEST_EQUAL: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              name_SHORTEST_GT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              name_SHORTEST_GTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              name_SHORTEST_LENGTH_EQUAL: Int
              name_SHORTEST_LENGTH_GT: Int
              name_SHORTEST_LENGTH_GTE: Int
              name_SHORTEST_LENGTH_LT: Int
              name_SHORTEST_LENGTH_LTE: Int
              name_SHORTEST_LT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              name_SHORTEST_LTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
            }

            type SeriesAggregateSelection {
              count: Int!
              episodeCount: IntAggregateSelectionNonNullable!
              title: StringAggregateSelectionNonNullable!
            }

            input SeriesConnectInput {
              actors: [ProductionActorsConnectFieldInput!]
              episodes: [SeriesEpisodesConnectFieldInput!]
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
              actors: ProductionActorsFieldInput
              episodeCount: Int!
              episodes: SeriesEpisodesFieldInput
              title: String!
            }

            input SeriesDeleteInput {
              actors: [ProductionActorsDeleteFieldInput!]
              episodes: [SeriesEpisodesDeleteFieldInput!]
            }

            input SeriesDisconnectInput {
              actors: [ProductionActorsDisconnectFieldInput!]
              episodes: [SeriesEpisodesDisconnectFieldInput!]
            }

            type SeriesEdge {
              cursor: String!
              node: Series!
            }

            type SeriesEpisodeEpisodesAggregationSelection {
              count: Int!
              node: SeriesEpisodeEpisodesNodeAggregateSelection
            }

            type SeriesEpisodeEpisodesNodeAggregateSelection {
              runtime: IntAggregateSelectionNonNullable!
            }

            input SeriesEpisodesAggregateInput {
              AND: [SeriesEpisodesAggregateInput!]
              NOT: SeriesEpisodesAggregateInput
              OR: [SeriesEpisodesAggregateInput!]
              count: Int
              count_GT: Int
              count_GTE: Int
              count_LT: Int
              count_LTE: Int
              node: SeriesEpisodesNodeAggregationWhereInput
            }

            input SeriesEpisodesConnectFieldInput {
              connect: [EpisodeConnectInput!]
              \\"\\"\\"
              Whether or not to overwrite any matching relationship with the new properties. Will default to \`false\` in 4.0.0.
              \\"\\"\\"
              overwrite: Boolean! = true
              where: EpisodeConnectWhere
            }

            type SeriesEpisodesConnection {
              edges: [SeriesEpisodesRelationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input SeriesEpisodesConnectionSort {
              node: EpisodeSort
            }

            input SeriesEpisodesConnectionWhere {
              AND: [SeriesEpisodesConnectionWhere!]
              NOT: SeriesEpisodesConnectionWhere
              OR: [SeriesEpisodesConnectionWhere!]
              node: EpisodeWhere
              node_NOT: EpisodeWhere @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
            }

            input SeriesEpisodesCreateFieldInput {
              node: EpisodeCreateInput!
            }

            input SeriesEpisodesDeleteFieldInput {
              delete: EpisodeDeleteInput
              where: SeriesEpisodesConnectionWhere
            }

            input SeriesEpisodesDisconnectFieldInput {
              disconnect: EpisodeDisconnectInput
              where: SeriesEpisodesConnectionWhere
            }

            input SeriesEpisodesFieldInput {
              connect: [SeriesEpisodesConnectFieldInput!]
              create: [SeriesEpisodesCreateFieldInput!]
            }

            input SeriesEpisodesNodeAggregationWhereInput {
              AND: [SeriesEpisodesNodeAggregationWhereInput!]
              NOT: SeriesEpisodesNodeAggregationWhereInput
              OR: [SeriesEpisodesNodeAggregationWhereInput!]
              runtime_AVERAGE_EQUAL: Float
              runtime_AVERAGE_GT: Float
              runtime_AVERAGE_GTE: Float
              runtime_AVERAGE_LT: Float
              runtime_AVERAGE_LTE: Float
              runtime_EQUAL: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              runtime_GT: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              runtime_GTE: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              runtime_LT: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              runtime_LTE: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              runtime_MAX_EQUAL: Int
              runtime_MAX_GT: Int
              runtime_MAX_GTE: Int
              runtime_MAX_LT: Int
              runtime_MAX_LTE: Int
              runtime_MIN_EQUAL: Int
              runtime_MIN_GT: Int
              runtime_MIN_GTE: Int
              runtime_MIN_LT: Int
              runtime_MIN_LTE: Int
              runtime_SUM_EQUAL: Int
              runtime_SUM_GT: Int
              runtime_SUM_GTE: Int
              runtime_SUM_LT: Int
              runtime_SUM_LTE: Int
            }

            type SeriesEpisodesRelationship {
              cursor: String!
              node: Episode!
            }

            input SeriesEpisodesUpdateConnectionInput {
              node: EpisodeUpdateInput
            }

            input SeriesEpisodesUpdateFieldInput {
              connect: [SeriesEpisodesConnectFieldInput!]
              create: [SeriesEpisodesCreateFieldInput!]
              delete: [SeriesEpisodesDeleteFieldInput!]
              disconnect: [SeriesEpisodesDisconnectFieldInput!]
              update: SeriesEpisodesUpdateConnectionInput
              where: SeriesEpisodesConnectionWhere
            }

            input SeriesOptions {
              limit: Int
              offset: Int
              \\"\\"\\"
              Specify one or more SeriesSort objects to sort Series by. The sorts will be applied in the order in which they are arranged in the array.
              \\"\\"\\"
              sort: [SeriesSort!]
            }

            input SeriesRelationInput {
              actors: [ProductionActorsCreateFieldInput!]
              episodes: [SeriesEpisodesCreateFieldInput!]
            }

            \\"\\"\\"
            Fields to sort Series by. The order in which sorts are applied is not guaranteed when specifying many fields in one SeriesSort object.
            \\"\\"\\"
            input SeriesSort {
              episodeCount: SortDirection
              title: SortDirection
            }

            input SeriesUpdateInput {
              actors: [ProductionActorsUpdateFieldInput!]
              episodeCount: Int
              episodeCount_DECREMENT: Int
              episodeCount_INCREMENT: Int
              episodes: [SeriesEpisodesUpdateFieldInput!]
              title: String
            }

            input SeriesWhere {
              AND: [SeriesWhere!]
              NOT: SeriesWhere
              OR: [SeriesWhere!]
              actors: ActorWhere @deprecated(reason: \\"Use \`actors_SOME\` instead.\\")
              actorsAggregate: SeriesActorsAggregateInput
              actorsConnection: ProductionActorsConnectionWhere @deprecated(reason: \\"Use \`actorsConnection_SOME\` instead.\\")
              \\"\\"\\"
              Return Series where all of the related ProductionActorsConnections match this filter
              \\"\\"\\"
              actorsConnection_ALL: ProductionActorsConnectionWhere
              \\"\\"\\"
              Return Series where none of the related ProductionActorsConnections match this filter
              \\"\\"\\"
              actorsConnection_NONE: ProductionActorsConnectionWhere
              actorsConnection_NOT: ProductionActorsConnectionWhere @deprecated(reason: \\"Use \`actorsConnection_NONE\` instead.\\")
              \\"\\"\\"
              Return Series where one of the related ProductionActorsConnections match this filter
              \\"\\"\\"
              actorsConnection_SINGLE: ProductionActorsConnectionWhere
              \\"\\"\\"
              Return Series where some of the related ProductionActorsConnections match this filter
              \\"\\"\\"
              actorsConnection_SOME: ProductionActorsConnectionWhere
              \\"\\"\\"Return Series where all of the related Actors match this filter\\"\\"\\"
              actors_ALL: ActorWhere
              \\"\\"\\"Return Series where none of the related Actors match this filter\\"\\"\\"
              actors_NONE: ActorWhere
              actors_NOT: ActorWhere @deprecated(reason: \\"Use \`actors_NONE\` instead.\\")
              \\"\\"\\"Return Series where one of the related Actors match this filter\\"\\"\\"
              actors_SINGLE: ActorWhere
              \\"\\"\\"Return Series where some of the related Actors match this filter\\"\\"\\"
              actors_SOME: ActorWhere
              episodeCount: Int
              episodeCount_GT: Int
              episodeCount_GTE: Int
              episodeCount_IN: [Int!]
              episodeCount_LT: Int
              episodeCount_LTE: Int
              episodeCount_NOT: Int @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              episodeCount_NOT_IN: [Int!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              episodes: EpisodeWhere @deprecated(reason: \\"Use \`episodes_SOME\` instead.\\")
              episodesAggregate: SeriesEpisodesAggregateInput
              episodesConnection: SeriesEpisodesConnectionWhere @deprecated(reason: \\"Use \`episodesConnection_SOME\` instead.\\")
              \\"\\"\\"
              Return Series where all of the related SeriesEpisodesConnections match this filter
              \\"\\"\\"
              episodesConnection_ALL: SeriesEpisodesConnectionWhere
              \\"\\"\\"
              Return Series where none of the related SeriesEpisodesConnections match this filter
              \\"\\"\\"
              episodesConnection_NONE: SeriesEpisodesConnectionWhere
              episodesConnection_NOT: SeriesEpisodesConnectionWhere @deprecated(reason: \\"Use \`episodesConnection_NONE\` instead.\\")
              \\"\\"\\"
              Return Series where one of the related SeriesEpisodesConnections match this filter
              \\"\\"\\"
              episodesConnection_SINGLE: SeriesEpisodesConnectionWhere
              \\"\\"\\"
              Return Series where some of the related SeriesEpisodesConnections match this filter
              \\"\\"\\"
              episodesConnection_SOME: SeriesEpisodesConnectionWhere
              \\"\\"\\"Return Series where all of the related Episodes match this filter\\"\\"\\"
              episodes_ALL: EpisodeWhere
              \\"\\"\\"Return Series where none of the related Episodes match this filter\\"\\"\\"
              episodes_NONE: EpisodeWhere
              episodes_NOT: EpisodeWhere @deprecated(reason: \\"Use \`episodes_NONE\` instead.\\")
              \\"\\"\\"Return Series where one of the related Episodes match this filter\\"\\"\\"
              episodes_SINGLE: EpisodeWhere
              \\"\\"\\"Return Series where some of the related Episodes match this filter\\"\\"\\"
              episodes_SOME: EpisodeWhere
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

            type UpdateEpisodesMutationResponse {
              episodes: [Episode!]!
              info: UpdateInfo!
            }

            type UpdateInfo {
              bookmark: String @deprecated(reason: \\"This field has been deprecated because bookmarks are now handled by the driver.\\")
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

    test("Interface Relationships - nested interface relationships", async () => {
        const typeDefs = gql`
            interface Interface1 {
                field1: String!
                interface2: [Interface2!]! @relationship(type: "INTERFACE_TWO", direction: OUT)
            }

            interface Interface2 {
                field2: String
            }

            type Type1Interface1 implements Interface1 {
                field1: String!
                interface2: [Interface2!]! @relationship(type: "INTERFACE_TWO", direction: OUT)
            }

            type Type2Interface1 implements Interface1 {
                field1: String!
                interface2: [Interface2!]! @relationship(type: "INTERFACE_TWO", direction: OUT)
            }

            type Type1Interface2 implements Interface2 {
                field2: String!
            }

            type Type2Interface2 implements Interface2 {
                field2: String!
            }

            type Type1 {
                field1: String!
                interface1: [Interface1!]! @relationship(type: "INTERFACE_ONE", direction: OUT)
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
              bookmark: String @deprecated(reason: \\"This field has been deprecated because bookmarks are now handled by the driver.\\")
              nodesCreated: Int!
              relationshipsCreated: Int!
            }

            type CreateType1Interface1sMutationResponse {
              info: CreateInfo!
              type1Interface1s: [Type1Interface1!]!
            }

            type CreateType1Interface2sMutationResponse {
              info: CreateInfo!
              type1Interface2s: [Type1Interface2!]!
            }

            type CreateType1sMutationResponse {
              info: CreateInfo!
              type1s: [Type1!]!
            }

            type CreateType2Interface1sMutationResponse {
              info: CreateInfo!
              type2Interface1s: [Type2Interface1!]!
            }

            type CreateType2Interface2sMutationResponse {
              info: CreateInfo!
              type2Interface2s: [Type2Interface2!]!
            }

            type DeleteInfo {
              bookmark: String @deprecated(reason: \\"This field has been deprecated because bookmarks are now handled by the driver.\\")
              nodesDeleted: Int!
              relationshipsDeleted: Int!
            }

            interface Interface1 {
              field1: String!
              interface2(directed: Boolean = true, options: Interface2Options, where: Interface2Where): [Interface2!]!
              interface2Connection(after: String, directed: Boolean = true, first: Int, where: Interface1Interface2ConnectionWhere): Interface1Interface2Connection!
            }

            input Interface1ConnectInput {
              _on: Interface1ImplementationsConnectInput
              interface2: [Interface1Interface2ConnectFieldInput!]
            }

            input Interface1ConnectWhere {
              node: Interface1Where!
            }

            input Interface1CreateInput {
              Type1Interface1: Type1Interface1CreateInput
              Type2Interface1: Type2Interface1CreateInput
            }

            input Interface1DeleteInput {
              _on: Interface1ImplementationsDeleteInput
              interface2: [Interface1Interface2DeleteFieldInput!]
            }

            input Interface1DisconnectInput {
              _on: Interface1ImplementationsDisconnectInput
              interface2: [Interface1Interface2DisconnectFieldInput!]
            }

            input Interface1ImplementationsConnectInput {
              Type1Interface1: [Type1Interface1ConnectInput!]
              Type2Interface1: [Type2Interface1ConnectInput!]
            }

            input Interface1ImplementationsDeleteInput {
              Type1Interface1: [Type1Interface1DeleteInput!]
              Type2Interface1: [Type2Interface1DeleteInput!]
            }

            input Interface1ImplementationsDisconnectInput {
              Type1Interface1: [Type1Interface1DisconnectInput!]
              Type2Interface1: [Type2Interface1DisconnectInput!]
            }

            input Interface1ImplementationsUpdateInput {
              Type1Interface1: Type1Interface1UpdateInput
              Type2Interface1: Type2Interface1UpdateInput
            }

            input Interface1ImplementationsWhere {
              Type1Interface1: Type1Interface1Where
              Type2Interface1: Type2Interface1Where
            }

            input Interface1Interface2ConnectFieldInput {
              where: Interface2ConnectWhere
            }

            type Interface1Interface2Connection {
              edges: [Interface1Interface2Relationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input Interface1Interface2ConnectionSort {
              node: Interface2Sort
            }

            input Interface1Interface2ConnectionWhere {
              AND: [Interface1Interface2ConnectionWhere!]
              NOT: Interface1Interface2ConnectionWhere
              OR: [Interface1Interface2ConnectionWhere!]
              node: Interface2Where
              node_NOT: Interface2Where @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
            }

            input Interface1Interface2CreateFieldInput {
              node: Interface2CreateInput!
            }

            input Interface1Interface2DeleteFieldInput {
              where: Interface1Interface2ConnectionWhere
            }

            input Interface1Interface2DisconnectFieldInput {
              where: Interface1Interface2ConnectionWhere
            }

            input Interface1Interface2FieldInput {
              connect: [Interface1Interface2ConnectFieldInput!]
              create: [Interface1Interface2CreateFieldInput!]
            }

            type Interface1Interface2Relationship {
              cursor: String!
              node: Interface2!
            }

            input Interface1Interface2UpdateConnectionInput {
              node: Interface2UpdateInput
            }

            input Interface1Interface2UpdateFieldInput {
              connect: [Interface1Interface2ConnectFieldInput!]
              create: [Interface1Interface2CreateFieldInput!]
              delete: [Interface1Interface2DeleteFieldInput!]
              disconnect: [Interface1Interface2DisconnectFieldInput!]
              update: Interface1Interface2UpdateConnectionInput
              where: Interface1Interface2ConnectionWhere
            }

            input Interface1Options {
              limit: Int
              offset: Int
              \\"\\"\\"
              Specify one or more Interface1Sort objects to sort Interface1s by. The sorts will be applied in the order in which they are arranged in the array.
              \\"\\"\\"
              sort: [Interface1Sort]
            }

            \\"\\"\\"
            Fields to sort Interface1s by. The order in which sorts are applied is not guaranteed when specifying many fields in one Interface1Sort object.
            \\"\\"\\"
            input Interface1Sort {
              field1: SortDirection
            }

            input Interface1UpdateInput {
              _on: Interface1ImplementationsUpdateInput
              field1: String
              interface2: [Interface1Interface2UpdateFieldInput!]
            }

            input Interface1Where {
              _on: Interface1ImplementationsWhere
              field1: String
              field1_CONTAINS: String
              field1_ENDS_WITH: String
              field1_IN: [String!]
              field1_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              field1_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              field1_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              field1_NOT_IN: [String!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              field1_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              field1_STARTS_WITH: String
              interface2Connection: Interface1Interface2ConnectionWhere @deprecated(reason: \\"Use \`interface2Connection_SOME\` instead.\\")
              \\"\\"\\"
              Return Interface1s where all of the related Interface1Interface2Connections match this filter
              \\"\\"\\"
              interface2Connection_ALL: Interface1Interface2ConnectionWhere
              \\"\\"\\"
              Return Interface1s where none of the related Interface1Interface2Connections match this filter
              \\"\\"\\"
              interface2Connection_NONE: Interface1Interface2ConnectionWhere
              interface2Connection_NOT: Interface1Interface2ConnectionWhere @deprecated(reason: \\"Use \`interface2Connection_NONE\` instead.\\")
              \\"\\"\\"
              Return Interface1s where one of the related Interface1Interface2Connections match this filter
              \\"\\"\\"
              interface2Connection_SINGLE: Interface1Interface2ConnectionWhere
              \\"\\"\\"
              Return Interface1s where some of the related Interface1Interface2Connections match this filter
              \\"\\"\\"
              interface2Connection_SOME: Interface1Interface2ConnectionWhere
            }

            interface Interface2 {
              field2: String
            }

            input Interface2ConnectWhere {
              node: Interface2Where!
            }

            input Interface2CreateInput {
              Type1Interface2: Type1Interface2CreateInput
              Type2Interface2: Type2Interface2CreateInput
            }

            input Interface2ImplementationsUpdateInput {
              Type1Interface2: Type1Interface2UpdateInput
              Type2Interface2: Type2Interface2UpdateInput
            }

            input Interface2ImplementationsWhere {
              Type1Interface2: Type1Interface2Where
              Type2Interface2: Type2Interface2Where
            }

            input Interface2Options {
              limit: Int
              offset: Int
              \\"\\"\\"
              Specify one or more Interface2Sort objects to sort Interface2s by. The sorts will be applied in the order in which they are arranged in the array.
              \\"\\"\\"
              sort: [Interface2Sort]
            }

            \\"\\"\\"
            Fields to sort Interface2s by. The order in which sorts are applied is not guaranteed when specifying many fields in one Interface2Sort object.
            \\"\\"\\"
            input Interface2Sort {
              field2: SortDirection
            }

            input Interface2UpdateInput {
              _on: Interface2ImplementationsUpdateInput
              field2: String
            }

            input Interface2Where {
              _on: Interface2ImplementationsWhere
              field2: String
              field2_CONTAINS: String
              field2_ENDS_WITH: String
              field2_IN: [String]
              field2_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              field2_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              field2_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              field2_NOT_IN: [String] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              field2_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              field2_STARTS_WITH: String
            }

            type Mutation {
              createType1Interface1s(input: [Type1Interface1CreateInput!]!): CreateType1Interface1sMutationResponse!
              createType1Interface2s(input: [Type1Interface2CreateInput!]!): CreateType1Interface2sMutationResponse!
              createType1s(input: [Type1CreateInput!]!): CreateType1sMutationResponse!
              createType2Interface1s(input: [Type2Interface1CreateInput!]!): CreateType2Interface1sMutationResponse!
              createType2Interface2s(input: [Type2Interface2CreateInput!]!): CreateType2Interface2sMutationResponse!
              deleteType1Interface1s(delete: Type1Interface1DeleteInput, where: Type1Interface1Where): DeleteInfo!
              deleteType1Interface2s(where: Type1Interface2Where): DeleteInfo!
              deleteType1s(delete: Type1DeleteInput, where: Type1Where): DeleteInfo!
              deleteType2Interface1s(delete: Type2Interface1DeleteInput, where: Type2Interface1Where): DeleteInfo!
              deleteType2Interface2s(where: Type2Interface2Where): DeleteInfo!
              updateType1Interface1s(connect: Type1Interface1ConnectInput, create: Type1Interface1RelationInput, delete: Type1Interface1DeleteInput, disconnect: Type1Interface1DisconnectInput, update: Type1Interface1UpdateInput, where: Type1Interface1Where): UpdateType1Interface1sMutationResponse!
              updateType1Interface2s(update: Type1Interface2UpdateInput, where: Type1Interface2Where): UpdateType1Interface2sMutationResponse!
              updateType1s(connect: Type1ConnectInput, create: Type1RelationInput, delete: Type1DeleteInput, disconnect: Type1DisconnectInput, update: Type1UpdateInput, where: Type1Where): UpdateType1sMutationResponse!
              updateType2Interface1s(connect: Type2Interface1ConnectInput, create: Type2Interface1RelationInput, delete: Type2Interface1DeleteInput, disconnect: Type2Interface1DisconnectInput, update: Type2Interface1UpdateInput, where: Type2Interface1Where): UpdateType2Interface1sMutationResponse!
              updateType2Interface2s(update: Type2Interface2UpdateInput, where: Type2Interface2Where): UpdateType2Interface2sMutationResponse!
            }

            \\"\\"\\"Pagination information (Relay)\\"\\"\\"
            type PageInfo {
              endCursor: String
              hasNextPage: Boolean!
              hasPreviousPage: Boolean!
              startCursor: String
            }

            type Query {
              type1Interface1s(options: Type1Interface1Options, where: Type1Interface1Where): [Type1Interface1!]!
              type1Interface1sAggregate(where: Type1Interface1Where): Type1Interface1AggregateSelection!
              type1Interface1sConnection(after: String, first: Int, sort: [Type1Interface1Sort], where: Type1Interface1Where): Type1Interface1sConnection!
              type1Interface2s(options: Type1Interface2Options, where: Type1Interface2Where): [Type1Interface2!]!
              type1Interface2sAggregate(where: Type1Interface2Where): Type1Interface2AggregateSelection!
              type1Interface2sConnection(after: String, first: Int, sort: [Type1Interface2Sort], where: Type1Interface2Where): Type1Interface2sConnection!
              type1s(options: Type1Options, where: Type1Where): [Type1!]!
              type1sAggregate(where: Type1Where): Type1AggregateSelection!
              type1sConnection(after: String, first: Int, sort: [Type1Sort], where: Type1Where): Type1sConnection!
              type2Interface1s(options: Type2Interface1Options, where: Type2Interface1Where): [Type2Interface1!]!
              type2Interface1sAggregate(where: Type2Interface1Where): Type2Interface1AggregateSelection!
              type2Interface1sConnection(after: String, first: Int, sort: [Type2Interface1Sort], where: Type2Interface1Where): Type2Interface1sConnection!
              type2Interface2s(options: Type2Interface2Options, where: Type2Interface2Where): [Type2Interface2!]!
              type2Interface2sAggregate(where: Type2Interface2Where): Type2Interface2AggregateSelection!
              type2Interface2sConnection(after: String, first: Int, sort: [Type2Interface2Sort], where: Type2Interface2Where): Type2Interface2sConnection!
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

            type Type1 {
              field1: String!
              interface1(directed: Boolean = true, options: Interface1Options, where: Interface1Where): [Interface1!]!
              interface1Connection(after: String, directed: Boolean = true, first: Int, sort: [Type1Interface1ConnectionSort!], where: Type1Interface1ConnectionWhere): Type1Interface1Connection!
            }

            type Type1AggregateSelection {
              count: Int!
              field1: StringAggregateSelectionNonNullable!
            }

            input Type1ConnectInput {
              interface1: [Type1Interface1ConnectFieldInput!]
            }

            input Type1CreateInput {
              field1: String!
              interface1: Type1Interface1FieldInput
            }

            input Type1DeleteInput {
              interface1: [Type1Interface1DeleteFieldInput!]
            }

            input Type1DisconnectInput {
              interface1: [Type1Interface1DisconnectFieldInput!]
            }

            type Type1Edge {
              cursor: String!
              node: Type1!
            }

            type Type1Interface1 implements Interface1 {
              field1: String!
              interface2(directed: Boolean = true, options: Interface2Options, where: Interface2Where): [Interface2!]!
              interface2Connection(after: String, directed: Boolean = true, first: Int, sort: [Interface1Interface2ConnectionSort!], where: Interface1Interface2ConnectionWhere): Interface1Interface2Connection!
            }

            type Type1Interface1AggregateSelection {
              count: Int!
              field1: StringAggregateSelectionNonNullable!
            }

            input Type1Interface1ConnectFieldInput {
              connect: Interface1ConnectInput
              where: Interface1ConnectWhere
            }

            input Type1Interface1ConnectInput {
              interface2: [Type1Interface1Interface2ConnectFieldInput!]
            }

            type Type1Interface1Connection {
              edges: [Type1Interface1Relationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input Type1Interface1ConnectionSort {
              node: Interface1Sort
            }

            input Type1Interface1ConnectionWhere {
              AND: [Type1Interface1ConnectionWhere!]
              NOT: Type1Interface1ConnectionWhere
              OR: [Type1Interface1ConnectionWhere!]
              node: Interface1Where
              node_NOT: Interface1Where @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
            }

            input Type1Interface1CreateFieldInput {
              node: Interface1CreateInput!
            }

            input Type1Interface1CreateInput {
              field1: String!
              interface2: Interface1Interface2FieldInput
            }

            input Type1Interface1DeleteFieldInput {
              delete: Interface1DeleteInput
              where: Type1Interface1ConnectionWhere
            }

            input Type1Interface1DeleteInput {
              interface2: [Type1Interface1Interface2DeleteFieldInput!]
            }

            input Type1Interface1DisconnectFieldInput {
              disconnect: Interface1DisconnectInput
              where: Type1Interface1ConnectionWhere
            }

            input Type1Interface1DisconnectInput {
              interface2: [Type1Interface1Interface2DisconnectFieldInput!]
            }

            type Type1Interface1Edge {
              cursor: String!
              node: Type1Interface1!
            }

            input Type1Interface1FieldInput {
              connect: [Type1Interface1ConnectFieldInput!]
              create: [Type1Interface1CreateFieldInput!]
            }

            input Type1Interface1Interface2ConnectFieldInput {
              where: Interface2ConnectWhere
            }

            input Type1Interface1Interface2CreateFieldInput {
              node: Interface2CreateInput!
            }

            input Type1Interface1Interface2DeleteFieldInput {
              where: Interface1Interface2ConnectionWhere
            }

            input Type1Interface1Interface2DisconnectFieldInput {
              where: Interface1Interface2ConnectionWhere
            }

            input Type1Interface1Interface2UpdateConnectionInput {
              node: Interface2UpdateInput
            }

            input Type1Interface1Interface2UpdateFieldInput {
              connect: [Type1Interface1Interface2ConnectFieldInput!]
              create: [Type1Interface1Interface2CreateFieldInput!]
              delete: [Type1Interface1Interface2DeleteFieldInput!]
              disconnect: [Type1Interface1Interface2DisconnectFieldInput!]
              update: Type1Interface1Interface2UpdateConnectionInput
              where: Interface1Interface2ConnectionWhere
            }

            input Type1Interface1Options {
              limit: Int
              offset: Int
              \\"\\"\\"
              Specify one or more Type1Interface1Sort objects to sort Type1Interface1s by. The sorts will be applied in the order in which they are arranged in the array.
              \\"\\"\\"
              sort: [Type1Interface1Sort!]
            }

            input Type1Interface1RelationInput {
              interface2: [Type1Interface1Interface2CreateFieldInput!]
            }

            type Type1Interface1Relationship {
              cursor: String!
              node: Interface1!
            }

            \\"\\"\\"
            Fields to sort Type1Interface1s by. The order in which sorts are applied is not guaranteed when specifying many fields in one Type1Interface1Sort object.
            \\"\\"\\"
            input Type1Interface1Sort {
              field1: SortDirection
            }

            input Type1Interface1UpdateConnectionInput {
              node: Interface1UpdateInput
            }

            input Type1Interface1UpdateFieldInput {
              connect: [Type1Interface1ConnectFieldInput!]
              create: [Type1Interface1CreateFieldInput!]
              delete: [Type1Interface1DeleteFieldInput!]
              disconnect: [Type1Interface1DisconnectFieldInput!]
              update: Type1Interface1UpdateConnectionInput
              where: Type1Interface1ConnectionWhere
            }

            input Type1Interface1UpdateInput {
              field1: String
              interface2: [Type1Interface1Interface2UpdateFieldInput!]
            }

            input Type1Interface1Where {
              AND: [Type1Interface1Where!]
              NOT: Type1Interface1Where
              OR: [Type1Interface1Where!]
              field1: String
              field1_CONTAINS: String
              field1_ENDS_WITH: String
              field1_IN: [String!]
              field1_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              field1_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              field1_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              field1_NOT_IN: [String!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              field1_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              field1_STARTS_WITH: String
              interface2Connection: Interface1Interface2ConnectionWhere @deprecated(reason: \\"Use \`interface2Connection_SOME\` instead.\\")
              \\"\\"\\"
              Return Type1Interface1s where all of the related Interface1Interface2Connections match this filter
              \\"\\"\\"
              interface2Connection_ALL: Interface1Interface2ConnectionWhere
              \\"\\"\\"
              Return Type1Interface1s where none of the related Interface1Interface2Connections match this filter
              \\"\\"\\"
              interface2Connection_NONE: Interface1Interface2ConnectionWhere
              interface2Connection_NOT: Interface1Interface2ConnectionWhere @deprecated(reason: \\"Use \`interface2Connection_NONE\` instead.\\")
              \\"\\"\\"
              Return Type1Interface1s where one of the related Interface1Interface2Connections match this filter
              \\"\\"\\"
              interface2Connection_SINGLE: Interface1Interface2ConnectionWhere
              \\"\\"\\"
              Return Type1Interface1s where some of the related Interface1Interface2Connections match this filter
              \\"\\"\\"
              interface2Connection_SOME: Interface1Interface2ConnectionWhere
            }

            type Type1Interface1sConnection {
              edges: [Type1Interface1Edge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            type Type1Interface2 implements Interface2 {
              field2: String!
            }

            type Type1Interface2AggregateSelection {
              count: Int!
              field2: StringAggregateSelectionNonNullable!
            }

            input Type1Interface2CreateInput {
              field2: String!
            }

            type Type1Interface2Edge {
              cursor: String!
              node: Type1Interface2!
            }

            input Type1Interface2Options {
              limit: Int
              offset: Int
              \\"\\"\\"
              Specify one or more Type1Interface2Sort objects to sort Type1Interface2s by. The sorts will be applied in the order in which they are arranged in the array.
              \\"\\"\\"
              sort: [Type1Interface2Sort!]
            }

            \\"\\"\\"
            Fields to sort Type1Interface2s by. The order in which sorts are applied is not guaranteed when specifying many fields in one Type1Interface2Sort object.
            \\"\\"\\"
            input Type1Interface2Sort {
              field2: SortDirection
            }

            input Type1Interface2UpdateInput {
              field2: String
            }

            input Type1Interface2Where {
              AND: [Type1Interface2Where!]
              NOT: Type1Interface2Where
              OR: [Type1Interface2Where!]
              field2: String
              field2_CONTAINS: String
              field2_ENDS_WITH: String
              field2_IN: [String!]
              field2_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              field2_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              field2_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              field2_NOT_IN: [String!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              field2_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              field2_STARTS_WITH: String
            }

            type Type1Interface2sConnection {
              edges: [Type1Interface2Edge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input Type1Options {
              limit: Int
              offset: Int
              \\"\\"\\"
              Specify one or more Type1Sort objects to sort Type1s by. The sorts will be applied in the order in which they are arranged in the array.
              \\"\\"\\"
              sort: [Type1Sort!]
            }

            input Type1RelationInput {
              interface1: [Type1Interface1CreateFieldInput!]
            }

            \\"\\"\\"
            Fields to sort Type1s by. The order in which sorts are applied is not guaranteed when specifying many fields in one Type1Sort object.
            \\"\\"\\"
            input Type1Sort {
              field1: SortDirection
            }

            input Type1UpdateInput {
              field1: String
              interface1: [Type1Interface1UpdateFieldInput!]
            }

            input Type1Where {
              AND: [Type1Where!]
              NOT: Type1Where
              OR: [Type1Where!]
              field1: String
              field1_CONTAINS: String
              field1_ENDS_WITH: String
              field1_IN: [String!]
              field1_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              field1_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              field1_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              field1_NOT_IN: [String!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              field1_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              field1_STARTS_WITH: String
              interface1Connection: Type1Interface1ConnectionWhere @deprecated(reason: \\"Use \`interface1Connection_SOME\` instead.\\")
              \\"\\"\\"
              Return Type1s where all of the related Type1Interface1Connections match this filter
              \\"\\"\\"
              interface1Connection_ALL: Type1Interface1ConnectionWhere
              \\"\\"\\"
              Return Type1s where none of the related Type1Interface1Connections match this filter
              \\"\\"\\"
              interface1Connection_NONE: Type1Interface1ConnectionWhere
              interface1Connection_NOT: Type1Interface1ConnectionWhere @deprecated(reason: \\"Use \`interface1Connection_NONE\` instead.\\")
              \\"\\"\\"
              Return Type1s where one of the related Type1Interface1Connections match this filter
              \\"\\"\\"
              interface1Connection_SINGLE: Type1Interface1ConnectionWhere
              \\"\\"\\"
              Return Type1s where some of the related Type1Interface1Connections match this filter
              \\"\\"\\"
              interface1Connection_SOME: Type1Interface1ConnectionWhere
            }

            type Type1sConnection {
              edges: [Type1Edge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            type Type2Interface1 implements Interface1 {
              field1: String!
              interface2(directed: Boolean = true, options: Interface2Options, where: Interface2Where): [Interface2!]!
              interface2Connection(after: String, directed: Boolean = true, first: Int, sort: [Interface1Interface2ConnectionSort!], where: Interface1Interface2ConnectionWhere): Interface1Interface2Connection!
            }

            type Type2Interface1AggregateSelection {
              count: Int!
              field1: StringAggregateSelectionNonNullable!
            }

            input Type2Interface1ConnectInput {
              interface2: [Type2Interface1Interface2ConnectFieldInput!]
            }

            input Type2Interface1CreateInput {
              field1: String!
              interface2: Interface1Interface2FieldInput
            }

            input Type2Interface1DeleteInput {
              interface2: [Type2Interface1Interface2DeleteFieldInput!]
            }

            input Type2Interface1DisconnectInput {
              interface2: [Type2Interface1Interface2DisconnectFieldInput!]
            }

            type Type2Interface1Edge {
              cursor: String!
              node: Type2Interface1!
            }

            input Type2Interface1Interface2ConnectFieldInput {
              where: Interface2ConnectWhere
            }

            input Type2Interface1Interface2CreateFieldInput {
              node: Interface2CreateInput!
            }

            input Type2Interface1Interface2DeleteFieldInput {
              where: Interface1Interface2ConnectionWhere
            }

            input Type2Interface1Interface2DisconnectFieldInput {
              where: Interface1Interface2ConnectionWhere
            }

            input Type2Interface1Interface2UpdateConnectionInput {
              node: Interface2UpdateInput
            }

            input Type2Interface1Interface2UpdateFieldInput {
              connect: [Type2Interface1Interface2ConnectFieldInput!]
              create: [Type2Interface1Interface2CreateFieldInput!]
              delete: [Type2Interface1Interface2DeleteFieldInput!]
              disconnect: [Type2Interface1Interface2DisconnectFieldInput!]
              update: Type2Interface1Interface2UpdateConnectionInput
              where: Interface1Interface2ConnectionWhere
            }

            input Type2Interface1Options {
              limit: Int
              offset: Int
              \\"\\"\\"
              Specify one or more Type2Interface1Sort objects to sort Type2Interface1s by. The sorts will be applied in the order in which they are arranged in the array.
              \\"\\"\\"
              sort: [Type2Interface1Sort!]
            }

            input Type2Interface1RelationInput {
              interface2: [Type2Interface1Interface2CreateFieldInput!]
            }

            \\"\\"\\"
            Fields to sort Type2Interface1s by. The order in which sorts are applied is not guaranteed when specifying many fields in one Type2Interface1Sort object.
            \\"\\"\\"
            input Type2Interface1Sort {
              field1: SortDirection
            }

            input Type2Interface1UpdateInput {
              field1: String
              interface2: [Type2Interface1Interface2UpdateFieldInput!]
            }

            input Type2Interface1Where {
              AND: [Type2Interface1Where!]
              NOT: Type2Interface1Where
              OR: [Type2Interface1Where!]
              field1: String
              field1_CONTAINS: String
              field1_ENDS_WITH: String
              field1_IN: [String!]
              field1_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              field1_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              field1_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              field1_NOT_IN: [String!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              field1_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              field1_STARTS_WITH: String
              interface2Connection: Interface1Interface2ConnectionWhere @deprecated(reason: \\"Use \`interface2Connection_SOME\` instead.\\")
              \\"\\"\\"
              Return Type2Interface1s where all of the related Interface1Interface2Connections match this filter
              \\"\\"\\"
              interface2Connection_ALL: Interface1Interface2ConnectionWhere
              \\"\\"\\"
              Return Type2Interface1s where none of the related Interface1Interface2Connections match this filter
              \\"\\"\\"
              interface2Connection_NONE: Interface1Interface2ConnectionWhere
              interface2Connection_NOT: Interface1Interface2ConnectionWhere @deprecated(reason: \\"Use \`interface2Connection_NONE\` instead.\\")
              \\"\\"\\"
              Return Type2Interface1s where one of the related Interface1Interface2Connections match this filter
              \\"\\"\\"
              interface2Connection_SINGLE: Interface1Interface2ConnectionWhere
              \\"\\"\\"
              Return Type2Interface1s where some of the related Interface1Interface2Connections match this filter
              \\"\\"\\"
              interface2Connection_SOME: Interface1Interface2ConnectionWhere
            }

            type Type2Interface1sConnection {
              edges: [Type2Interface1Edge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            type Type2Interface2 implements Interface2 {
              field2: String!
            }

            type Type2Interface2AggregateSelection {
              count: Int!
              field2: StringAggregateSelectionNonNullable!
            }

            input Type2Interface2CreateInput {
              field2: String!
            }

            type Type2Interface2Edge {
              cursor: String!
              node: Type2Interface2!
            }

            input Type2Interface2Options {
              limit: Int
              offset: Int
              \\"\\"\\"
              Specify one or more Type2Interface2Sort objects to sort Type2Interface2s by. The sorts will be applied in the order in which they are arranged in the array.
              \\"\\"\\"
              sort: [Type2Interface2Sort!]
            }

            \\"\\"\\"
            Fields to sort Type2Interface2s by. The order in which sorts are applied is not guaranteed when specifying many fields in one Type2Interface2Sort object.
            \\"\\"\\"
            input Type2Interface2Sort {
              field2: SortDirection
            }

            input Type2Interface2UpdateInput {
              field2: String
            }

            input Type2Interface2Where {
              AND: [Type2Interface2Where!]
              NOT: Type2Interface2Where
              OR: [Type2Interface2Where!]
              field2: String
              field2_CONTAINS: String
              field2_ENDS_WITH: String
              field2_IN: [String!]
              field2_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              field2_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              field2_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              field2_NOT_IN: [String!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              field2_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              field2_STARTS_WITH: String
            }

            type Type2Interface2sConnection {
              edges: [Type2Interface2Edge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            type UpdateInfo {
              bookmark: String @deprecated(reason: \\"This field has been deprecated because bookmarks are now handled by the driver.\\")
              nodesCreated: Int!
              nodesDeleted: Int!
              relationshipsCreated: Int!
              relationshipsDeleted: Int!
            }

            type UpdateType1Interface1sMutationResponse {
              info: UpdateInfo!
              type1Interface1s: [Type1Interface1!]!
            }

            type UpdateType1Interface2sMutationResponse {
              info: UpdateInfo!
              type1Interface2s: [Type1Interface2!]!
            }

            type UpdateType1sMutationResponse {
              info: UpdateInfo!
              type1s: [Type1!]!
            }

            type UpdateType2Interface1sMutationResponse {
              info: UpdateInfo!
              type2Interface1s: [Type2Interface1!]!
            }

            type UpdateType2Interface2sMutationResponse {
              info: UpdateInfo!
              type2Interface2s: [Type2Interface2!]!
            }"
        `);

        // expect(() => {
        //     // eslint-disable-next-line @typescript-eslint/no-unused-vars
        //     const neoSchema = new Neo4jGraphQL({ typeDefs });
        // }).toThrowError("Nested interface relationship fields are not supported: Interface1.interface2");
    });

    test("Interface Relationships - nested relationships", async () => {
        const typeDefs = gql`
            interface Content {
                id: ID
                content: String
                creator: User! @relationship(type: "HAS_CONTENT", direction: IN)
            }

            type Comment implements Content {
                id: ID
                content: String
                creator: User!
                post: Post! @relationship(type: "HAS_COMMENT", direction: IN)
            }

            type Post implements Content {
                id: ID
                content: String
                creator: User!
                comments: [Comment!]! @relationship(type: "HAS_COMMENT", direction: OUT)
            }

            type User {
                id: ID
                name: String
                content: [Content!]! @relationship(type: "HAS_CONTENT", direction: OUT)
            }
        `;

        const neoSchema = new Neo4jGraphQL({ typeDefs });
        const printedSchema = printSchemaWithDirectives(lexicographicSortSchema(await neoSchema.getSchema()));

        expect(printedSchema).toMatchInlineSnapshot(`
            "schema {
              query: Query
              mutation: Mutation
            }

            type Comment implements Content {
              content: String
              creator(directed: Boolean = true, options: UserOptions, where: UserWhere): User!
              creatorAggregate(directed: Boolean = true, where: UserWhere): CommentUserCreatorAggregationSelection
              creatorConnection(after: String, directed: Boolean = true, first: Int, sort: [ContentCreatorConnectionSort!], where: ContentCreatorConnectionWhere): ContentCreatorConnection!
              id: ID
              post(directed: Boolean = true, options: PostOptions, where: PostWhere): Post!
              postAggregate(directed: Boolean = true, where: PostWhere): CommentPostPostAggregationSelection
              postConnection(after: String, directed: Boolean = true, first: Int, sort: [CommentPostConnectionSort!], where: CommentPostConnectionWhere): CommentPostConnection!
            }

            type CommentAggregateSelection {
              content: StringAggregateSelectionNullable!
              count: Int!
              id: IDAggregateSelectionNullable!
            }

            input CommentConnectInput {
              creator: ContentCreatorConnectFieldInput
              post: CommentPostConnectFieldInput
            }

            input CommentConnectWhere {
              node: CommentWhere!
            }

            input CommentCreateInput {
              content: String
              creator: ContentCreatorFieldInput
              id: ID
              post: CommentPostFieldInput
            }

            input CommentCreatorAggregateInput {
              AND: [CommentCreatorAggregateInput!]
              NOT: CommentCreatorAggregateInput
              OR: [CommentCreatorAggregateInput!]
              count: Int
              count_GT: Int
              count_GTE: Int
              count_LT: Int
              count_LTE: Int
              node: CommentCreatorNodeAggregationWhereInput
            }

            input CommentCreatorNodeAggregationWhereInput {
              AND: [CommentCreatorNodeAggregationWhereInput!]
              NOT: CommentCreatorNodeAggregationWhereInput
              OR: [CommentCreatorNodeAggregationWhereInput!]
              id_EQUAL: ID @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              name_AVERAGE_EQUAL: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              name_AVERAGE_GT: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              name_AVERAGE_GTE: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              name_AVERAGE_LENGTH_EQUAL: Float
              name_AVERAGE_LENGTH_GT: Float
              name_AVERAGE_LENGTH_GTE: Float
              name_AVERAGE_LENGTH_LT: Float
              name_AVERAGE_LENGTH_LTE: Float
              name_AVERAGE_LT: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              name_AVERAGE_LTE: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              name_EQUAL: String @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              name_GT: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              name_GTE: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              name_LONGEST_EQUAL: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              name_LONGEST_GT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              name_LONGEST_GTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              name_LONGEST_LENGTH_EQUAL: Int
              name_LONGEST_LENGTH_GT: Int
              name_LONGEST_LENGTH_GTE: Int
              name_LONGEST_LENGTH_LT: Int
              name_LONGEST_LENGTH_LTE: Int
              name_LONGEST_LT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              name_LONGEST_LTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              name_LT: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              name_LTE: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              name_SHORTEST_EQUAL: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              name_SHORTEST_GT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              name_SHORTEST_GTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              name_SHORTEST_LENGTH_EQUAL: Int
              name_SHORTEST_LENGTH_GT: Int
              name_SHORTEST_LENGTH_GTE: Int
              name_SHORTEST_LENGTH_LT: Int
              name_SHORTEST_LENGTH_LTE: Int
              name_SHORTEST_LT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              name_SHORTEST_LTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
            }

            input CommentDeleteInput {
              creator: ContentCreatorDeleteFieldInput
              post: CommentPostDeleteFieldInput
            }

            input CommentDisconnectInput {
              creator: ContentCreatorDisconnectFieldInput
              post: CommentPostDisconnectFieldInput
            }

            type CommentEdge {
              cursor: String!
              node: Comment!
            }

            input CommentOptions {
              limit: Int
              offset: Int
              \\"\\"\\"
              Specify one or more CommentSort objects to sort Comments by. The sorts will be applied in the order in which they are arranged in the array.
              \\"\\"\\"
              sort: [CommentSort!]
            }

            input CommentPostAggregateInput {
              AND: [CommentPostAggregateInput!]
              NOT: CommentPostAggregateInput
              OR: [CommentPostAggregateInput!]
              count: Int
              count_GT: Int
              count_GTE: Int
              count_LT: Int
              count_LTE: Int
              node: CommentPostNodeAggregationWhereInput
            }

            input CommentPostConnectFieldInput {
              connect: PostConnectInput
              \\"\\"\\"
              Whether or not to overwrite any matching relationship with the new properties. Will default to \`false\` in 4.0.0.
              \\"\\"\\"
              overwrite: Boolean! = true
              where: PostConnectWhere
            }

            type CommentPostConnection {
              edges: [CommentPostRelationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input CommentPostConnectionSort {
              node: PostSort
            }

            input CommentPostConnectionWhere {
              AND: [CommentPostConnectionWhere!]
              NOT: CommentPostConnectionWhere
              OR: [CommentPostConnectionWhere!]
              node: PostWhere
              node_NOT: PostWhere @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
            }

            input CommentPostCreateFieldInput {
              node: PostCreateInput!
            }

            input CommentPostDeleteFieldInput {
              delete: PostDeleteInput
              where: CommentPostConnectionWhere
            }

            input CommentPostDisconnectFieldInput {
              disconnect: PostDisconnectInput
              where: CommentPostConnectionWhere
            }

            input CommentPostFieldInput {
              connect: CommentPostConnectFieldInput
              create: CommentPostCreateFieldInput
            }

            input CommentPostNodeAggregationWhereInput {
              AND: [CommentPostNodeAggregationWhereInput!]
              NOT: CommentPostNodeAggregationWhereInput
              OR: [CommentPostNodeAggregationWhereInput!]
              content_AVERAGE_EQUAL: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              content_AVERAGE_GT: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              content_AVERAGE_GTE: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              content_AVERAGE_LENGTH_EQUAL: Float
              content_AVERAGE_LENGTH_GT: Float
              content_AVERAGE_LENGTH_GTE: Float
              content_AVERAGE_LENGTH_LT: Float
              content_AVERAGE_LENGTH_LTE: Float
              content_AVERAGE_LT: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              content_AVERAGE_LTE: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              content_EQUAL: String @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              content_GT: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              content_GTE: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              content_LONGEST_EQUAL: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              content_LONGEST_GT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              content_LONGEST_GTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              content_LONGEST_LENGTH_EQUAL: Int
              content_LONGEST_LENGTH_GT: Int
              content_LONGEST_LENGTH_GTE: Int
              content_LONGEST_LENGTH_LT: Int
              content_LONGEST_LENGTH_LTE: Int
              content_LONGEST_LT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              content_LONGEST_LTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              content_LT: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              content_LTE: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              content_SHORTEST_EQUAL: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              content_SHORTEST_GT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              content_SHORTEST_GTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              content_SHORTEST_LENGTH_EQUAL: Int
              content_SHORTEST_LENGTH_GT: Int
              content_SHORTEST_LENGTH_GTE: Int
              content_SHORTEST_LENGTH_LT: Int
              content_SHORTEST_LENGTH_LTE: Int
              content_SHORTEST_LT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              content_SHORTEST_LTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              id_EQUAL: ID @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
            }

            type CommentPostPostAggregationSelection {
              count: Int!
              node: CommentPostPostNodeAggregateSelection
            }

            type CommentPostPostNodeAggregateSelection {
              content: StringAggregateSelectionNullable!
              id: IDAggregateSelectionNullable!
            }

            type CommentPostRelationship {
              cursor: String!
              node: Post!
            }

            input CommentPostUpdateConnectionInput {
              node: PostUpdateInput
            }

            input CommentPostUpdateFieldInput {
              connect: CommentPostConnectFieldInput
              create: CommentPostCreateFieldInput
              delete: CommentPostDeleteFieldInput
              disconnect: CommentPostDisconnectFieldInput
              update: CommentPostUpdateConnectionInput
              where: CommentPostConnectionWhere
            }

            input CommentRelationInput {
              creator: ContentCreatorCreateFieldInput
              post: CommentPostCreateFieldInput
            }

            \\"\\"\\"
            Fields to sort Comments by. The order in which sorts are applied is not guaranteed when specifying many fields in one CommentSort object.
            \\"\\"\\"
            input CommentSort {
              content: SortDirection
              id: SortDirection
            }

            input CommentUpdateInput {
              content: String
              creator: ContentCreatorUpdateFieldInput
              id: ID
              post: CommentPostUpdateFieldInput
            }

            type CommentUserCreatorAggregationSelection {
              count: Int!
              node: CommentUserCreatorNodeAggregateSelection
            }

            type CommentUserCreatorNodeAggregateSelection {
              id: IDAggregateSelectionNullable!
              name: StringAggregateSelectionNullable!
            }

            input CommentWhere {
              AND: [CommentWhere!]
              NOT: CommentWhere
              OR: [CommentWhere!]
              content: String
              content_CONTAINS: String
              content_ENDS_WITH: String
              content_IN: [String]
              content_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              content_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              content_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              content_NOT_IN: [String] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              content_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              content_STARTS_WITH: String
              creator: UserWhere
              creatorAggregate: CommentCreatorAggregateInput
              creatorConnection: ContentCreatorConnectionWhere
              creatorConnection_NOT: ContentCreatorConnectionWhere
              creator_NOT: UserWhere
              id: ID
              id_CONTAINS: ID
              id_ENDS_WITH: ID
              id_IN: [ID]
              id_NOT: ID @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              id_NOT_CONTAINS: ID @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              id_NOT_ENDS_WITH: ID @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              id_NOT_IN: [ID] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              id_NOT_STARTS_WITH: ID @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              id_STARTS_WITH: ID
              post: PostWhere
              postAggregate: CommentPostAggregateInput
              postConnection: CommentPostConnectionWhere
              postConnection_NOT: CommentPostConnectionWhere
              post_NOT: PostWhere
            }

            type CommentsConnection {
              edges: [CommentEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            interface Content {
              content: String
              creator(directed: Boolean = true, options: UserOptions, where: UserWhere): User!
              creatorConnection(after: String, directed: Boolean = true, first: Int, sort: [ContentCreatorConnectionSort!], where: ContentCreatorConnectionWhere): ContentCreatorConnection!
              id: ID
            }

            input ContentConnectInput {
              _on: ContentImplementationsConnectInput
              creator: ContentCreatorConnectFieldInput
            }

            input ContentConnectWhere {
              node: ContentWhere!
            }

            input ContentCreateInput {
              Comment: CommentCreateInput
              Post: PostCreateInput
            }

            input ContentCreatorAggregateInput {
              AND: [ContentCreatorAggregateInput!]
              NOT: ContentCreatorAggregateInput
              OR: [ContentCreatorAggregateInput!]
              count: Int
              count_GT: Int
              count_GTE: Int
              count_LT: Int
              count_LTE: Int
              node: ContentCreatorNodeAggregationWhereInput
            }

            input ContentCreatorConnectFieldInput {
              connect: UserConnectInput
              \\"\\"\\"
              Whether or not to overwrite any matching relationship with the new properties. Will default to \`false\` in 4.0.0.
              \\"\\"\\"
              overwrite: Boolean! = true
              where: UserConnectWhere
            }

            type ContentCreatorConnection {
              edges: [ContentCreatorRelationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input ContentCreatorConnectionSort {
              node: UserSort
            }

            input ContentCreatorConnectionWhere {
              AND: [ContentCreatorConnectionWhere!]
              NOT: ContentCreatorConnectionWhere
              OR: [ContentCreatorConnectionWhere!]
              node: UserWhere
              node_NOT: UserWhere @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
            }

            input ContentCreatorCreateFieldInput {
              node: UserCreateInput!
            }

            input ContentCreatorDeleteFieldInput {
              delete: UserDeleteInput
              where: ContentCreatorConnectionWhere
            }

            input ContentCreatorDisconnectFieldInput {
              disconnect: UserDisconnectInput
              where: ContentCreatorConnectionWhere
            }

            input ContentCreatorFieldInput {
              connect: ContentCreatorConnectFieldInput
              create: ContentCreatorCreateFieldInput
            }

            input ContentCreatorNodeAggregationWhereInput {
              AND: [ContentCreatorNodeAggregationWhereInput!]
              NOT: ContentCreatorNodeAggregationWhereInput
              OR: [ContentCreatorNodeAggregationWhereInput!]
              id_EQUAL: ID @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              name_AVERAGE_EQUAL: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              name_AVERAGE_GT: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              name_AVERAGE_GTE: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              name_AVERAGE_LENGTH_EQUAL: Float
              name_AVERAGE_LENGTH_GT: Float
              name_AVERAGE_LENGTH_GTE: Float
              name_AVERAGE_LENGTH_LT: Float
              name_AVERAGE_LENGTH_LTE: Float
              name_AVERAGE_LT: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              name_AVERAGE_LTE: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              name_EQUAL: String @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              name_GT: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              name_GTE: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              name_LONGEST_EQUAL: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              name_LONGEST_GT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              name_LONGEST_GTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              name_LONGEST_LENGTH_EQUAL: Int
              name_LONGEST_LENGTH_GT: Int
              name_LONGEST_LENGTH_GTE: Int
              name_LONGEST_LENGTH_LT: Int
              name_LONGEST_LENGTH_LTE: Int
              name_LONGEST_LT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              name_LONGEST_LTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              name_LT: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              name_LTE: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              name_SHORTEST_EQUAL: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              name_SHORTEST_GT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              name_SHORTEST_GTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              name_SHORTEST_LENGTH_EQUAL: Int
              name_SHORTEST_LENGTH_GT: Int
              name_SHORTEST_LENGTH_GTE: Int
              name_SHORTEST_LENGTH_LT: Int
              name_SHORTEST_LENGTH_LTE: Int
              name_SHORTEST_LT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              name_SHORTEST_LTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
            }

            type ContentCreatorRelationship {
              cursor: String!
              node: User!
            }

            input ContentCreatorUpdateConnectionInput {
              node: UserUpdateInput
            }

            input ContentCreatorUpdateFieldInput {
              connect: ContentCreatorConnectFieldInput
              create: ContentCreatorCreateFieldInput
              delete: ContentCreatorDeleteFieldInput
              disconnect: ContentCreatorDisconnectFieldInput
              update: ContentCreatorUpdateConnectionInput
              where: ContentCreatorConnectionWhere
            }

            input ContentDeleteInput {
              _on: ContentImplementationsDeleteInput
              creator: ContentCreatorDeleteFieldInput
            }

            input ContentDisconnectInput {
              _on: ContentImplementationsDisconnectInput
              creator: ContentCreatorDisconnectFieldInput
            }

            input ContentImplementationsConnectInput {
              Comment: [CommentConnectInput!]
              Post: [PostConnectInput!]
            }

            input ContentImplementationsDeleteInput {
              Comment: [CommentDeleteInput!]
              Post: [PostDeleteInput!]
            }

            input ContentImplementationsDisconnectInput {
              Comment: [CommentDisconnectInput!]
              Post: [PostDisconnectInput!]
            }

            input ContentImplementationsUpdateInput {
              Comment: CommentUpdateInput
              Post: PostUpdateInput
            }

            input ContentImplementationsWhere {
              Comment: CommentWhere
              Post: PostWhere
            }

            input ContentOptions {
              limit: Int
              offset: Int
              \\"\\"\\"
              Specify one or more ContentSort objects to sort Contents by. The sorts will be applied in the order in which they are arranged in the array.
              \\"\\"\\"
              sort: [ContentSort]
            }

            \\"\\"\\"
            Fields to sort Contents by. The order in which sorts are applied is not guaranteed when specifying many fields in one ContentSort object.
            \\"\\"\\"
            input ContentSort {
              content: SortDirection
              id: SortDirection
            }

            input ContentUpdateInput {
              _on: ContentImplementationsUpdateInput
              content: String
              creator: ContentCreatorUpdateFieldInput
              id: ID
            }

            input ContentWhere {
              _on: ContentImplementationsWhere
              content: String
              content_CONTAINS: String
              content_ENDS_WITH: String
              content_IN: [String]
              content_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              content_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              content_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              content_NOT_IN: [String] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              content_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              content_STARTS_WITH: String
              creator: UserWhere
              creatorAggregate: ContentCreatorAggregateInput
              creatorConnection: ContentCreatorConnectionWhere
              creatorConnection_NOT: ContentCreatorConnectionWhere
              creator_NOT: UserWhere
              id: ID
              id_CONTAINS: ID
              id_ENDS_WITH: ID
              id_IN: [ID]
              id_NOT: ID @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              id_NOT_CONTAINS: ID @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              id_NOT_ENDS_WITH: ID @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              id_NOT_IN: [ID] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              id_NOT_STARTS_WITH: ID @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              id_STARTS_WITH: ID
            }

            type CreateCommentsMutationResponse {
              comments: [Comment!]!
              info: CreateInfo!
            }

            type CreateInfo {
              bookmark: String @deprecated(reason: \\"This field has been deprecated because bookmarks are now handled by the driver.\\")
              nodesCreated: Int!
              relationshipsCreated: Int!
            }

            type CreatePostsMutationResponse {
              info: CreateInfo!
              posts: [Post!]!
            }

            type CreateUsersMutationResponse {
              info: CreateInfo!
              users: [User!]!
            }

            type DeleteInfo {
              bookmark: String @deprecated(reason: \\"This field has been deprecated because bookmarks are now handled by the driver.\\")
              nodesDeleted: Int!
              relationshipsDeleted: Int!
            }

            type IDAggregateSelectionNullable {
              longest: ID
              shortest: ID
            }

            type Mutation {
              createComments(input: [CommentCreateInput!]!): CreateCommentsMutationResponse!
              createPosts(input: [PostCreateInput!]!): CreatePostsMutationResponse!
              createUsers(input: [UserCreateInput!]!): CreateUsersMutationResponse!
              deleteComments(delete: CommentDeleteInput, where: CommentWhere): DeleteInfo!
              deletePosts(delete: PostDeleteInput, where: PostWhere): DeleteInfo!
              deleteUsers(delete: UserDeleteInput, where: UserWhere): DeleteInfo!
              updateComments(connect: CommentConnectInput, create: CommentRelationInput, delete: CommentDeleteInput, disconnect: CommentDisconnectInput, update: CommentUpdateInput, where: CommentWhere): UpdateCommentsMutationResponse!
              updatePosts(connect: PostConnectInput, create: PostRelationInput, delete: PostDeleteInput, disconnect: PostDisconnectInput, update: PostUpdateInput, where: PostWhere): UpdatePostsMutationResponse!
              updateUsers(connect: UserConnectInput, create: UserRelationInput, delete: UserDeleteInput, disconnect: UserDisconnectInput, update: UserUpdateInput, where: UserWhere): UpdateUsersMutationResponse!
            }

            \\"\\"\\"Pagination information (Relay)\\"\\"\\"
            type PageInfo {
              endCursor: String
              hasNextPage: Boolean!
              hasPreviousPage: Boolean!
              startCursor: String
            }

            type Post implements Content {
              comments(directed: Boolean = true, options: CommentOptions, where: CommentWhere): [Comment!]!
              commentsAggregate(directed: Boolean = true, where: CommentWhere): PostCommentCommentsAggregationSelection
              commentsConnection(after: String, directed: Boolean = true, first: Int, sort: [PostCommentsConnectionSort!], where: PostCommentsConnectionWhere): PostCommentsConnection!
              content: String
              creator(directed: Boolean = true, options: UserOptions, where: UserWhere): User!
              creatorAggregate(directed: Boolean = true, where: UserWhere): PostUserCreatorAggregationSelection
              creatorConnection(after: String, directed: Boolean = true, first: Int, sort: [ContentCreatorConnectionSort!], where: ContentCreatorConnectionWhere): ContentCreatorConnection!
              id: ID
            }

            type PostAggregateSelection {
              content: StringAggregateSelectionNullable!
              count: Int!
              id: IDAggregateSelectionNullable!
            }

            type PostCommentCommentsAggregationSelection {
              count: Int!
              node: PostCommentCommentsNodeAggregateSelection
            }

            type PostCommentCommentsNodeAggregateSelection {
              content: StringAggregateSelectionNullable!
              id: IDAggregateSelectionNullable!
            }

            input PostCommentsAggregateInput {
              AND: [PostCommentsAggregateInput!]
              NOT: PostCommentsAggregateInput
              OR: [PostCommentsAggregateInput!]
              count: Int
              count_GT: Int
              count_GTE: Int
              count_LT: Int
              count_LTE: Int
              node: PostCommentsNodeAggregationWhereInput
            }

            input PostCommentsConnectFieldInput {
              connect: [CommentConnectInput!]
              \\"\\"\\"
              Whether or not to overwrite any matching relationship with the new properties. Will default to \`false\` in 4.0.0.
              \\"\\"\\"
              overwrite: Boolean! = true
              where: CommentConnectWhere
            }

            type PostCommentsConnection {
              edges: [PostCommentsRelationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input PostCommentsConnectionSort {
              node: CommentSort
            }

            input PostCommentsConnectionWhere {
              AND: [PostCommentsConnectionWhere!]
              NOT: PostCommentsConnectionWhere
              OR: [PostCommentsConnectionWhere!]
              node: CommentWhere
              node_NOT: CommentWhere @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
            }

            input PostCommentsCreateFieldInput {
              node: CommentCreateInput!
            }

            input PostCommentsDeleteFieldInput {
              delete: CommentDeleteInput
              where: PostCommentsConnectionWhere
            }

            input PostCommentsDisconnectFieldInput {
              disconnect: CommentDisconnectInput
              where: PostCommentsConnectionWhere
            }

            input PostCommentsFieldInput {
              connect: [PostCommentsConnectFieldInput!]
              create: [PostCommentsCreateFieldInput!]
            }

            input PostCommentsNodeAggregationWhereInput {
              AND: [PostCommentsNodeAggregationWhereInput!]
              NOT: PostCommentsNodeAggregationWhereInput
              OR: [PostCommentsNodeAggregationWhereInput!]
              content_AVERAGE_EQUAL: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              content_AVERAGE_GT: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              content_AVERAGE_GTE: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              content_AVERAGE_LENGTH_EQUAL: Float
              content_AVERAGE_LENGTH_GT: Float
              content_AVERAGE_LENGTH_GTE: Float
              content_AVERAGE_LENGTH_LT: Float
              content_AVERAGE_LENGTH_LTE: Float
              content_AVERAGE_LT: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              content_AVERAGE_LTE: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              content_EQUAL: String @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              content_GT: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              content_GTE: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              content_LONGEST_EQUAL: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              content_LONGEST_GT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              content_LONGEST_GTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              content_LONGEST_LENGTH_EQUAL: Int
              content_LONGEST_LENGTH_GT: Int
              content_LONGEST_LENGTH_GTE: Int
              content_LONGEST_LENGTH_LT: Int
              content_LONGEST_LENGTH_LTE: Int
              content_LONGEST_LT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              content_LONGEST_LTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              content_LT: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              content_LTE: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              content_SHORTEST_EQUAL: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              content_SHORTEST_GT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              content_SHORTEST_GTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              content_SHORTEST_LENGTH_EQUAL: Int
              content_SHORTEST_LENGTH_GT: Int
              content_SHORTEST_LENGTH_GTE: Int
              content_SHORTEST_LENGTH_LT: Int
              content_SHORTEST_LENGTH_LTE: Int
              content_SHORTEST_LT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              content_SHORTEST_LTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              id_EQUAL: ID @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
            }

            type PostCommentsRelationship {
              cursor: String!
              node: Comment!
            }

            input PostCommentsUpdateConnectionInput {
              node: CommentUpdateInput
            }

            input PostCommentsUpdateFieldInput {
              connect: [PostCommentsConnectFieldInput!]
              create: [PostCommentsCreateFieldInput!]
              delete: [PostCommentsDeleteFieldInput!]
              disconnect: [PostCommentsDisconnectFieldInput!]
              update: PostCommentsUpdateConnectionInput
              where: PostCommentsConnectionWhere
            }

            input PostConnectInput {
              comments: [PostCommentsConnectFieldInput!]
              creator: ContentCreatorConnectFieldInput
            }

            input PostConnectWhere {
              node: PostWhere!
            }

            input PostCreateInput {
              comments: PostCommentsFieldInput
              content: String
              creator: ContentCreatorFieldInput
              id: ID
            }

            input PostCreatorAggregateInput {
              AND: [PostCreatorAggregateInput!]
              NOT: PostCreatorAggregateInput
              OR: [PostCreatorAggregateInput!]
              count: Int
              count_GT: Int
              count_GTE: Int
              count_LT: Int
              count_LTE: Int
              node: PostCreatorNodeAggregationWhereInput
            }

            input PostCreatorNodeAggregationWhereInput {
              AND: [PostCreatorNodeAggregationWhereInput!]
              NOT: PostCreatorNodeAggregationWhereInput
              OR: [PostCreatorNodeAggregationWhereInput!]
              id_EQUAL: ID @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              name_AVERAGE_EQUAL: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              name_AVERAGE_GT: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              name_AVERAGE_GTE: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              name_AVERAGE_LENGTH_EQUAL: Float
              name_AVERAGE_LENGTH_GT: Float
              name_AVERAGE_LENGTH_GTE: Float
              name_AVERAGE_LENGTH_LT: Float
              name_AVERAGE_LENGTH_LTE: Float
              name_AVERAGE_LT: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              name_AVERAGE_LTE: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              name_EQUAL: String @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              name_GT: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              name_GTE: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              name_LONGEST_EQUAL: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              name_LONGEST_GT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              name_LONGEST_GTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              name_LONGEST_LENGTH_EQUAL: Int
              name_LONGEST_LENGTH_GT: Int
              name_LONGEST_LENGTH_GTE: Int
              name_LONGEST_LENGTH_LT: Int
              name_LONGEST_LENGTH_LTE: Int
              name_LONGEST_LT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              name_LONGEST_LTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              name_LT: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              name_LTE: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              name_SHORTEST_EQUAL: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              name_SHORTEST_GT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              name_SHORTEST_GTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              name_SHORTEST_LENGTH_EQUAL: Int
              name_SHORTEST_LENGTH_GT: Int
              name_SHORTEST_LENGTH_GTE: Int
              name_SHORTEST_LENGTH_LT: Int
              name_SHORTEST_LENGTH_LTE: Int
              name_SHORTEST_LT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              name_SHORTEST_LTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
            }

            input PostDeleteInput {
              comments: [PostCommentsDeleteFieldInput!]
              creator: ContentCreatorDeleteFieldInput
            }

            input PostDisconnectInput {
              comments: [PostCommentsDisconnectFieldInput!]
              creator: ContentCreatorDisconnectFieldInput
            }

            type PostEdge {
              cursor: String!
              node: Post!
            }

            input PostOptions {
              limit: Int
              offset: Int
              \\"\\"\\"
              Specify one or more PostSort objects to sort Posts by. The sorts will be applied in the order in which they are arranged in the array.
              \\"\\"\\"
              sort: [PostSort!]
            }

            input PostRelationInput {
              comments: [PostCommentsCreateFieldInput!]
              creator: ContentCreatorCreateFieldInput
            }

            \\"\\"\\"
            Fields to sort Posts by. The order in which sorts are applied is not guaranteed when specifying many fields in one PostSort object.
            \\"\\"\\"
            input PostSort {
              content: SortDirection
              id: SortDirection
            }

            input PostUpdateInput {
              comments: [PostCommentsUpdateFieldInput!]
              content: String
              creator: ContentCreatorUpdateFieldInput
              id: ID
            }

            type PostUserCreatorAggregationSelection {
              count: Int!
              node: PostUserCreatorNodeAggregateSelection
            }

            type PostUserCreatorNodeAggregateSelection {
              id: IDAggregateSelectionNullable!
              name: StringAggregateSelectionNullable!
            }

            input PostWhere {
              AND: [PostWhere!]
              NOT: PostWhere
              OR: [PostWhere!]
              comments: CommentWhere @deprecated(reason: \\"Use \`comments_SOME\` instead.\\")
              commentsAggregate: PostCommentsAggregateInput
              commentsConnection: PostCommentsConnectionWhere @deprecated(reason: \\"Use \`commentsConnection_SOME\` instead.\\")
              \\"\\"\\"
              Return Posts where all of the related PostCommentsConnections match this filter
              \\"\\"\\"
              commentsConnection_ALL: PostCommentsConnectionWhere
              \\"\\"\\"
              Return Posts where none of the related PostCommentsConnections match this filter
              \\"\\"\\"
              commentsConnection_NONE: PostCommentsConnectionWhere
              commentsConnection_NOT: PostCommentsConnectionWhere @deprecated(reason: \\"Use \`commentsConnection_NONE\` instead.\\")
              \\"\\"\\"
              Return Posts where one of the related PostCommentsConnections match this filter
              \\"\\"\\"
              commentsConnection_SINGLE: PostCommentsConnectionWhere
              \\"\\"\\"
              Return Posts where some of the related PostCommentsConnections match this filter
              \\"\\"\\"
              commentsConnection_SOME: PostCommentsConnectionWhere
              \\"\\"\\"Return Posts where all of the related Comments match this filter\\"\\"\\"
              comments_ALL: CommentWhere
              \\"\\"\\"Return Posts where none of the related Comments match this filter\\"\\"\\"
              comments_NONE: CommentWhere
              comments_NOT: CommentWhere @deprecated(reason: \\"Use \`comments_NONE\` instead.\\")
              \\"\\"\\"Return Posts where one of the related Comments match this filter\\"\\"\\"
              comments_SINGLE: CommentWhere
              \\"\\"\\"Return Posts where some of the related Comments match this filter\\"\\"\\"
              comments_SOME: CommentWhere
              content: String
              content_CONTAINS: String
              content_ENDS_WITH: String
              content_IN: [String]
              content_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              content_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              content_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              content_NOT_IN: [String] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              content_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              content_STARTS_WITH: String
              creator: UserWhere
              creatorAggregate: PostCreatorAggregateInput
              creatorConnection: ContentCreatorConnectionWhere
              creatorConnection_NOT: ContentCreatorConnectionWhere
              creator_NOT: UserWhere
              id: ID
              id_CONTAINS: ID
              id_ENDS_WITH: ID
              id_IN: [ID]
              id_NOT: ID @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              id_NOT_CONTAINS: ID @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              id_NOT_ENDS_WITH: ID @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              id_NOT_IN: [ID] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              id_NOT_STARTS_WITH: ID @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              id_STARTS_WITH: ID
            }

            type PostsConnection {
              edges: [PostEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            type Query {
              comments(options: CommentOptions, where: CommentWhere): [Comment!]!
              commentsAggregate(where: CommentWhere): CommentAggregateSelection!
              commentsConnection(after: String, first: Int, sort: [CommentSort], where: CommentWhere): CommentsConnection!
              posts(options: PostOptions, where: PostWhere): [Post!]!
              postsAggregate(where: PostWhere): PostAggregateSelection!
              postsConnection(after: String, first: Int, sort: [PostSort], where: PostWhere): PostsConnection!
              users(options: UserOptions, where: UserWhere): [User!]!
              usersAggregate(where: UserWhere): UserAggregateSelection!
              usersConnection(after: String, first: Int, sort: [UserSort], where: UserWhere): UsersConnection!
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

            type UpdateCommentsMutationResponse {
              comments: [Comment!]!
              info: UpdateInfo!
            }

            type UpdateInfo {
              bookmark: String @deprecated(reason: \\"This field has been deprecated because bookmarks are now handled by the driver.\\")
              nodesCreated: Int!
              nodesDeleted: Int!
              relationshipsCreated: Int!
              relationshipsDeleted: Int!
            }

            type UpdatePostsMutationResponse {
              info: UpdateInfo!
              posts: [Post!]!
            }

            type UpdateUsersMutationResponse {
              info: UpdateInfo!
              users: [User!]!
            }

            type User {
              content(directed: Boolean = true, options: ContentOptions, where: ContentWhere): [Content!]!
              contentConnection(after: String, directed: Boolean = true, first: Int, sort: [UserContentConnectionSort!], where: UserContentConnectionWhere): UserContentConnection!
              id: ID
              name: String
            }

            type UserAggregateSelection {
              count: Int!
              id: IDAggregateSelectionNullable!
              name: StringAggregateSelectionNullable!
            }

            input UserConnectInput {
              content: [UserContentConnectFieldInput!]
            }

            input UserConnectWhere {
              node: UserWhere!
            }

            input UserContentConnectFieldInput {
              connect: ContentConnectInput
              where: ContentConnectWhere
            }

            type UserContentConnection {
              edges: [UserContentRelationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input UserContentConnectionSort {
              node: ContentSort
            }

            input UserContentConnectionWhere {
              AND: [UserContentConnectionWhere!]
              NOT: UserContentConnectionWhere
              OR: [UserContentConnectionWhere!]
              node: ContentWhere
              node_NOT: ContentWhere @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
            }

            input UserContentCreateFieldInput {
              node: ContentCreateInput!
            }

            input UserContentDeleteFieldInput {
              delete: ContentDeleteInput
              where: UserContentConnectionWhere
            }

            input UserContentDisconnectFieldInput {
              disconnect: ContentDisconnectInput
              where: UserContentConnectionWhere
            }

            input UserContentFieldInput {
              connect: [UserContentConnectFieldInput!]
              create: [UserContentCreateFieldInput!]
            }

            type UserContentRelationship {
              cursor: String!
              node: Content!
            }

            input UserContentUpdateConnectionInput {
              node: ContentUpdateInput
            }

            input UserContentUpdateFieldInput {
              connect: [UserContentConnectFieldInput!]
              create: [UserContentCreateFieldInput!]
              delete: [UserContentDeleteFieldInput!]
              disconnect: [UserContentDisconnectFieldInput!]
              update: UserContentUpdateConnectionInput
              where: UserContentConnectionWhere
            }

            input UserCreateInput {
              content: UserContentFieldInput
              id: ID
              name: String
            }

            input UserDeleteInput {
              content: [UserContentDeleteFieldInput!]
            }

            input UserDisconnectInput {
              content: [UserContentDisconnectFieldInput!]
            }

            type UserEdge {
              cursor: String!
              node: User!
            }

            input UserOptions {
              limit: Int
              offset: Int
              \\"\\"\\"
              Specify one or more UserSort objects to sort Users by. The sorts will be applied in the order in which they are arranged in the array.
              \\"\\"\\"
              sort: [UserSort!]
            }

            input UserRelationInput {
              content: [UserContentCreateFieldInput!]
            }

            \\"\\"\\"
            Fields to sort Users by. The order in which sorts are applied is not guaranteed when specifying many fields in one UserSort object.
            \\"\\"\\"
            input UserSort {
              id: SortDirection
              name: SortDirection
            }

            input UserUpdateInput {
              content: [UserContentUpdateFieldInput!]
              id: ID
              name: String
            }

            input UserWhere {
              AND: [UserWhere!]
              NOT: UserWhere
              OR: [UserWhere!]
              contentConnection: UserContentConnectionWhere @deprecated(reason: \\"Use \`contentConnection_SOME\` instead.\\")
              \\"\\"\\"
              Return Users where all of the related UserContentConnections match this filter
              \\"\\"\\"
              contentConnection_ALL: UserContentConnectionWhere
              \\"\\"\\"
              Return Users where none of the related UserContentConnections match this filter
              \\"\\"\\"
              contentConnection_NONE: UserContentConnectionWhere
              contentConnection_NOT: UserContentConnectionWhere @deprecated(reason: \\"Use \`contentConnection_NONE\` instead.\\")
              \\"\\"\\"
              Return Users where one of the related UserContentConnections match this filter
              \\"\\"\\"
              contentConnection_SINGLE: UserContentConnectionWhere
              \\"\\"\\"
              Return Users where some of the related UserContentConnections match this filter
              \\"\\"\\"
              contentConnection_SOME: UserContentConnectionWhere
              id: ID
              id_CONTAINS: ID
              id_ENDS_WITH: ID
              id_IN: [ID]
              id_NOT: ID @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              id_NOT_CONTAINS: ID @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              id_NOT_ENDS_WITH: ID @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              id_NOT_IN: [ID] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              id_NOT_STARTS_WITH: ID @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              id_STARTS_WITH: ID
              name: String
              name_CONTAINS: String
              name_ENDS_WITH: String
              name_IN: [String]
              name_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              name_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              name_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              name_NOT_IN: [String] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              name_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              name_STARTS_WITH: String
            }

            type UsersConnection {
              edges: [UserEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }"
        `);
    });
});
