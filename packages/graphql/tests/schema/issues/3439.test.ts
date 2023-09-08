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
import { TestSubscriptionsEngine } from "../../utils/TestSubscriptionsEngine";
import { validateSchema } from "graphql";

describe("https://github.com/neo4j/graphql/issues/3439", () => {
    test("Type definitions implementing multiple interfaces", async () => {
        const typeDefs = gql`
            interface INode {
                id: String!
            }

            interface IProduct implements INode {
                id: String!

                name: String!
                genre: Genre!
            }

            type Movie implements INode & IProduct {
                id: String!

                name: String!
                genre: Genre! @relationship(type: "HAS_GENRE", direction: OUT)
            }

            type Series implements INode & IProduct {
                id: String!

                name: String!
                genre: Genre! @relationship(type: "HAS_GENRE", direction: OUT)
            }

            type Genre {
                name: String! @unique
                product: [IProduct!]! @relationship(type: "HAS_GENRE", direction: IN)
            }
        `;

        const subscriptionsEngine = new TestSubscriptionsEngine();
        const neoSchema = new Neo4jGraphQL({ typeDefs, features: { subscriptions: subscriptionsEngine } });

        const schema = await neoSchema.getSchema();
        const errors = validateSchema(schema);
        expect(errors).toHaveLength(0);

        const printedSchema = printSchemaWithDirectives(lexicographicSortSchema(await neoSchema.getSchema()));

        expect(printedSchema).toMatchInlineSnapshot(`
            "schema {
              query: Query
              mutation: Mutation
              subscription: Subscription
            }

            type CreateGenresMutationResponse {
              genres: [Genre!]!
              info: CreateInfo!
            }

            \\"\\"\\"CreateInfo\\"\\"\\"
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

            \\"\\"\\"DeleteInfo\\"\\"\\"
            type DeleteInfo {
              bookmark: String @deprecated(reason: \\"This field has been deprecated because bookmarks are now handled by the driver.\\")
              nodesDeleted: Int!
              relationshipsDeleted: Int!
            }

            enum EventType {
              CREATE
              CREATE_RELATIONSHIP
              DELETE
              DELETE_RELATIONSHIP
              UPDATE
            }

            \\"\\"\\"\\"\\"\\"
            type Genre {
              \\"\\"\\"\\"\\"\\"
              name: String!
              \\"\\"\\"\\"\\"\\"
              product(directed: Boolean = true, options: IProductOptions, where: IProductWhere): [IProduct!]!
              productConnection(after: String, directed: Boolean = true, first: Int, sort: [GenreProductConnectionSort!], where: GenreProductConnectionWhere): GenreProductConnection!
            }

            type GenreAggregateSelection {
              count: Int!
              name: StringAggregateSelectionNonNullable!
            }

            input GenreConnectInput {
              product: [GenreProductConnectFieldInput!]
            }

            input GenreConnectOrCreateWhere {
              node: GenreUniqueWhere!
            }

            input GenreConnectWhere {
              node: GenreWhere!
            }

            type GenreConnectedRelationships {
              product: GenreProductConnectedRelationship
            }

            input GenreCreateInput {
              name: String!
              product: GenreProductFieldInput
            }

            type GenreCreatedEvent {
              createdGenre: GenreEventPayload!
              event: EventType!
              timestamp: Float!
            }

            input GenreDeleteInput {
              product: [GenreProductDeleteFieldInput!]
            }

            type GenreDeletedEvent {
              deletedGenre: GenreEventPayload!
              event: EventType!
              timestamp: Float!
            }

            input GenreDisconnectInput {
              product: [GenreProductDisconnectFieldInput!]
            }

            type GenreEdge {
              cursor: String!
              node: Genre!
            }

            type GenreEventPayload {
              name: String!
            }

            input GenreOnCreateInput {
              name: String!
            }

            input GenreOptions {
              limit: Int
              offset: Int
              \\"\\"\\"
              Specify one or more GenreSort objects to sort Genres by. The sorts will be applied in the order in which they are arranged in the array.
              \\"\\"\\"
              sort: [GenreSort!]
            }

            input GenreProductConnectFieldInput {
              connect: IProductConnectInput
              where: IProductConnectWhere
            }

            type GenreProductConnectedRelationship {
              node: IProductEventPayload!
            }

            type GenreProductConnection {
              edges: [GenreProductRelationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input GenreProductConnectionSort {
              node: IProductSort
            }

            input GenreProductConnectionWhere {
              AND: [GenreProductConnectionWhere!]
              NOT: GenreProductConnectionWhere
              OR: [GenreProductConnectionWhere!]
              node: IProductWhere
              node_NOT: IProductWhere @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
            }

            input GenreProductCreateFieldInput {
              node: IProductCreateInput!
            }

            input GenreProductDeleteFieldInput {
              delete: IProductDeleteInput
              where: GenreProductConnectionWhere
            }

            input GenreProductDisconnectFieldInput {
              disconnect: IProductDisconnectInput
              where: GenreProductConnectionWhere
            }

            input GenreProductFieldInput {
              connect: [GenreProductConnectFieldInput!]
              create: [GenreProductCreateFieldInput!]
            }

            type GenreProductRelationship {
              cursor: String!
              node: IProduct!
            }

            input GenreProductRelationshipSubscriptionWhere {
              node: IProductSubscriptionWhere
            }

            input GenreProductUpdateConnectionInput {
              node: IProductUpdateInput
            }

            input GenreProductUpdateFieldInput {
              connect: [GenreProductConnectFieldInput!]
              create: [GenreProductCreateFieldInput!]
              delete: [GenreProductDeleteFieldInput!]
              disconnect: [GenreProductDisconnectFieldInput!]
              update: GenreProductUpdateConnectionInput
              where: GenreProductConnectionWhere
            }

            input GenreRelationInput {
              product: [GenreProductCreateFieldInput!]
            }

            type GenreRelationshipCreatedEvent {
              createdRelationship: GenreConnectedRelationships!
              event: EventType!
              genre: GenreEventPayload!
              relationshipFieldName: String!
              timestamp: Float!
            }

            input GenreRelationshipCreatedSubscriptionWhere {
              AND: [GenreRelationshipCreatedSubscriptionWhere!]
              NOT: GenreRelationshipCreatedSubscriptionWhere
              OR: [GenreRelationshipCreatedSubscriptionWhere!]
              createdRelationship: GenreRelationshipsSubscriptionWhere
              genre: GenreSubscriptionWhere
            }

            type GenreRelationshipDeletedEvent {
              deletedRelationship: GenreConnectedRelationships!
              event: EventType!
              genre: GenreEventPayload!
              relationshipFieldName: String!
              timestamp: Float!
            }

            input GenreRelationshipDeletedSubscriptionWhere {
              AND: [GenreRelationshipDeletedSubscriptionWhere!]
              NOT: GenreRelationshipDeletedSubscriptionWhere
              OR: [GenreRelationshipDeletedSubscriptionWhere!]
              deletedRelationship: GenreRelationshipsSubscriptionWhere
              genre: GenreSubscriptionWhere
            }

            input GenreRelationshipsSubscriptionWhere {
              product: GenreProductRelationshipSubscriptionWhere
            }

            \\"\\"\\"
            Fields to sort Genres by. The order in which sorts are applied is not guaranteed when specifying many fields in one GenreSort object.
            \\"\\"\\"
            input GenreSort {
              name: SortDirection
            }

            input GenreSubscriptionWhere {
              AND: [GenreSubscriptionWhere!]
              NOT: GenreSubscriptionWhere
              OR: [GenreSubscriptionWhere!]
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

            input GenreUniqueWhere {
              name: String
            }

            input GenreUpdateInput {
              name: String
              product: [GenreProductUpdateFieldInput!]
            }

            type GenreUpdatedEvent {
              event: EventType!
              previousState: GenreEventPayload!
              timestamp: Float!
              updatedGenre: GenreEventPayload!
            }

            input GenreWhere {
              AND: [GenreWhere!]
              NOT: GenreWhere
              OR: [GenreWhere!]
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
              productConnection: GenreProductConnectionWhere @deprecated(reason: \\"Use \`productConnection_SOME\` instead.\\")
              \\"\\"\\"
              Return Genres where all of the related GenreProductConnections match this filter
              \\"\\"\\"
              productConnection_ALL: GenreProductConnectionWhere
              \\"\\"\\"
              Return Genres where none of the related GenreProductConnections match this filter
              \\"\\"\\"
              productConnection_NONE: GenreProductConnectionWhere
              productConnection_NOT: GenreProductConnectionWhere @deprecated(reason: \\"Use \`productConnection_NONE\` instead.\\")
              \\"\\"\\"
              Return Genres where one of the related GenreProductConnections match this filter
              \\"\\"\\"
              productConnection_SINGLE: GenreProductConnectionWhere
              \\"\\"\\"
              Return Genres where some of the related GenreProductConnections match this filter
              \\"\\"\\"
              productConnection_SOME: GenreProductConnectionWhere
            }

            type GenresConnection {
              edges: [GenreEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            interface INode {
              id: String!
            }

            interface IProduct {
              genre: Genre!
              id: String!
              name: String!
            }

            input IProductConnectInput {
              _on: IProductImplementationsConnectInput
            }

            input IProductConnectWhere {
              node: IProductWhere!
            }

            input IProductCreateInput {
              Movie: MovieCreateInput
              Series: SeriesCreateInput
            }

            input IProductDeleteInput {
              _on: IProductImplementationsDeleteInput
            }

            input IProductDisconnectInput {
              _on: IProductImplementationsDisconnectInput
            }

            interface IProductEventPayload {
              id: String!
              name: String!
            }

            input IProductImplementationsConnectInput {
              Movie: [MovieConnectInput!]
              Series: [SeriesConnectInput!]
            }

            input IProductImplementationsDeleteInput {
              Movie: [MovieDeleteInput!]
              Series: [SeriesDeleteInput!]
            }

            input IProductImplementationsDisconnectInput {
              Movie: [MovieDisconnectInput!]
              Series: [SeriesDisconnectInput!]
            }

            input IProductImplementationsSubscriptionWhere {
              Movie: MovieSubscriptionWhere
              Series: SeriesSubscriptionWhere
            }

            input IProductImplementationsUpdateInput {
              Movie: MovieUpdateInput
              Series: SeriesUpdateInput
            }

            input IProductImplementationsWhere {
              Movie: MovieWhere
              Series: SeriesWhere
            }

            input IProductOptions {
              limit: Int
              offset: Int
              \\"\\"\\"
              Specify one or more IProductSort objects to sort IProducts by. The sorts will be applied in the order in which they are arranged in the array.
              \\"\\"\\"
              sort: [IProductSort]
            }

            \\"\\"\\"
            Fields to sort IProducts by. The order in which sorts are applied is not guaranteed when specifying many fields in one IProductSort object.
            \\"\\"\\"
            input IProductSort {
              id: SortDirection
              name: SortDirection
            }

            input IProductSubscriptionWhere {
              AND: [IProductSubscriptionWhere!]
              NOT: IProductSubscriptionWhere
              OR: [IProductSubscriptionWhere!]
              _on: IProductImplementationsSubscriptionWhere
              id: String
              id_CONTAINS: String
              id_ENDS_WITH: String
              id_IN: [String]
              id_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              id_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              id_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              id_NOT_IN: [String] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              id_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              id_STARTS_WITH: String
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

            input IProductUpdateInput {
              _on: IProductImplementationsUpdateInput
              id: String
              name: String
            }

            input IProductWhere {
              _on: IProductImplementationsWhere
              id: String
              id_CONTAINS: String
              id_ENDS_WITH: String
              id_IN: [String!]
              id_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              id_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              id_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              id_NOT_IN: [String!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              id_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              id_STARTS_WITH: String
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

            \\"\\"\\"\\"\\"\\"
            type Movie implements INode & IProduct {
              \\"\\"\\"\\"\\"\\"
              genre(directed: Boolean = true, options: GenreOptions, where: GenreWhere): Genre!
              genreAggregate(directed: Boolean = true, where: GenreWhere): MovieGenreGenreAggregationSelection
              genreConnection(after: String, directed: Boolean = true, first: Int, sort: [MovieGenreConnectionSort!], where: MovieGenreConnectionWhere): MovieGenreConnection!
              \\"\\"\\"\\"\\"\\"
              id: String!
              \\"\\"\\"\\"\\"\\"
              name: String!
            }

            type MovieAggregateSelection {
              count: Int!
              id: StringAggregateSelectionNonNullable!
              name: StringAggregateSelectionNonNullable!
            }

            input MovieConnectInput {
              genre: MovieGenreConnectFieldInput
            }

            input MovieConnectOrCreateInput {
              genre: MovieGenreConnectOrCreateFieldInput
            }

            type MovieConnectedRelationships {
              genre: MovieGenreConnectedRelationship
            }

            input MovieCreateInput {
              genre: MovieGenreFieldInput
              id: String!
              name: String!
            }

            type MovieCreatedEvent {
              createdMovie: MovieEventPayload!
              event: EventType!
              timestamp: Float!
            }

            input MovieDeleteInput {
              genre: MovieGenreDeleteFieldInput
            }

            type MovieDeletedEvent {
              deletedMovie: MovieEventPayload!
              event: EventType!
              timestamp: Float!
            }

            input MovieDisconnectInput {
              genre: MovieGenreDisconnectFieldInput
            }

            type MovieEdge {
              cursor: String!
              node: Movie!
            }

            type MovieEventPayload implements IProductEventPayload {
              id: String!
              name: String!
            }

            input MovieGenreAggregateInput {
              AND: [MovieGenreAggregateInput!]
              NOT: MovieGenreAggregateInput
              OR: [MovieGenreAggregateInput!]
              count: Int
              count_GT: Int
              count_GTE: Int
              count_LT: Int
              count_LTE: Int
              node: MovieGenreNodeAggregationWhereInput
            }

            input MovieGenreConnectFieldInput {
              connect: GenreConnectInput
              \\"\\"\\"
              Whether or not to overwrite any matching relationship with the new properties.
              \\"\\"\\"
              overwrite: Boolean! = true
              where: GenreConnectWhere
            }

            input MovieGenreConnectOrCreateFieldInput {
              onCreate: MovieGenreConnectOrCreateFieldInputOnCreate!
              where: GenreConnectOrCreateWhere!
            }

            input MovieGenreConnectOrCreateFieldInputOnCreate {
              node: GenreOnCreateInput!
            }

            type MovieGenreConnectedRelationship {
              node: GenreEventPayload!
            }

            type MovieGenreConnection {
              edges: [MovieGenreRelationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input MovieGenreConnectionSort {
              node: GenreSort
            }

            input MovieGenreConnectionWhere {
              AND: [MovieGenreConnectionWhere!]
              NOT: MovieGenreConnectionWhere
              OR: [MovieGenreConnectionWhere!]
              node: GenreWhere
              node_NOT: GenreWhere @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
            }

            input MovieGenreCreateFieldInput {
              node: GenreCreateInput!
            }

            input MovieGenreDeleteFieldInput {
              delete: GenreDeleteInput
              where: MovieGenreConnectionWhere
            }

            input MovieGenreDisconnectFieldInput {
              disconnect: GenreDisconnectInput
              where: MovieGenreConnectionWhere
            }

            input MovieGenreFieldInput {
              connect: MovieGenreConnectFieldInput
              connectOrCreate: MovieGenreConnectOrCreateFieldInput
              create: MovieGenreCreateFieldInput
            }

            type MovieGenreGenreAggregationSelection {
              count: Int!
              node: MovieGenreGenreNodeAggregateSelection
            }

            type MovieGenreGenreNodeAggregateSelection {
              name: StringAggregateSelectionNonNullable!
            }

            input MovieGenreNodeAggregationWhereInput {
              AND: [MovieGenreNodeAggregationWhereInput!]
              NOT: MovieGenreNodeAggregationWhereInput
              OR: [MovieGenreNodeAggregationWhereInput!]
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

            type MovieGenreRelationship {
              cursor: String!
              node: Genre!
            }

            input MovieGenreRelationshipSubscriptionWhere {
              node: GenreSubscriptionWhere
            }

            input MovieGenreUpdateConnectionInput {
              node: GenreUpdateInput
            }

            input MovieGenreUpdateFieldInput {
              connect: MovieGenreConnectFieldInput
              connectOrCreate: MovieGenreConnectOrCreateFieldInput
              create: MovieGenreCreateFieldInput
              delete: MovieGenreDeleteFieldInput
              disconnect: MovieGenreDisconnectFieldInput
              update: MovieGenreUpdateConnectionInput
              where: MovieGenreConnectionWhere
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
              genre: MovieGenreCreateFieldInput
            }

            type MovieRelationshipCreatedEvent {
              createdRelationship: MovieConnectedRelationships!
              event: EventType!
              movie: MovieEventPayload!
              relationshipFieldName: String!
              timestamp: Float!
            }

            input MovieRelationshipCreatedSubscriptionWhere {
              AND: [MovieRelationshipCreatedSubscriptionWhere!]
              NOT: MovieRelationshipCreatedSubscriptionWhere
              OR: [MovieRelationshipCreatedSubscriptionWhere!]
              createdRelationship: MovieRelationshipsSubscriptionWhere
              movie: MovieSubscriptionWhere
            }

            type MovieRelationshipDeletedEvent {
              deletedRelationship: MovieConnectedRelationships!
              event: EventType!
              movie: MovieEventPayload!
              relationshipFieldName: String!
              timestamp: Float!
            }

            input MovieRelationshipDeletedSubscriptionWhere {
              AND: [MovieRelationshipDeletedSubscriptionWhere!]
              NOT: MovieRelationshipDeletedSubscriptionWhere
              OR: [MovieRelationshipDeletedSubscriptionWhere!]
              deletedRelationship: MovieRelationshipsSubscriptionWhere
              movie: MovieSubscriptionWhere
            }

            input MovieRelationshipsSubscriptionWhere {
              genre: MovieGenreRelationshipSubscriptionWhere
            }

            \\"\\"\\"
            Fields to sort Movies by. The order in which sorts are applied is not guaranteed when specifying many fields in one MovieSort object.
            \\"\\"\\"
            input MovieSort {
              id: SortDirection
              name: SortDirection
            }

            input MovieSubscriptionWhere {
              AND: [MovieSubscriptionWhere!]
              NOT: MovieSubscriptionWhere
              OR: [MovieSubscriptionWhere!]
              id: String
              id_CONTAINS: String
              id_ENDS_WITH: String
              id_IN: [String]
              id_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              id_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              id_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              id_NOT_IN: [String] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              id_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              id_STARTS_WITH: String
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

            input MovieUpdateInput {
              genre: MovieGenreUpdateFieldInput
              id: String
              name: String
            }

            type MovieUpdatedEvent {
              event: EventType!
              previousState: MovieEventPayload!
              timestamp: Float!
              updatedMovie: MovieEventPayload!
            }

            input MovieWhere {
              AND: [MovieWhere!]
              NOT: MovieWhere
              OR: [MovieWhere!]
              genre: GenreWhere
              genreAggregate: MovieGenreAggregateInput
              genreConnection: MovieGenreConnectionWhere
              genreConnection_NOT: MovieGenreConnectionWhere
              genre_NOT: GenreWhere
              id: String
              id_CONTAINS: String
              id_ENDS_WITH: String
              id_IN: [String!]
              id_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              id_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              id_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              id_NOT_IN: [String!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              id_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              id_STARTS_WITH: String
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

            type MoviesConnection {
              edges: [MovieEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            type Mutation {
              createGenres(input: [GenreCreateInput!]!): CreateGenresMutationResponse!
              createMovies(input: [MovieCreateInput!]!): CreateMoviesMutationResponse!
              createSeries(input: [SeriesCreateInput!]!): CreateSeriesMutationResponse!
              deleteGenres(delete: GenreDeleteInput, where: GenreWhere): DeleteInfo!
              deleteMovies(delete: MovieDeleteInput, where: MovieWhere): DeleteInfo!
              deleteSeries(delete: SeriesDeleteInput, where: SeriesWhere): DeleteInfo!
              updateGenres(connect: GenreConnectInput, create: GenreRelationInput, delete: GenreDeleteInput, disconnect: GenreDisconnectInput, update: GenreUpdateInput, where: GenreWhere): UpdateGenresMutationResponse!
              updateMovies(connect: MovieConnectInput, connectOrCreate: MovieConnectOrCreateInput, create: MovieRelationInput, delete: MovieDeleteInput, disconnect: MovieDisconnectInput, update: MovieUpdateInput, where: MovieWhere): UpdateMoviesMutationResponse!
              updateSeries(connect: SeriesConnectInput, connectOrCreate: SeriesConnectOrCreateInput, create: SeriesRelationInput, delete: SeriesDeleteInput, disconnect: SeriesDisconnectInput, update: SeriesUpdateInput, where: SeriesWhere): UpdateSeriesMutationResponse!
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
              series(options: SeriesOptions, where: SeriesWhere): [Series!]!
              seriesAggregate(where: SeriesWhere): SeriesAggregateSelection!
              seriesConnection(after: String, first: Int, sort: [SeriesSort], where: SeriesWhere): SeriesConnection!
            }

            \\"\\"\\"\\"\\"\\"
            type Series implements INode & IProduct {
              \\"\\"\\"\\"\\"\\"
              genre(directed: Boolean = true, options: GenreOptions, where: GenreWhere): Genre!
              genreAggregate(directed: Boolean = true, where: GenreWhere): SeriesGenreGenreAggregationSelection
              genreConnection(after: String, directed: Boolean = true, first: Int, sort: [SeriesGenreConnectionSort!], where: SeriesGenreConnectionWhere): SeriesGenreConnection!
              \\"\\"\\"\\"\\"\\"
              id: String!
              \\"\\"\\"\\"\\"\\"
              name: String!
            }

            type SeriesAggregateSelection {
              count: Int!
              id: StringAggregateSelectionNonNullable!
              name: StringAggregateSelectionNonNullable!
            }

            input SeriesConnectInput {
              genre: SeriesGenreConnectFieldInput
            }

            input SeriesConnectOrCreateInput {
              genre: SeriesGenreConnectOrCreateFieldInput
            }

            type SeriesConnectedRelationships {
              genre: SeriesGenreConnectedRelationship
            }

            type SeriesConnection {
              edges: [SeriesEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input SeriesCreateInput {
              genre: SeriesGenreFieldInput
              id: String!
              name: String!
            }

            type SeriesCreatedEvent {
              createdSeries: SeriesEventPayload!
              event: EventType!
              timestamp: Float!
            }

            input SeriesDeleteInput {
              genre: SeriesGenreDeleteFieldInput
            }

            type SeriesDeletedEvent {
              deletedSeries: SeriesEventPayload!
              event: EventType!
              timestamp: Float!
            }

            input SeriesDisconnectInput {
              genre: SeriesGenreDisconnectFieldInput
            }

            type SeriesEdge {
              cursor: String!
              node: Series!
            }

            type SeriesEventPayload implements IProductEventPayload {
              id: String!
              name: String!
            }

            input SeriesGenreAggregateInput {
              AND: [SeriesGenreAggregateInput!]
              NOT: SeriesGenreAggregateInput
              OR: [SeriesGenreAggregateInput!]
              count: Int
              count_GT: Int
              count_GTE: Int
              count_LT: Int
              count_LTE: Int
              node: SeriesGenreNodeAggregationWhereInput
            }

            input SeriesGenreConnectFieldInput {
              connect: GenreConnectInput
              \\"\\"\\"
              Whether or not to overwrite any matching relationship with the new properties.
              \\"\\"\\"
              overwrite: Boolean! = true
              where: GenreConnectWhere
            }

            input SeriesGenreConnectOrCreateFieldInput {
              onCreate: SeriesGenreConnectOrCreateFieldInputOnCreate!
              where: GenreConnectOrCreateWhere!
            }

            input SeriesGenreConnectOrCreateFieldInputOnCreate {
              node: GenreOnCreateInput!
            }

            type SeriesGenreConnectedRelationship {
              node: GenreEventPayload!
            }

            type SeriesGenreConnection {
              edges: [SeriesGenreRelationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input SeriesGenreConnectionSort {
              node: GenreSort
            }

            input SeriesGenreConnectionWhere {
              AND: [SeriesGenreConnectionWhere!]
              NOT: SeriesGenreConnectionWhere
              OR: [SeriesGenreConnectionWhere!]
              node: GenreWhere
              node_NOT: GenreWhere @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
            }

            input SeriesGenreCreateFieldInput {
              node: GenreCreateInput!
            }

            input SeriesGenreDeleteFieldInput {
              delete: GenreDeleteInput
              where: SeriesGenreConnectionWhere
            }

            input SeriesGenreDisconnectFieldInput {
              disconnect: GenreDisconnectInput
              where: SeriesGenreConnectionWhere
            }

            input SeriesGenreFieldInput {
              connect: SeriesGenreConnectFieldInput
              connectOrCreate: SeriesGenreConnectOrCreateFieldInput
              create: SeriesGenreCreateFieldInput
            }

            type SeriesGenreGenreAggregationSelection {
              count: Int!
              node: SeriesGenreGenreNodeAggregateSelection
            }

            type SeriesGenreGenreNodeAggregateSelection {
              name: StringAggregateSelectionNonNullable!
            }

            input SeriesGenreNodeAggregationWhereInput {
              AND: [SeriesGenreNodeAggregationWhereInput!]
              NOT: SeriesGenreNodeAggregationWhereInput
              OR: [SeriesGenreNodeAggregationWhereInput!]
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

            type SeriesGenreRelationship {
              cursor: String!
              node: Genre!
            }

            input SeriesGenreRelationshipSubscriptionWhere {
              node: GenreSubscriptionWhere
            }

            input SeriesGenreUpdateConnectionInput {
              node: GenreUpdateInput
            }

            input SeriesGenreUpdateFieldInput {
              connect: SeriesGenreConnectFieldInput
              connectOrCreate: SeriesGenreConnectOrCreateFieldInput
              create: SeriesGenreCreateFieldInput
              delete: SeriesGenreDeleteFieldInput
              disconnect: SeriesGenreDisconnectFieldInput
              update: SeriesGenreUpdateConnectionInput
              where: SeriesGenreConnectionWhere
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
              genre: SeriesGenreCreateFieldInput
            }

            type SeriesRelationshipCreatedEvent {
              createdRelationship: SeriesConnectedRelationships!
              event: EventType!
              relationshipFieldName: String!
              series: SeriesEventPayload!
              timestamp: Float!
            }

            input SeriesRelationshipCreatedSubscriptionWhere {
              AND: [SeriesRelationshipCreatedSubscriptionWhere!]
              NOT: SeriesRelationshipCreatedSubscriptionWhere
              OR: [SeriesRelationshipCreatedSubscriptionWhere!]
              createdRelationship: SeriesRelationshipsSubscriptionWhere
              series: SeriesSubscriptionWhere
            }

            type SeriesRelationshipDeletedEvent {
              deletedRelationship: SeriesConnectedRelationships!
              event: EventType!
              relationshipFieldName: String!
              series: SeriesEventPayload!
              timestamp: Float!
            }

            input SeriesRelationshipDeletedSubscriptionWhere {
              AND: [SeriesRelationshipDeletedSubscriptionWhere!]
              NOT: SeriesRelationshipDeletedSubscriptionWhere
              OR: [SeriesRelationshipDeletedSubscriptionWhere!]
              deletedRelationship: SeriesRelationshipsSubscriptionWhere
              series: SeriesSubscriptionWhere
            }

            input SeriesRelationshipsSubscriptionWhere {
              genre: SeriesGenreRelationshipSubscriptionWhere
            }

            \\"\\"\\"
            Fields to sort Series by. The order in which sorts are applied is not guaranteed when specifying many fields in one SeriesSort object.
            \\"\\"\\"
            input SeriesSort {
              id: SortDirection
              name: SortDirection
            }

            input SeriesSubscriptionWhere {
              AND: [SeriesSubscriptionWhere!]
              NOT: SeriesSubscriptionWhere
              OR: [SeriesSubscriptionWhere!]
              id: String
              id_CONTAINS: String
              id_ENDS_WITH: String
              id_IN: [String]
              id_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              id_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              id_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              id_NOT_IN: [String] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              id_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              id_STARTS_WITH: String
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

            input SeriesUpdateInput {
              genre: SeriesGenreUpdateFieldInput
              id: String
              name: String
            }

            type SeriesUpdatedEvent {
              event: EventType!
              previousState: SeriesEventPayload!
              timestamp: Float!
              updatedSeries: SeriesEventPayload!
            }

            input SeriesWhere {
              AND: [SeriesWhere!]
              NOT: SeriesWhere
              OR: [SeriesWhere!]
              genre: GenreWhere
              genreAggregate: SeriesGenreAggregateInput
              genreConnection: SeriesGenreConnectionWhere
              genreConnection_NOT: SeriesGenreConnectionWhere
              genre_NOT: GenreWhere
              id: String
              id_CONTAINS: String
              id_ENDS_WITH: String
              id_IN: [String!]
              id_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              id_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              id_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              id_NOT_IN: [String!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              id_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              id_STARTS_WITH: String
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

            \\"\\"\\"SortDirection\\"\\"\\"
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

            type Subscription {
              genreCreated(where: GenreSubscriptionWhere): GenreCreatedEvent!
              genreDeleted(where: GenreSubscriptionWhere): GenreDeletedEvent!
              genreRelationshipCreated(where: GenreRelationshipCreatedSubscriptionWhere): GenreRelationshipCreatedEvent!
              genreRelationshipDeleted(where: GenreRelationshipDeletedSubscriptionWhere): GenreRelationshipDeletedEvent!
              genreUpdated(where: GenreSubscriptionWhere): GenreUpdatedEvent!
              movieCreated(where: MovieSubscriptionWhere): MovieCreatedEvent!
              movieDeleted(where: MovieSubscriptionWhere): MovieDeletedEvent!
              movieRelationshipCreated(where: MovieRelationshipCreatedSubscriptionWhere): MovieRelationshipCreatedEvent!
              movieRelationshipDeleted(where: MovieRelationshipDeletedSubscriptionWhere): MovieRelationshipDeletedEvent!
              movieUpdated(where: MovieSubscriptionWhere): MovieUpdatedEvent!
              seriesCreated(where: SeriesSubscriptionWhere): SeriesCreatedEvent!
              seriesDeleted(where: SeriesSubscriptionWhere): SeriesDeletedEvent!
              seriesRelationshipCreated(where: SeriesRelationshipCreatedSubscriptionWhere): SeriesRelationshipCreatedEvent!
              seriesRelationshipDeleted(where: SeriesRelationshipDeletedSubscriptionWhere): SeriesRelationshipDeletedEvent!
              seriesUpdated(where: SeriesSubscriptionWhere): SeriesUpdatedEvent!
            }

            type UpdateGenresMutationResponse {
              genres: [Genre!]!
              info: UpdateInfo!
            }

            \\"\\"\\"UpdateInfo\\"\\"\\"
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

    test("Simple type definitions implementing just one interface", async () => {
        const typeDefs = gql`
            interface IProduct {
                id: String!

                name: String!
                genre: Genre!
            }

            type Movie implements IProduct {
                id: String!

                name: String!
                genre: Genre! @relationship(type: "HAS_GENRE", direction: OUT)
            }

            type Series implements IProduct {
                id: String!

                name: String!
                genre: Genre! @relationship(type: "HAS_GENRE", direction: OUT)
            }

            type Genre {
                name: String! @unique
                product: [IProduct!]! @relationship(type: "HAS_GENRE", direction: IN)
            }
        `;

        const subscriptionsEngine = new TestSubscriptionsEngine();
        const neoSchema = new Neo4jGraphQL({ typeDefs, features: { subscriptions: subscriptionsEngine } });

        const schema = await neoSchema.getSchema();
        const errors = validateSchema(schema);
        expect(errors).toHaveLength(0);

        const printedSchema = printSchemaWithDirectives(lexicographicSortSchema(await neoSchema.getSchema()));

        expect(printedSchema).toMatchInlineSnapshot(`
            "schema {
              query: Query
              mutation: Mutation
              subscription: Subscription
            }

            type CreateGenresMutationResponse {
              genres: [Genre!]!
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

            enum EventType {
              CREATE
              CREATE_RELATIONSHIP
              DELETE
              DELETE_RELATIONSHIP
              UPDATE
            }

            type Genre {
              name: String!
              product(directed: Boolean = true, options: IProductOptions, where: IProductWhere): [IProduct!]!
              productConnection(after: String, directed: Boolean = true, first: Int, sort: [GenreProductConnectionSort!], where: GenreProductConnectionWhere): GenreProductConnection!
            }

            type GenreAggregateSelection {
              count: Int!
              name: StringAggregateSelectionNonNullable!
            }

            input GenreConnectInput {
              product: [GenreProductConnectFieldInput!]
            }

            input GenreConnectOrCreateWhere {
              node: GenreUniqueWhere!
            }

            input GenreConnectWhere {
              node: GenreWhere!
            }

            type GenreConnectedRelationships {
              product: GenreProductConnectedRelationship
            }

            input GenreCreateInput {
              name: String!
              product: GenreProductFieldInput
            }

            type GenreCreatedEvent {
              createdGenre: GenreEventPayload!
              event: EventType!
              timestamp: Float!
            }

            input GenreDeleteInput {
              product: [GenreProductDeleteFieldInput!]
            }

            type GenreDeletedEvent {
              deletedGenre: GenreEventPayload!
              event: EventType!
              timestamp: Float!
            }

            input GenreDisconnectInput {
              product: [GenreProductDisconnectFieldInput!]
            }

            type GenreEdge {
              cursor: String!
              node: Genre!
            }

            type GenreEventPayload {
              name: String!
            }

            input GenreOnCreateInput {
              name: String!
            }

            input GenreOptions {
              limit: Int
              offset: Int
              \\"\\"\\"
              Specify one or more GenreSort objects to sort Genres by. The sorts will be applied in the order in which they are arranged in the array.
              \\"\\"\\"
              sort: [GenreSort!]
            }

            input GenreProductConnectFieldInput {
              connect: IProductConnectInput
              where: IProductConnectWhere
            }

            type GenreProductConnectedRelationship {
              node: IProductEventPayload!
            }

            type GenreProductConnection {
              edges: [GenreProductRelationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input GenreProductConnectionSort {
              node: IProductSort
            }

            input GenreProductConnectionWhere {
              AND: [GenreProductConnectionWhere!]
              NOT: GenreProductConnectionWhere
              OR: [GenreProductConnectionWhere!]
              node: IProductWhere
              node_NOT: IProductWhere @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
            }

            input GenreProductCreateFieldInput {
              node: IProductCreateInput!
            }

            input GenreProductDeleteFieldInput {
              delete: IProductDeleteInput
              where: GenreProductConnectionWhere
            }

            input GenreProductDisconnectFieldInput {
              disconnect: IProductDisconnectInput
              where: GenreProductConnectionWhere
            }

            input GenreProductFieldInput {
              connect: [GenreProductConnectFieldInput!]
              create: [GenreProductCreateFieldInput!]
            }

            type GenreProductRelationship {
              cursor: String!
              node: IProduct!
            }

            input GenreProductRelationshipSubscriptionWhere {
              node: IProductSubscriptionWhere
            }

            input GenreProductUpdateConnectionInput {
              node: IProductUpdateInput
            }

            input GenreProductUpdateFieldInput {
              connect: [GenreProductConnectFieldInput!]
              create: [GenreProductCreateFieldInput!]
              delete: [GenreProductDeleteFieldInput!]
              disconnect: [GenreProductDisconnectFieldInput!]
              update: GenreProductUpdateConnectionInput
              where: GenreProductConnectionWhere
            }

            input GenreRelationInput {
              product: [GenreProductCreateFieldInput!]
            }

            type GenreRelationshipCreatedEvent {
              createdRelationship: GenreConnectedRelationships!
              event: EventType!
              genre: GenreEventPayload!
              relationshipFieldName: String!
              timestamp: Float!
            }

            input GenreRelationshipCreatedSubscriptionWhere {
              AND: [GenreRelationshipCreatedSubscriptionWhere!]
              NOT: GenreRelationshipCreatedSubscriptionWhere
              OR: [GenreRelationshipCreatedSubscriptionWhere!]
              createdRelationship: GenreRelationshipsSubscriptionWhere
              genre: GenreSubscriptionWhere
            }

            type GenreRelationshipDeletedEvent {
              deletedRelationship: GenreConnectedRelationships!
              event: EventType!
              genre: GenreEventPayload!
              relationshipFieldName: String!
              timestamp: Float!
            }

            input GenreRelationshipDeletedSubscriptionWhere {
              AND: [GenreRelationshipDeletedSubscriptionWhere!]
              NOT: GenreRelationshipDeletedSubscriptionWhere
              OR: [GenreRelationshipDeletedSubscriptionWhere!]
              deletedRelationship: GenreRelationshipsSubscriptionWhere
              genre: GenreSubscriptionWhere
            }

            input GenreRelationshipsSubscriptionWhere {
              product: GenreProductRelationshipSubscriptionWhere
            }

            \\"\\"\\"
            Fields to sort Genres by. The order in which sorts are applied is not guaranteed when specifying many fields in one GenreSort object.
            \\"\\"\\"
            input GenreSort {
              name: SortDirection
            }

            input GenreSubscriptionWhere {
              AND: [GenreSubscriptionWhere!]
              NOT: GenreSubscriptionWhere
              OR: [GenreSubscriptionWhere!]
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

            input GenreUniqueWhere {
              name: String
            }

            input GenreUpdateInput {
              name: String
              product: [GenreProductUpdateFieldInput!]
            }

            type GenreUpdatedEvent {
              event: EventType!
              previousState: GenreEventPayload!
              timestamp: Float!
              updatedGenre: GenreEventPayload!
            }

            input GenreWhere {
              AND: [GenreWhere!]
              NOT: GenreWhere
              OR: [GenreWhere!]
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
              productConnection: GenreProductConnectionWhere @deprecated(reason: \\"Use \`productConnection_SOME\` instead.\\")
              \\"\\"\\"
              Return Genres where all of the related GenreProductConnections match this filter
              \\"\\"\\"
              productConnection_ALL: GenreProductConnectionWhere
              \\"\\"\\"
              Return Genres where none of the related GenreProductConnections match this filter
              \\"\\"\\"
              productConnection_NONE: GenreProductConnectionWhere
              productConnection_NOT: GenreProductConnectionWhere @deprecated(reason: \\"Use \`productConnection_NONE\` instead.\\")
              \\"\\"\\"
              Return Genres where one of the related GenreProductConnections match this filter
              \\"\\"\\"
              productConnection_SINGLE: GenreProductConnectionWhere
              \\"\\"\\"
              Return Genres where some of the related GenreProductConnections match this filter
              \\"\\"\\"
              productConnection_SOME: GenreProductConnectionWhere
            }

            type GenresConnection {
              edges: [GenreEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            interface IProduct {
              genre: Genre!
              id: String!
              name: String!
            }

            input IProductConnectInput {
              _on: IProductImplementationsConnectInput
            }

            input IProductConnectWhere {
              node: IProductWhere!
            }

            input IProductCreateInput {
              Movie: MovieCreateInput
              Series: SeriesCreateInput
            }

            input IProductDeleteInput {
              _on: IProductImplementationsDeleteInput
            }

            input IProductDisconnectInput {
              _on: IProductImplementationsDisconnectInput
            }

            interface IProductEventPayload {
              id: String!
              name: String!
            }

            input IProductGenreConnectFieldInput {
              connect: GenreConnectInput
              \\"\\"\\"
              Whether or not to overwrite any matching relationship with the new properties.
              \\"\\"\\"
              overwrite: Boolean! = true
              where: GenreConnectWhere
            }

            input IProductGenreConnectOrCreateFieldInput {
              onCreate: IProductGenreConnectOrCreateFieldInputOnCreate!
              where: GenreConnectOrCreateWhere!
            }

            input IProductGenreConnectOrCreateFieldInputOnCreate {
              node: GenreOnCreateInput!
            }

            type IProductGenreConnection {
              edges: [IProductGenreRelationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input IProductGenreConnectionSort {
              node: GenreSort
            }

            input IProductGenreConnectionWhere {
              AND: [IProductGenreConnectionWhere!]
              NOT: IProductGenreConnectionWhere
              OR: [IProductGenreConnectionWhere!]
              node: GenreWhere
              node_NOT: GenreWhere @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
            }

            input IProductGenreCreateFieldInput {
              node: GenreCreateInput!
            }

            input IProductGenreDeleteFieldInput {
              delete: GenreDeleteInput
              where: IProductGenreConnectionWhere
            }

            input IProductGenreDisconnectFieldInput {
              disconnect: GenreDisconnectInput
              where: IProductGenreConnectionWhere
            }

            input IProductGenreFieldInput {
              connect: IProductGenreConnectFieldInput
              connectOrCreate: IProductGenreConnectOrCreateFieldInput
              create: IProductGenreCreateFieldInput
            }

            type IProductGenreRelationship {
              cursor: String!
              node: Genre!
            }

            input IProductGenreUpdateConnectionInput {
              node: GenreUpdateInput
            }

            input IProductGenreUpdateFieldInput {
              connect: IProductGenreConnectFieldInput
              connectOrCreate: IProductGenreConnectOrCreateFieldInput
              create: IProductGenreCreateFieldInput
              delete: IProductGenreDeleteFieldInput
              disconnect: IProductGenreDisconnectFieldInput
              update: IProductGenreUpdateConnectionInput
              where: IProductGenreConnectionWhere
            }

            input IProductImplementationsConnectInput {
              Movie: [MovieConnectInput!]
              Series: [SeriesConnectInput!]
            }

            input IProductImplementationsDeleteInput {
              Movie: [MovieDeleteInput!]
              Series: [SeriesDeleteInput!]
            }

            input IProductImplementationsDisconnectInput {
              Movie: [MovieDisconnectInput!]
              Series: [SeriesDisconnectInput!]
            }

            input IProductImplementationsSubscriptionWhere {
              Movie: MovieSubscriptionWhere
              Series: SeriesSubscriptionWhere
            }

            input IProductImplementationsUpdateInput {
              Movie: MovieUpdateInput
              Series: SeriesUpdateInput
            }

            input IProductImplementationsWhere {
              Movie: MovieWhere
              Series: SeriesWhere
            }

            input IProductOptions {
              limit: Int
              offset: Int
              \\"\\"\\"
              Specify one or more IProductSort objects to sort IProducts by. The sorts will be applied in the order in which they are arranged in the array.
              \\"\\"\\"
              sort: [IProductSort]
            }

            \\"\\"\\"
            Fields to sort IProducts by. The order in which sorts are applied is not guaranteed when specifying many fields in one IProductSort object.
            \\"\\"\\"
            input IProductSort {
              id: SortDirection
              name: SortDirection
            }

            input IProductSubscriptionWhere {
              AND: [IProductSubscriptionWhere!]
              NOT: IProductSubscriptionWhere
              OR: [IProductSubscriptionWhere!]
              _on: IProductImplementationsSubscriptionWhere
              id: String
              id_CONTAINS: String
              id_ENDS_WITH: String
              id_IN: [String]
              id_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              id_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              id_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              id_NOT_IN: [String] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              id_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              id_STARTS_WITH: String
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

            input IProductUpdateInput {
              _on: IProductImplementationsUpdateInput
              id: String
              name: String
            }

            input IProductWhere {
              _on: IProductImplementationsWhere
              id: String
              id_CONTAINS: String
              id_ENDS_WITH: String
              id_IN: [String!]
              id_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              id_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              id_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              id_NOT_IN: [String!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              id_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              id_STARTS_WITH: String
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

            type Movie implements IProduct {
              genre(directed: Boolean = true, options: GenreOptions, where: GenreWhere): Genre!
              genreAggregate(directed: Boolean = true, where: GenreWhere): MovieGenreGenreAggregationSelection
              genreConnection(after: String, directed: Boolean = true, first: Int, sort: [IProductGenreConnectionSort!], where: IProductGenreConnectionWhere): IProductGenreConnection!
              id: String!
              name: String!
            }

            type MovieAggregateSelection {
              count: Int!
              id: StringAggregateSelectionNonNullable!
              name: StringAggregateSelectionNonNullable!
            }

            input MovieConnectInput {
              genre: IProductGenreConnectFieldInput
            }

            input MovieConnectOrCreateInput {
              genre: IProductGenreConnectOrCreateFieldInput
            }

            type MovieConnectedRelationships {
              genre: MovieGenreConnectedRelationship
            }

            input MovieCreateInput {
              genre: IProductGenreFieldInput
              id: String!
              name: String!
            }

            type MovieCreatedEvent {
              createdMovie: MovieEventPayload!
              event: EventType!
              timestamp: Float!
            }

            input MovieDeleteInput {
              genre: IProductGenreDeleteFieldInput
            }

            type MovieDeletedEvent {
              deletedMovie: MovieEventPayload!
              event: EventType!
              timestamp: Float!
            }

            input MovieDisconnectInput {
              genre: IProductGenreDisconnectFieldInput
            }

            type MovieEdge {
              cursor: String!
              node: Movie!
            }

            type MovieEventPayload implements IProductEventPayload {
              id: String!
              name: String!
            }

            input MovieGenreAggregateInput {
              AND: [MovieGenreAggregateInput!]
              NOT: MovieGenreAggregateInput
              OR: [MovieGenreAggregateInput!]
              count: Int
              count_GT: Int
              count_GTE: Int
              count_LT: Int
              count_LTE: Int
              node: MovieGenreNodeAggregationWhereInput
            }

            type MovieGenreConnectedRelationship {
              node: GenreEventPayload!
            }

            type MovieGenreGenreAggregationSelection {
              count: Int!
              node: MovieGenreGenreNodeAggregateSelection
            }

            type MovieGenreGenreNodeAggregateSelection {
              name: StringAggregateSelectionNonNullable!
            }

            input MovieGenreNodeAggregationWhereInput {
              AND: [MovieGenreNodeAggregationWhereInput!]
              NOT: MovieGenreNodeAggregationWhereInput
              OR: [MovieGenreNodeAggregationWhereInput!]
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

            input MovieGenreRelationshipSubscriptionWhere {
              node: GenreSubscriptionWhere
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
              genre: IProductGenreCreateFieldInput
            }

            type MovieRelationshipCreatedEvent {
              createdRelationship: MovieConnectedRelationships!
              event: EventType!
              movie: MovieEventPayload!
              relationshipFieldName: String!
              timestamp: Float!
            }

            input MovieRelationshipCreatedSubscriptionWhere {
              AND: [MovieRelationshipCreatedSubscriptionWhere!]
              NOT: MovieRelationshipCreatedSubscriptionWhere
              OR: [MovieRelationshipCreatedSubscriptionWhere!]
              createdRelationship: MovieRelationshipsSubscriptionWhere
              movie: MovieSubscriptionWhere
            }

            type MovieRelationshipDeletedEvent {
              deletedRelationship: MovieConnectedRelationships!
              event: EventType!
              movie: MovieEventPayload!
              relationshipFieldName: String!
              timestamp: Float!
            }

            input MovieRelationshipDeletedSubscriptionWhere {
              AND: [MovieRelationshipDeletedSubscriptionWhere!]
              NOT: MovieRelationshipDeletedSubscriptionWhere
              OR: [MovieRelationshipDeletedSubscriptionWhere!]
              deletedRelationship: MovieRelationshipsSubscriptionWhere
              movie: MovieSubscriptionWhere
            }

            input MovieRelationshipsSubscriptionWhere {
              genre: MovieGenreRelationshipSubscriptionWhere
            }

            \\"\\"\\"
            Fields to sort Movies by. The order in which sorts are applied is not guaranteed when specifying many fields in one MovieSort object.
            \\"\\"\\"
            input MovieSort {
              id: SortDirection
              name: SortDirection
            }

            input MovieSubscriptionWhere {
              AND: [MovieSubscriptionWhere!]
              NOT: MovieSubscriptionWhere
              OR: [MovieSubscriptionWhere!]
              id: String
              id_CONTAINS: String
              id_ENDS_WITH: String
              id_IN: [String]
              id_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              id_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              id_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              id_NOT_IN: [String] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              id_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              id_STARTS_WITH: String
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

            input MovieUpdateInput {
              genre: IProductGenreUpdateFieldInput
              id: String
              name: String
            }

            type MovieUpdatedEvent {
              event: EventType!
              previousState: MovieEventPayload!
              timestamp: Float!
              updatedMovie: MovieEventPayload!
            }

            input MovieWhere {
              AND: [MovieWhere!]
              NOT: MovieWhere
              OR: [MovieWhere!]
              genre: GenreWhere
              genreAggregate: MovieGenreAggregateInput
              genreConnection: IProductGenreConnectionWhere
              genreConnection_NOT: IProductGenreConnectionWhere
              genre_NOT: GenreWhere
              id: String
              id_CONTAINS: String
              id_ENDS_WITH: String
              id_IN: [String!]
              id_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              id_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              id_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              id_NOT_IN: [String!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              id_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              id_STARTS_WITH: String
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

            type MoviesConnection {
              edges: [MovieEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            type Mutation {
              createGenres(input: [GenreCreateInput!]!): CreateGenresMutationResponse!
              createMovies(input: [MovieCreateInput!]!): CreateMoviesMutationResponse!
              createSeries(input: [SeriesCreateInput!]!): CreateSeriesMutationResponse!
              deleteGenres(delete: GenreDeleteInput, where: GenreWhere): DeleteInfo!
              deleteMovies(delete: MovieDeleteInput, where: MovieWhere): DeleteInfo!
              deleteSeries(delete: SeriesDeleteInput, where: SeriesWhere): DeleteInfo!
              updateGenres(connect: GenreConnectInput, create: GenreRelationInput, delete: GenreDeleteInput, disconnect: GenreDisconnectInput, update: GenreUpdateInput, where: GenreWhere): UpdateGenresMutationResponse!
              updateMovies(connect: MovieConnectInput, connectOrCreate: MovieConnectOrCreateInput, create: MovieRelationInput, delete: MovieDeleteInput, disconnect: MovieDisconnectInput, update: MovieUpdateInput, where: MovieWhere): UpdateMoviesMutationResponse!
              updateSeries(connect: SeriesConnectInput, connectOrCreate: SeriesConnectOrCreateInput, create: SeriesRelationInput, delete: SeriesDeleteInput, disconnect: SeriesDisconnectInput, update: SeriesUpdateInput, where: SeriesWhere): UpdateSeriesMutationResponse!
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
              series(options: SeriesOptions, where: SeriesWhere): [Series!]!
              seriesAggregate(where: SeriesWhere): SeriesAggregateSelection!
              seriesConnection(after: String, first: Int, sort: [SeriesSort], where: SeriesWhere): SeriesConnection!
            }

            type Series implements IProduct {
              genre(directed: Boolean = true, options: GenreOptions, where: GenreWhere): Genre!
              genreAggregate(directed: Boolean = true, where: GenreWhere): SeriesGenreGenreAggregationSelection
              genreConnection(after: String, directed: Boolean = true, first: Int, sort: [IProductGenreConnectionSort!], where: IProductGenreConnectionWhere): IProductGenreConnection!
              id: String!
              name: String!
            }

            type SeriesAggregateSelection {
              count: Int!
              id: StringAggregateSelectionNonNullable!
              name: StringAggregateSelectionNonNullable!
            }

            input SeriesConnectInput {
              genre: IProductGenreConnectFieldInput
            }

            input SeriesConnectOrCreateInput {
              genre: IProductGenreConnectOrCreateFieldInput
            }

            type SeriesConnectedRelationships {
              genre: SeriesGenreConnectedRelationship
            }

            type SeriesConnection {
              edges: [SeriesEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input SeriesCreateInput {
              genre: IProductGenreFieldInput
              id: String!
              name: String!
            }

            type SeriesCreatedEvent {
              createdSeries: SeriesEventPayload!
              event: EventType!
              timestamp: Float!
            }

            input SeriesDeleteInput {
              genre: IProductGenreDeleteFieldInput
            }

            type SeriesDeletedEvent {
              deletedSeries: SeriesEventPayload!
              event: EventType!
              timestamp: Float!
            }

            input SeriesDisconnectInput {
              genre: IProductGenreDisconnectFieldInput
            }

            type SeriesEdge {
              cursor: String!
              node: Series!
            }

            type SeriesEventPayload implements IProductEventPayload {
              id: String!
              name: String!
            }

            input SeriesGenreAggregateInput {
              AND: [SeriesGenreAggregateInput!]
              NOT: SeriesGenreAggregateInput
              OR: [SeriesGenreAggregateInput!]
              count: Int
              count_GT: Int
              count_GTE: Int
              count_LT: Int
              count_LTE: Int
              node: SeriesGenreNodeAggregationWhereInput
            }

            type SeriesGenreConnectedRelationship {
              node: GenreEventPayload!
            }

            type SeriesGenreGenreAggregationSelection {
              count: Int!
              node: SeriesGenreGenreNodeAggregateSelection
            }

            type SeriesGenreGenreNodeAggregateSelection {
              name: StringAggregateSelectionNonNullable!
            }

            input SeriesGenreNodeAggregationWhereInput {
              AND: [SeriesGenreNodeAggregationWhereInput!]
              NOT: SeriesGenreNodeAggregationWhereInput
              OR: [SeriesGenreNodeAggregationWhereInput!]
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

            input SeriesGenreRelationshipSubscriptionWhere {
              node: GenreSubscriptionWhere
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
              genre: IProductGenreCreateFieldInput
            }

            type SeriesRelationshipCreatedEvent {
              createdRelationship: SeriesConnectedRelationships!
              event: EventType!
              relationshipFieldName: String!
              series: SeriesEventPayload!
              timestamp: Float!
            }

            input SeriesRelationshipCreatedSubscriptionWhere {
              AND: [SeriesRelationshipCreatedSubscriptionWhere!]
              NOT: SeriesRelationshipCreatedSubscriptionWhere
              OR: [SeriesRelationshipCreatedSubscriptionWhere!]
              createdRelationship: SeriesRelationshipsSubscriptionWhere
              series: SeriesSubscriptionWhere
            }

            type SeriesRelationshipDeletedEvent {
              deletedRelationship: SeriesConnectedRelationships!
              event: EventType!
              relationshipFieldName: String!
              series: SeriesEventPayload!
              timestamp: Float!
            }

            input SeriesRelationshipDeletedSubscriptionWhere {
              AND: [SeriesRelationshipDeletedSubscriptionWhere!]
              NOT: SeriesRelationshipDeletedSubscriptionWhere
              OR: [SeriesRelationshipDeletedSubscriptionWhere!]
              deletedRelationship: SeriesRelationshipsSubscriptionWhere
              series: SeriesSubscriptionWhere
            }

            input SeriesRelationshipsSubscriptionWhere {
              genre: SeriesGenreRelationshipSubscriptionWhere
            }

            \\"\\"\\"
            Fields to sort Series by. The order in which sorts are applied is not guaranteed when specifying many fields in one SeriesSort object.
            \\"\\"\\"
            input SeriesSort {
              id: SortDirection
              name: SortDirection
            }

            input SeriesSubscriptionWhere {
              AND: [SeriesSubscriptionWhere!]
              NOT: SeriesSubscriptionWhere
              OR: [SeriesSubscriptionWhere!]
              id: String
              id_CONTAINS: String
              id_ENDS_WITH: String
              id_IN: [String]
              id_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              id_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              id_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              id_NOT_IN: [String] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              id_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              id_STARTS_WITH: String
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

            input SeriesUpdateInput {
              genre: IProductGenreUpdateFieldInput
              id: String
              name: String
            }

            type SeriesUpdatedEvent {
              event: EventType!
              previousState: SeriesEventPayload!
              timestamp: Float!
              updatedSeries: SeriesEventPayload!
            }

            input SeriesWhere {
              AND: [SeriesWhere!]
              NOT: SeriesWhere
              OR: [SeriesWhere!]
              genre: GenreWhere
              genreAggregate: SeriesGenreAggregateInput
              genreConnection: IProductGenreConnectionWhere
              genreConnection_NOT: IProductGenreConnectionWhere
              genre_NOT: GenreWhere
              id: String
              id_CONTAINS: String
              id_ENDS_WITH: String
              id_IN: [String!]
              id_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              id_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              id_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              id_NOT_IN: [String!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              id_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              id_STARTS_WITH: String
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

            type Subscription {
              genreCreated(where: GenreSubscriptionWhere): GenreCreatedEvent!
              genreDeleted(where: GenreSubscriptionWhere): GenreDeletedEvent!
              genreRelationshipCreated(where: GenreRelationshipCreatedSubscriptionWhere): GenreRelationshipCreatedEvent!
              genreRelationshipDeleted(where: GenreRelationshipDeletedSubscriptionWhere): GenreRelationshipDeletedEvent!
              genreUpdated(where: GenreSubscriptionWhere): GenreUpdatedEvent!
              movieCreated(where: MovieSubscriptionWhere): MovieCreatedEvent!
              movieDeleted(where: MovieSubscriptionWhere): MovieDeletedEvent!
              movieRelationshipCreated(where: MovieRelationshipCreatedSubscriptionWhere): MovieRelationshipCreatedEvent!
              movieRelationshipDeleted(where: MovieRelationshipDeletedSubscriptionWhere): MovieRelationshipDeletedEvent!
              movieUpdated(where: MovieSubscriptionWhere): MovieUpdatedEvent!
              seriesCreated(where: SeriesSubscriptionWhere): SeriesCreatedEvent!
              seriesDeleted(where: SeriesSubscriptionWhere): SeriesDeletedEvent!
              seriesRelationshipCreated(where: SeriesRelationshipCreatedSubscriptionWhere): SeriesRelationshipCreatedEvent!
              seriesRelationshipDeleted(where: SeriesRelationshipDeletedSubscriptionWhere): SeriesRelationshipDeletedEvent!
              seriesUpdated(where: SeriesSubscriptionWhere): SeriesUpdatedEvent!
            }

            type UpdateGenresMutationResponse {
              genres: [Genre!]!
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

    test("Example 3", async () => {
        const typeDefs = gql`
            interface IProduct {
                id: String!

                name: String!
                genre: Genre!
            }

            type Movie implements IProduct {
                id: String!

                name: String!
                genre: Genre! #@relationship(type: "HAS_GENRE", direction: OUT)
            }

            type Series implements IProduct {
                id: String!

                name: String!
                genre: Genre! #@relationship(type: "HAS_GENRE", direction: OUT)
            }

            type Genre {
                name: String! @unique
                product: [IProduct!]! @relationship(type: "HAS_GENRE", direction: IN)
            }
        `;

        const subscriptionsEngine = new TestSubscriptionsEngine();
        const neoSchema = new Neo4jGraphQL({ typeDefs, features: { subscriptions: subscriptionsEngine } });

        const schema = await neoSchema.getSchema();
        const errors = validateSchema(schema);
        expect(errors).toHaveLength(0);

        const printedSchema = printSchemaWithDirectives(lexicographicSortSchema(await neoSchema.getSchema()));

        expect(printedSchema).toMatchInlineSnapshot(`
            "schema {
              query: Query
              mutation: Mutation
              subscription: Subscription
            }

            type CreateGenresMutationResponse {
              genres: [Genre!]!
              info: CreateInfo!
            }

            \\"\\"\\"CreateInfo\\"\\"\\"
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

            \\"\\"\\"DeleteInfo\\"\\"\\"
            type DeleteInfo {
              bookmark: String @deprecated(reason: \\"This field has been deprecated because bookmarks are now handled by the driver.\\")
              nodesDeleted: Int!
              relationshipsDeleted: Int!
            }

            enum EventType {
              CREATE
              CREATE_RELATIONSHIP
              DELETE
              DELETE_RELATIONSHIP
              UPDATE
            }

            \\"\\"\\"\\"\\"\\"
            type Genre {
              \\"\\"\\"\\"\\"\\"
              name: String!
              \\"\\"\\"\\"\\"\\"
              product(directed: Boolean = true, options: IProductOptions, where: IProductWhere): [IProduct!]!
              productConnection(after: String, directed: Boolean = true, first: Int, sort: [GenreProductConnectionSort!], where: GenreProductConnectionWhere): GenreProductConnection!
            }

            type GenreAggregateSelection {
              count: Int!
              name: StringAggregateSelectionNonNullable!
            }

            input GenreConnectInput {
              product: [GenreProductConnectFieldInput!]
            }

            type GenreConnectedRelationships {
              product: GenreProductConnectedRelationship
            }

            input GenreCreateInput {
              name: String!
              product: GenreProductFieldInput
            }

            type GenreCreatedEvent {
              createdGenre: GenreEventPayload!
              event: EventType!
              timestamp: Float!
            }

            input GenreDeleteInput {
              product: [GenreProductDeleteFieldInput!]
            }

            type GenreDeletedEvent {
              deletedGenre: GenreEventPayload!
              event: EventType!
              timestamp: Float!
            }

            input GenreDisconnectInput {
              product: [GenreProductDisconnectFieldInput!]
            }

            type GenreEdge {
              cursor: String!
              node: Genre!
            }

            type GenreEventPayload {
              name: String!
            }

            input GenreOptions {
              limit: Int
              offset: Int
              \\"\\"\\"
              Specify one or more GenreSort objects to sort Genres by. The sorts will be applied in the order in which they are arranged in the array.
              \\"\\"\\"
              sort: [GenreSort!]
            }

            input GenreProductConnectFieldInput {
              where: IProductConnectWhere
            }

            type GenreProductConnectedRelationship {
              node: IProductEventPayload!
            }

            type GenreProductConnection {
              edges: [GenreProductRelationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input GenreProductConnectionSort {
              node: IProductSort
            }

            input GenreProductConnectionWhere {
              AND: [GenreProductConnectionWhere!]
              NOT: GenreProductConnectionWhere
              OR: [GenreProductConnectionWhere!]
              node: IProductWhere
              node_NOT: IProductWhere @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
            }

            input GenreProductCreateFieldInput {
              node: IProductCreateInput!
            }

            input GenreProductDeleteFieldInput {
              where: GenreProductConnectionWhere
            }

            input GenreProductDisconnectFieldInput {
              where: GenreProductConnectionWhere
            }

            input GenreProductFieldInput {
              connect: [GenreProductConnectFieldInput!]
              create: [GenreProductCreateFieldInput!]
            }

            type GenreProductRelationship {
              cursor: String!
              node: IProduct!
            }

            input GenreProductRelationshipSubscriptionWhere {
              node: IProductSubscriptionWhere
            }

            input GenreProductUpdateConnectionInput {
              node: IProductUpdateInput
            }

            input GenreProductUpdateFieldInput {
              connect: [GenreProductConnectFieldInput!]
              create: [GenreProductCreateFieldInput!]
              delete: [GenreProductDeleteFieldInput!]
              disconnect: [GenreProductDisconnectFieldInput!]
              update: GenreProductUpdateConnectionInput
              where: GenreProductConnectionWhere
            }

            input GenreRelationInput {
              product: [GenreProductCreateFieldInput!]
            }

            type GenreRelationshipCreatedEvent {
              createdRelationship: GenreConnectedRelationships!
              event: EventType!
              genre: GenreEventPayload!
              relationshipFieldName: String!
              timestamp: Float!
            }

            input GenreRelationshipCreatedSubscriptionWhere {
              AND: [GenreRelationshipCreatedSubscriptionWhere!]
              NOT: GenreRelationshipCreatedSubscriptionWhere
              OR: [GenreRelationshipCreatedSubscriptionWhere!]
              createdRelationship: GenreRelationshipsSubscriptionWhere
              genre: GenreSubscriptionWhere
            }

            type GenreRelationshipDeletedEvent {
              deletedRelationship: GenreConnectedRelationships!
              event: EventType!
              genre: GenreEventPayload!
              relationshipFieldName: String!
              timestamp: Float!
            }

            input GenreRelationshipDeletedSubscriptionWhere {
              AND: [GenreRelationshipDeletedSubscriptionWhere!]
              NOT: GenreRelationshipDeletedSubscriptionWhere
              OR: [GenreRelationshipDeletedSubscriptionWhere!]
              deletedRelationship: GenreRelationshipsSubscriptionWhere
              genre: GenreSubscriptionWhere
            }

            input GenreRelationshipsSubscriptionWhere {
              product: GenreProductRelationshipSubscriptionWhere
            }

            \\"\\"\\"
            Fields to sort Genres by. The order in which sorts are applied is not guaranteed when specifying many fields in one GenreSort object.
            \\"\\"\\"
            input GenreSort {
              name: SortDirection
            }

            input GenreSubscriptionWhere {
              AND: [GenreSubscriptionWhere!]
              NOT: GenreSubscriptionWhere
              OR: [GenreSubscriptionWhere!]
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

            input GenreUpdateInput {
              name: String
              product: [GenreProductUpdateFieldInput!]
            }

            type GenreUpdatedEvent {
              event: EventType!
              previousState: GenreEventPayload!
              timestamp: Float!
              updatedGenre: GenreEventPayload!
            }

            input GenreWhere {
              AND: [GenreWhere!]
              NOT: GenreWhere
              OR: [GenreWhere!]
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
              productConnection: GenreProductConnectionWhere @deprecated(reason: \\"Use \`productConnection_SOME\` instead.\\")
              \\"\\"\\"
              Return Genres where all of the related GenreProductConnections match this filter
              \\"\\"\\"
              productConnection_ALL: GenreProductConnectionWhere
              \\"\\"\\"
              Return Genres where none of the related GenreProductConnections match this filter
              \\"\\"\\"
              productConnection_NONE: GenreProductConnectionWhere
              productConnection_NOT: GenreProductConnectionWhere @deprecated(reason: \\"Use \`productConnection_NONE\` instead.\\")
              \\"\\"\\"
              Return Genres where one of the related GenreProductConnections match this filter
              \\"\\"\\"
              productConnection_SINGLE: GenreProductConnectionWhere
              \\"\\"\\"
              Return Genres where some of the related GenreProductConnections match this filter
              \\"\\"\\"
              productConnection_SOME: GenreProductConnectionWhere
            }

            type GenresConnection {
              edges: [GenreEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            interface IProduct {
              genre: Genre!
              id: String!
              name: String!
            }

            input IProductConnectWhere {
              node: IProductWhere!
            }

            input IProductCreateInput {
              Movie: MovieCreateInput
              Series: SeriesCreateInput
            }

            interface IProductEventPayload {
              id: String!
              name: String!
            }

            input IProductImplementationsSubscriptionWhere {
              Movie: MovieSubscriptionWhere
              Series: SeriesSubscriptionWhere
            }

            input IProductImplementationsUpdateInput {
              Movie: MovieUpdateInput
              Series: SeriesUpdateInput
            }

            input IProductImplementationsWhere {
              Movie: MovieWhere
              Series: SeriesWhere
            }

            input IProductOptions {
              limit: Int
              offset: Int
              \\"\\"\\"
              Specify one or more IProductSort objects to sort IProducts by. The sorts will be applied in the order in which they are arranged in the array.
              \\"\\"\\"
              sort: [IProductSort]
            }

            \\"\\"\\"
            Fields to sort IProducts by. The order in which sorts are applied is not guaranteed when specifying many fields in one IProductSort object.
            \\"\\"\\"
            input IProductSort {
              id: SortDirection
              name: SortDirection
            }

            input IProductSubscriptionWhere {
              AND: [IProductSubscriptionWhere!]
              NOT: IProductSubscriptionWhere
              OR: [IProductSubscriptionWhere!]
              _on: IProductImplementationsSubscriptionWhere
              id: String
              id_CONTAINS: String
              id_ENDS_WITH: String
              id_IN: [String]
              id_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              id_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              id_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              id_NOT_IN: [String] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              id_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              id_STARTS_WITH: String
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

            input IProductUpdateInput {
              _on: IProductImplementationsUpdateInput
              id: String
              name: String
            }

            input IProductWhere {
              _on: IProductImplementationsWhere
              id: String
              id_CONTAINS: String
              id_ENDS_WITH: String
              id_IN: [String!]
              id_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              id_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              id_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              id_NOT_IN: [String!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              id_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              id_STARTS_WITH: String
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

            \\"\\"\\"\\"\\"\\"
            type Movie implements IProduct {
              \\"\\"\\"\\"\\"\\"
              genre: Genre!
              \\"\\"\\"\\"\\"\\"
              id: String!
              \\"\\"\\"\\"\\"\\"
              name: String!
            }

            type MovieAggregateSelection {
              count: Int!
              id: StringAggregateSelectionNonNullable!
              name: StringAggregateSelectionNonNullable!
            }

            input MovieCreateInput {
              id: String!
              name: String!
            }

            type MovieCreatedEvent {
              createdMovie: MovieEventPayload!
              event: EventType!
              timestamp: Float!
            }

            type MovieDeletedEvent {
              deletedMovie: MovieEventPayload!
              event: EventType!
              timestamp: Float!
            }

            type MovieEdge {
              cursor: String!
              node: Movie!
            }

            type MovieEventPayload implements IProductEventPayload {
              id: String!
              name: String!
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
              id: SortDirection
              name: SortDirection
            }

            input MovieSubscriptionWhere {
              AND: [MovieSubscriptionWhere!]
              NOT: MovieSubscriptionWhere
              OR: [MovieSubscriptionWhere!]
              id: String
              id_CONTAINS: String
              id_ENDS_WITH: String
              id_IN: [String]
              id_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              id_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              id_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              id_NOT_IN: [String] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              id_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              id_STARTS_WITH: String
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

            input MovieUpdateInput {
              id: String
              name: String
            }

            type MovieUpdatedEvent {
              event: EventType!
              previousState: MovieEventPayload!
              timestamp: Float!
              updatedMovie: MovieEventPayload!
            }

            input MovieWhere {
              AND: [MovieWhere!]
              NOT: MovieWhere
              OR: [MovieWhere!]
              id: String
              id_CONTAINS: String
              id_ENDS_WITH: String
              id_IN: [String!]
              id_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              id_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              id_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              id_NOT_IN: [String!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              id_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              id_STARTS_WITH: String
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

            type MoviesConnection {
              edges: [MovieEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            type Mutation {
              createGenres(input: [GenreCreateInput!]!): CreateGenresMutationResponse!
              createMovies(input: [MovieCreateInput!]!): CreateMoviesMutationResponse!
              createSeries(input: [SeriesCreateInput!]!): CreateSeriesMutationResponse!
              deleteGenres(delete: GenreDeleteInput, where: GenreWhere): DeleteInfo!
              deleteMovies(where: MovieWhere): DeleteInfo!
              deleteSeries(where: SeriesWhere): DeleteInfo!
              updateGenres(connect: GenreConnectInput, create: GenreRelationInput, delete: GenreDeleteInput, disconnect: GenreDisconnectInput, update: GenreUpdateInput, where: GenreWhere): UpdateGenresMutationResponse!
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

            type Query {
              genres(options: GenreOptions, where: GenreWhere): [Genre!]!
              genresAggregate(where: GenreWhere): GenreAggregateSelection!
              genresConnection(after: String, first: Int, sort: [GenreSort], where: GenreWhere): GenresConnection!
              movies(options: MovieOptions, where: MovieWhere): [Movie!]!
              moviesAggregate(where: MovieWhere): MovieAggregateSelection!
              moviesConnection(after: String, first: Int, sort: [MovieSort], where: MovieWhere): MoviesConnection!
              series(options: SeriesOptions, where: SeriesWhere): [Series!]!
              seriesAggregate(where: SeriesWhere): SeriesAggregateSelection!
              seriesConnection(after: String, first: Int, sort: [SeriesSort], where: SeriesWhere): SeriesConnection!
            }

            \\"\\"\\"\\"\\"\\"
            type Series implements IProduct {
              \\"\\"\\"\\"\\"\\"
              genre: Genre!
              \\"\\"\\"\\"\\"\\"
              id: String!
              \\"\\"\\"\\"\\"\\"
              name: String!
            }

            type SeriesAggregateSelection {
              count: Int!
              id: StringAggregateSelectionNonNullable!
              name: StringAggregateSelectionNonNullable!
            }

            type SeriesConnection {
              edges: [SeriesEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input SeriesCreateInput {
              id: String!
              name: String!
            }

            type SeriesCreatedEvent {
              createdSeries: SeriesEventPayload!
              event: EventType!
              timestamp: Float!
            }

            type SeriesDeletedEvent {
              deletedSeries: SeriesEventPayload!
              event: EventType!
              timestamp: Float!
            }

            type SeriesEdge {
              cursor: String!
              node: Series!
            }

            type SeriesEventPayload implements IProductEventPayload {
              id: String!
              name: String!
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
              id: SortDirection
              name: SortDirection
            }

            input SeriesSubscriptionWhere {
              AND: [SeriesSubscriptionWhere!]
              NOT: SeriesSubscriptionWhere
              OR: [SeriesSubscriptionWhere!]
              id: String
              id_CONTAINS: String
              id_ENDS_WITH: String
              id_IN: [String]
              id_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              id_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              id_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              id_NOT_IN: [String] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              id_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              id_STARTS_WITH: String
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

            input SeriesUpdateInput {
              id: String
              name: String
            }

            type SeriesUpdatedEvent {
              event: EventType!
              previousState: SeriesEventPayload!
              timestamp: Float!
              updatedSeries: SeriesEventPayload!
            }

            input SeriesWhere {
              AND: [SeriesWhere!]
              NOT: SeriesWhere
              OR: [SeriesWhere!]
              id: String
              id_CONTAINS: String
              id_ENDS_WITH: String
              id_IN: [String!]
              id_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              id_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              id_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              id_NOT_IN: [String!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              id_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              id_STARTS_WITH: String
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

            \\"\\"\\"SortDirection\\"\\"\\"
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

            type Subscription {
              genreCreated(where: GenreSubscriptionWhere): GenreCreatedEvent!
              genreDeleted(where: GenreSubscriptionWhere): GenreDeletedEvent!
              genreRelationshipCreated(where: GenreRelationshipCreatedSubscriptionWhere): GenreRelationshipCreatedEvent!
              genreRelationshipDeleted(where: GenreRelationshipDeletedSubscriptionWhere): GenreRelationshipDeletedEvent!
              genreUpdated(where: GenreSubscriptionWhere): GenreUpdatedEvent!
              movieCreated(where: MovieSubscriptionWhere): MovieCreatedEvent!
              movieDeleted(where: MovieSubscriptionWhere): MovieDeletedEvent!
              movieUpdated(where: MovieSubscriptionWhere): MovieUpdatedEvent!
              seriesCreated(where: SeriesSubscriptionWhere): SeriesCreatedEvent!
              seriesDeleted(where: SeriesSubscriptionWhere): SeriesDeletedEvent!
              seriesUpdated(where: SeriesSubscriptionWhere): SeriesUpdatedEvent!
            }

            type UpdateGenresMutationResponse {
              genres: [Genre!]!
              info: UpdateInfo!
            }

            \\"\\"\\"UpdateInfo\\"\\"\\"
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
});
