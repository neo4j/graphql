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
import { validateSchema } from "graphql";
import { gql } from "graphql-tag";
import { lexicographicSortSchema } from "graphql/utilities";
import { Neo4jGraphQL } from "../../../src";
import { TestSubscriptionsEngine } from "../../utils/TestSubscriptionsEngine";

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

            \\"\\"\\"
            Information about the number of nodes and relationships created during a create mutation
            \\"\\"\\"
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

            \\"\\"\\"
            Information about the number of nodes and relationships deleted during a delete mutation
            \\"\\"\\"
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
              productAggregate(directed: Boolean = true, where: IProductWhere): GenreIProductProductAggregationSelection
              productConnection(after: String, directed: Boolean = true, first: Int, sort: [GenreProductConnectionSort!], where: GenreProductConnectionWhere): GenreProductConnection!
            }

            type GenreAggregateSelection {
              count: Int!
              name: StringAggregateSelection!
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

            type GenreIProductProductAggregationSelection {
              count: Int!
              node: GenreIProductProductNodeAggregateSelection
            }

            type GenreIProductProductNodeAggregateSelection {
              id: StringAggregateSelection!
              name: StringAggregateSelection!
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

            input GenreProductAggregateInput {
              AND: [GenreProductAggregateInput!]
              NOT: GenreProductAggregateInput
              OR: [GenreProductAggregateInput!]
              count: Int
              count_GT: Int
              count_GTE: Int
              count_LT: Int
              count_LTE: Int
              node: GenreProductNodeAggregationWhereInput
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

            input GenreProductNodeAggregationWhereInput {
              AND: [GenreProductNodeAggregationWhereInput!]
              NOT: GenreProductNodeAggregationWhereInput
              OR: [GenreProductNodeAggregationWhereInput!]
              id_AVERAGE_EQUAL: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              id_AVERAGE_GT: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              id_AVERAGE_GTE: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              id_AVERAGE_LENGTH_EQUAL: Float
              id_AVERAGE_LENGTH_GT: Float
              id_AVERAGE_LENGTH_GTE: Float
              id_AVERAGE_LENGTH_LT: Float
              id_AVERAGE_LENGTH_LTE: Float
              id_AVERAGE_LT: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              id_AVERAGE_LTE: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              id_EQUAL: String @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              id_GT: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              id_GTE: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              id_LONGEST_EQUAL: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              id_LONGEST_GT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              id_LONGEST_GTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              id_LONGEST_LENGTH_EQUAL: Int
              id_LONGEST_LENGTH_GT: Int
              id_LONGEST_LENGTH_GTE: Int
              id_LONGEST_LENGTH_LT: Int
              id_LONGEST_LENGTH_LTE: Int
              id_LONGEST_LT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              id_LONGEST_LTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              id_LT: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              id_LTE: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              id_SHORTEST_EQUAL: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              id_SHORTEST_GT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              id_SHORTEST_GTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              id_SHORTEST_LENGTH_EQUAL: Int
              id_SHORTEST_LENGTH_GT: Int
              id_SHORTEST_LENGTH_GTE: Int
              id_SHORTEST_LENGTH_LT: Int
              id_SHORTEST_LENGTH_LTE: Int
              id_SHORTEST_LT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              id_SHORTEST_LTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
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
              name_IN: [String!]
              name_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              name_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              name_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              name_NOT_IN: [String!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
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
              product: IProductWhere @deprecated(reason: \\"Use \`product_SOME\` instead.\\")
              productAggregate: GenreProductAggregateInput
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
              \\"\\"\\"Return Genres where all of the related IProducts match this filter\\"\\"\\"
              product_ALL: IProductWhere
              \\"\\"\\"Return Genres where none of the related IProducts match this filter\\"\\"\\"
              product_NONE: IProductWhere
              product_NOT: IProductWhere @deprecated(reason: \\"Use \`product_NONE\` instead.\\")
              \\"\\"\\"Return Genres where one of the related IProducts match this filter\\"\\"\\"
              product_SINGLE: IProductWhere
              \\"\\"\\"Return Genres where some of the related IProducts match this filter\\"\\"\\"
              product_SOME: IProductWhere
            }

            type GenresConnection {
              edges: [GenreEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            interface INode {
              id: String!
            }

            type INodeAggregateSelection {
              count: Int!
              id: StringAggregateSelection!
            }

            type INodeEdge {
              cursor: String!
              node: INode!
            }

            enum INodeImplementation {
              Movie
              Series
            }

            input INodeOptions {
              limit: Int
              offset: Int
              \\"\\"\\"
              Specify one or more INodeSort objects to sort INodes by. The sorts will be applied in the order in which they are arranged in the array.
              \\"\\"\\"
              sort: [INodeSort]
            }

            \\"\\"\\"
            Fields to sort INodes by. The order in which sorts are applied is not guaranteed when specifying many fields in one INodeSort object.
            \\"\\"\\"
            input INodeSort {
              id: SortDirection
            }

            input INodeWhere {
              AND: [INodeWhere!]
              NOT: INodeWhere
              OR: [INodeWhere!]
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
              typename_IN: [INodeImplementation!]
            }

            type INodesConnection {
              edges: [INodeEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            interface IProduct {
              genre: Genre!
              id: String!
              name: String!
            }

            type IProductAggregateSelection {
              count: Int!
              id: StringAggregateSelection!
              name: StringAggregateSelection!
            }

            input IProductConnectWhere {
              node: IProductWhere!
            }

            input IProductCreateInput {
              Movie: MovieCreateInput
              Series: SeriesCreateInput
            }

            type IProductEdge {
              cursor: String!
              node: IProduct!
            }

            interface IProductEventPayload {
              id: String!
              name: String!
            }

            enum IProductImplementation {
              Movie
              Series
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
              typename_IN: [IProductImplementation!]
            }

            input IProductUpdateInput {
              id: String
              name: String
            }

            input IProductWhere {
              AND: [IProductWhere!]
              NOT: IProductWhere
              OR: [IProductWhere!]
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
              typename_IN: [IProductImplementation!]
            }

            type IProductsConnection {
              edges: [IProductEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            type Movie implements INode & IProduct {
              genre(directed: Boolean = true, options: GenreOptions, where: GenreWhere): Genre!
              genreAggregate(directed: Boolean = true, where: GenreWhere): MovieGenreGenreAggregationSelection
              genreConnection(after: String, directed: Boolean = true, first: Int, sort: [MovieGenreConnectionSort!], where: MovieGenreConnectionWhere): MovieGenreConnection!
              id: String!
              name: String!
            }

            type MovieAggregateSelection {
              count: Int!
              id: StringAggregateSelection!
              name: StringAggregateSelection!
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
              name: StringAggregateSelection!
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
              iNodes(options: INodeOptions, where: INodeWhere): [INode!]!
              iNodesAggregate(where: INodeWhere): INodeAggregateSelection!
              iNodesConnection(after: String, first: Int, sort: [INodeSort], where: INodeWhere): INodesConnection!
              iProducts(options: IProductOptions, where: IProductWhere): [IProduct!]!
              iProductsAggregate(where: IProductWhere): IProductAggregateSelection!
              iProductsConnection(after: String, first: Int, sort: [IProductSort], where: IProductWhere): IProductsConnection!
              movies(options: MovieOptions, where: MovieWhere): [Movie!]!
              moviesAggregate(where: MovieWhere): MovieAggregateSelection!
              moviesConnection(after: String, first: Int, sort: [MovieSort], where: MovieWhere): MoviesConnection!
              series(options: SeriesOptions, where: SeriesWhere): [Series!]!
              seriesAggregate(where: SeriesWhere): SeriesAggregateSelection!
              seriesConnection(after: String, first: Int, sort: [SeriesSort], where: SeriesWhere): SeriesConnection!
            }

            type Series implements INode & IProduct {
              genre(directed: Boolean = true, options: GenreOptions, where: GenreWhere): Genre!
              genreAggregate(directed: Boolean = true, where: GenreWhere): SeriesGenreGenreAggregationSelection
              genreConnection(after: String, directed: Boolean = true, first: Int, sort: [SeriesGenreConnectionSort!], where: SeriesGenreConnectionWhere): SeriesGenreConnection!
              id: String!
              name: String!
            }

            type SeriesAggregateSelection {
              count: Int!
              id: StringAggregateSelection!
              name: StringAggregateSelection!
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
              name: StringAggregateSelection!
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

            \\"\\"\\"
            Information about the number of nodes and relationships created and deleted during an update mutation
            \\"\\"\\"
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

            \\"\\"\\"
            Information about the number of nodes and relationships created during a create mutation
            \\"\\"\\"
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

            \\"\\"\\"
            Information about the number of nodes and relationships deleted during a delete mutation
            \\"\\"\\"
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
              productAggregate(directed: Boolean = true, where: IProductWhere): GenreIProductProductAggregationSelection
              productConnection(after: String, directed: Boolean = true, first: Int, sort: [GenreProductConnectionSort!], where: GenreProductConnectionWhere): GenreProductConnection!
            }

            type GenreAggregateSelection {
              count: Int!
              name: StringAggregateSelection!
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

            type GenreIProductProductAggregationSelection {
              count: Int!
              node: GenreIProductProductNodeAggregateSelection
            }

            type GenreIProductProductNodeAggregateSelection {
              id: StringAggregateSelection!
              name: StringAggregateSelection!
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

            input GenreProductAggregateInput {
              AND: [GenreProductAggregateInput!]
              NOT: GenreProductAggregateInput
              OR: [GenreProductAggregateInput!]
              count: Int
              count_GT: Int
              count_GTE: Int
              count_LT: Int
              count_LTE: Int
              node: GenreProductNodeAggregationWhereInput
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

            input GenreProductNodeAggregationWhereInput {
              AND: [GenreProductNodeAggregationWhereInput!]
              NOT: GenreProductNodeAggregationWhereInput
              OR: [GenreProductNodeAggregationWhereInput!]
              id_AVERAGE_EQUAL: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              id_AVERAGE_GT: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              id_AVERAGE_GTE: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              id_AVERAGE_LENGTH_EQUAL: Float
              id_AVERAGE_LENGTH_GT: Float
              id_AVERAGE_LENGTH_GTE: Float
              id_AVERAGE_LENGTH_LT: Float
              id_AVERAGE_LENGTH_LTE: Float
              id_AVERAGE_LT: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              id_AVERAGE_LTE: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              id_EQUAL: String @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              id_GT: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              id_GTE: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              id_LONGEST_EQUAL: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              id_LONGEST_GT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              id_LONGEST_GTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              id_LONGEST_LENGTH_EQUAL: Int
              id_LONGEST_LENGTH_GT: Int
              id_LONGEST_LENGTH_GTE: Int
              id_LONGEST_LENGTH_LT: Int
              id_LONGEST_LENGTH_LTE: Int
              id_LONGEST_LT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              id_LONGEST_LTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              id_LT: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              id_LTE: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              id_SHORTEST_EQUAL: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              id_SHORTEST_GT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              id_SHORTEST_GTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              id_SHORTEST_LENGTH_EQUAL: Int
              id_SHORTEST_LENGTH_GT: Int
              id_SHORTEST_LENGTH_GTE: Int
              id_SHORTEST_LENGTH_LT: Int
              id_SHORTEST_LENGTH_LTE: Int
              id_SHORTEST_LT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              id_SHORTEST_LTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
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
              name_IN: [String!]
              name_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              name_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              name_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              name_NOT_IN: [String!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
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
              product: IProductWhere @deprecated(reason: \\"Use \`product_SOME\` instead.\\")
              productAggregate: GenreProductAggregateInput
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
              \\"\\"\\"Return Genres where all of the related IProducts match this filter\\"\\"\\"
              product_ALL: IProductWhere
              \\"\\"\\"Return Genres where none of the related IProducts match this filter\\"\\"\\"
              product_NONE: IProductWhere
              product_NOT: IProductWhere @deprecated(reason: \\"Use \`product_NONE\` instead.\\")
              \\"\\"\\"Return Genres where one of the related IProducts match this filter\\"\\"\\"
              product_SINGLE: IProductWhere
              \\"\\"\\"Return Genres where some of the related IProducts match this filter\\"\\"\\"
              product_SOME: IProductWhere
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

            type IProductAggregateSelection {
              count: Int!
              id: StringAggregateSelection!
              name: StringAggregateSelection!
            }

            input IProductConnectWhere {
              node: IProductWhere!
            }

            input IProductCreateInput {
              Movie: MovieCreateInput
              Series: SeriesCreateInput
            }

            type IProductEdge {
              cursor: String!
              node: IProduct!
            }

            interface IProductEventPayload {
              id: String!
              name: String!
            }

            enum IProductImplementation {
              Movie
              Series
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
              typename_IN: [IProductImplementation!]
            }

            input IProductUpdateInput {
              id: String
              name: String
            }

            input IProductWhere {
              AND: [IProductWhere!]
              NOT: IProductWhere
              OR: [IProductWhere!]
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
              typename_IN: [IProductImplementation!]
            }

            type IProductsConnection {
              edges: [IProductEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            type Movie implements IProduct {
              genre(directed: Boolean = true, options: GenreOptions, where: GenreWhere): Genre!
              genreAggregate(directed: Boolean = true, where: GenreWhere): MovieGenreGenreAggregationSelection
              genreConnection(after: String, directed: Boolean = true, first: Int, sort: [MovieGenreConnectionSort!], where: MovieGenreConnectionWhere): MovieGenreConnection!
              id: String!
              name: String!
            }

            type MovieAggregateSelection {
              count: Int!
              id: StringAggregateSelection!
              name: StringAggregateSelection!
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
              name: StringAggregateSelection!
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
              iProducts(options: IProductOptions, where: IProductWhere): [IProduct!]!
              iProductsAggregate(where: IProductWhere): IProductAggregateSelection!
              iProductsConnection(after: String, first: Int, sort: [IProductSort], where: IProductWhere): IProductsConnection!
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
              genreConnection(after: String, directed: Boolean = true, first: Int, sort: [SeriesGenreConnectionSort!], where: SeriesGenreConnectionWhere): SeriesGenreConnection!
              id: String!
              name: String!
            }

            type SeriesAggregateSelection {
              count: Int!
              id: StringAggregateSelection!
              name: StringAggregateSelection!
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
              name: StringAggregateSelection!
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

            \\"\\"\\"
            Information about the number of nodes and relationships created and deleted during an update mutation
            \\"\\"\\"
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

    test("Simple type definitions implementing just one interface with different relationship properties", async () => {
        const typeDefs = gql`
            interface IProduct {
                id: String!

                name: String!
                genre: Genre! @declareRelationship
            }

            type Movie implements IProduct {
                id: String!

                name: String!
                genre: Genre! @relationship(type: "HAS_GENRE", direction: OUT, properties: "MovieProps")
            }

            type Series implements IProduct {
                id: String!

                name: String!
                genre: Genre! @relationship(type: "HAS_GENRE", direction: OUT, properties: "SeriesProps")
            }

            type MovieProps @relationshipProperties {
                year: Int!
            }

            type SeriesProps @relationshipProperties {
                episodes: Int
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

            \\"\\"\\"
            Information about the number of nodes and relationships created during a create mutation
            \\"\\"\\"
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

            \\"\\"\\"
            Information about the number of nodes and relationships deleted during a delete mutation
            \\"\\"\\"
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
              productAggregate(directed: Boolean = true, where: IProductWhere): GenreIProductProductAggregationSelection
              productConnection(after: String, directed: Boolean = true, first: Int, sort: [GenreProductConnectionSort!], where: GenreProductConnectionWhere): GenreProductConnection!
            }

            type GenreAggregateSelection {
              count: Int!
              name: StringAggregateSelection!
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

            type GenreIProductProductAggregationSelection {
              count: Int!
              node: GenreIProductProductNodeAggregateSelection
            }

            type GenreIProductProductNodeAggregateSelection {
              id: StringAggregateSelection!
              name: StringAggregateSelection!
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

            input GenreProductAggregateInput {
              AND: [GenreProductAggregateInput!]
              NOT: GenreProductAggregateInput
              OR: [GenreProductAggregateInput!]
              count: Int
              count_GT: Int
              count_GTE: Int
              count_LT: Int
              count_LTE: Int
              node: GenreProductNodeAggregationWhereInput
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

            input GenreProductNodeAggregationWhereInput {
              AND: [GenreProductNodeAggregationWhereInput!]
              NOT: GenreProductNodeAggregationWhereInput
              OR: [GenreProductNodeAggregationWhereInput!]
              id_AVERAGE_EQUAL: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              id_AVERAGE_GT: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              id_AVERAGE_GTE: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              id_AVERAGE_LENGTH_EQUAL: Float
              id_AVERAGE_LENGTH_GT: Float
              id_AVERAGE_LENGTH_GTE: Float
              id_AVERAGE_LENGTH_LT: Float
              id_AVERAGE_LENGTH_LTE: Float
              id_AVERAGE_LT: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              id_AVERAGE_LTE: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              id_EQUAL: String @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              id_GT: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              id_GTE: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              id_LONGEST_EQUAL: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              id_LONGEST_GT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              id_LONGEST_GTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              id_LONGEST_LENGTH_EQUAL: Int
              id_LONGEST_LENGTH_GT: Int
              id_LONGEST_LENGTH_GTE: Int
              id_LONGEST_LENGTH_LT: Int
              id_LONGEST_LENGTH_LTE: Int
              id_LONGEST_LT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              id_LONGEST_LTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              id_LT: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              id_LTE: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              id_SHORTEST_EQUAL: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              id_SHORTEST_GT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              id_SHORTEST_GTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              id_SHORTEST_LENGTH_EQUAL: Int
              id_SHORTEST_LENGTH_GT: Int
              id_SHORTEST_LENGTH_GTE: Int
              id_SHORTEST_LENGTH_LT: Int
              id_SHORTEST_LENGTH_LTE: Int
              id_SHORTEST_LT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              id_SHORTEST_LTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
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
              name_IN: [String!]
              name_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              name_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              name_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              name_NOT_IN: [String!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
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
              product: IProductWhere @deprecated(reason: \\"Use \`product_SOME\` instead.\\")
              productAggregate: GenreProductAggregateInput
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
              \\"\\"\\"Return Genres where all of the related IProducts match this filter\\"\\"\\"
              product_ALL: IProductWhere
              \\"\\"\\"Return Genres where none of the related IProducts match this filter\\"\\"\\"
              product_NONE: IProductWhere
              product_NOT: IProductWhere @deprecated(reason: \\"Use \`product_NONE\` instead.\\")
              \\"\\"\\"Return Genres where one of the related IProducts match this filter\\"\\"\\"
              product_SINGLE: IProductWhere
              \\"\\"\\"Return Genres where some of the related IProducts match this filter\\"\\"\\"
              product_SOME: IProductWhere
            }

            type GenresConnection {
              edges: [GenreEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            interface IProduct {
              genre(options: GenreOptions, where: GenreWhere): Genre!
              genreConnection(after: String, first: Int, sort: [IProductGenreConnectionSort!], where: IProductGenreConnectionWhere): IProductGenreConnection!
              id: String!
              name: String!
            }

            type IProductAggregateSelection {
              count: Int!
              id: StringAggregateSelection!
              name: StringAggregateSelection!
            }

            input IProductConnectInput {
              genre: IProductGenreConnectFieldInput
            }

            input IProductConnectWhere {
              node: IProductWhere!
            }

            input IProductCreateInput {
              Movie: MovieCreateInput
              Series: SeriesCreateInput
            }

            input IProductDeleteInput {
              genre: IProductGenreDeleteFieldInput
            }

            input IProductDisconnectInput {
              genre: IProductGenreDisconnectFieldInput
            }

            type IProductEdge {
              cursor: String!
              node: IProduct!
            }

            interface IProductEventPayload {
              id: String!
              name: String!
            }

            input IProductGenreAggregateInput {
              AND: [IProductGenreAggregateInput!]
              NOT: IProductGenreAggregateInput
              OR: [IProductGenreAggregateInput!]
              count: Int
              count_GT: Int
              count_GTE: Int
              count_LT: Int
              count_LTE: Int
              edge: IProductGenreEdgeAggregationWhereInput
              node: IProductGenreNodeAggregationWhereInput
            }

            input IProductGenreConnectFieldInput {
              connect: GenreConnectInput
              edge: IProductGenreEdgeCreateInput!
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
              edge: IProductGenreEdgeCreateInput!
              node: GenreOnCreateInput!
            }

            type IProductGenreConnection {
              edges: [IProductGenreRelationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input IProductGenreConnectionSort {
              edge: IProductGenreEdgeSort
              node: GenreSort
            }

            input IProductGenreConnectionWhere {
              AND: [IProductGenreConnectionWhere!]
              NOT: IProductGenreConnectionWhere
              OR: [IProductGenreConnectionWhere!]
              edge: IProductGenreEdgeWhere
              edge_NOT: IProductGenreEdgeWhere @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              node: GenreWhere
              node_NOT: GenreWhere @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
            }

            input IProductGenreCreateFieldInput {
              edge: IProductGenreEdgeCreateInput!
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

            input IProductGenreEdgeAggregationWhereInput {
              \\"\\"\\"
              Relationship properties when source node is of type:
              * Movie
              \\"\\"\\"
              MovieProps: MoviePropsAggregationWhereInput
              \\"\\"\\"
              Relationship properties when source node is of type:
              * Series
              \\"\\"\\"
              SeriesProps: SeriesPropsAggregationWhereInput
            }

            input IProductGenreEdgeCreateInput {
              \\"\\"\\"
              Relationship properties when source node is of type:
              * Movie
              \\"\\"\\"
              MovieProps: MoviePropsCreateInput!
              \\"\\"\\"
              Relationship properties when source node is of type:
              * Series
              \\"\\"\\"
              SeriesProps: SeriesPropsCreateInput
            }

            input IProductGenreEdgeSort {
              \\"\\"\\"
              Relationship properties when source node is of type:
              * Movie
              \\"\\"\\"
              MovieProps: MoviePropsSort
              \\"\\"\\"
              Relationship properties when source node is of type:
              * Series
              \\"\\"\\"
              SeriesProps: SeriesPropsSort
            }

            input IProductGenreEdgeUpdateInput {
              \\"\\"\\"
              Relationship properties when source node is of type:
              * Movie
              \\"\\"\\"
              MovieProps: MoviePropsUpdateInput
              \\"\\"\\"
              Relationship properties when source node is of type:
              * Series
              \\"\\"\\"
              SeriesProps: SeriesPropsUpdateInput
            }

            input IProductGenreEdgeWhere {
              \\"\\"\\"
              Relationship properties when source node is of type:
              * Movie
              \\"\\"\\"
              MovieProps: MoviePropsWhere
              \\"\\"\\"
              Relationship properties when source node is of type:
              * Series
              \\"\\"\\"
              SeriesProps: SeriesPropsWhere
            }

            input IProductGenreNodeAggregationWhereInput {
              AND: [IProductGenreNodeAggregationWhereInput!]
              NOT: IProductGenreNodeAggregationWhereInput
              OR: [IProductGenreNodeAggregationWhereInput!]
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

            type IProductGenreRelationship {
              cursor: String!
              node: Genre!
              properties: IProductGenreRelationshipProperties!
            }

            union IProductGenreRelationshipProperties = MovieProps | SeriesProps

            input IProductGenreUpdateConnectionInput {
              edge: IProductGenreEdgeUpdateInput
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

            enum IProductImplementation {
              Movie
              Series
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
              typename_IN: [IProductImplementation!]
            }

            input IProductUpdateInput {
              genre: IProductGenreUpdateFieldInput
              id: String
              name: String
            }

            input IProductWhere {
              AND: [IProductWhere!]
              NOT: IProductWhere
              OR: [IProductWhere!]
              genre: GenreWhere
              genreAggregate: IProductGenreAggregateInput
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
              typename_IN: [IProductImplementation!]
            }

            type IProductsConnection {
              edges: [IProductEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            type IntAggregateSelection {
              average: Float
              max: Int
              min: Int
              sum: Int
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
              id: StringAggregateSelection!
              name: StringAggregateSelection!
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
              edge: MoviePropsAggregationWhereInput
              node: MovieGenreNodeAggregationWhereInput
            }

            input MovieGenreConnectFieldInput {
              connect: GenreConnectInput
              edge: MoviePropsCreateInput!
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
              edge: MoviePropsCreateInput!
              node: GenreOnCreateInput!
            }

            type MovieGenreConnectedRelationship {
              node: GenreEventPayload!
              year: Int!
            }

            input MovieGenreCreateFieldInput {
              edge: MoviePropsCreateInput!
              node: GenreCreateInput!
            }

            input MovieGenreFieldInput {
              connect: MovieGenreConnectFieldInput
              connectOrCreate: MovieGenreConnectOrCreateFieldInput
              create: MovieGenreCreateFieldInput
            }

            type MovieGenreGenreAggregationSelection {
              count: Int!
              edge: MovieGenreGenreEdgeAggregateSelection
              node: MovieGenreGenreNodeAggregateSelection
            }

            type MovieGenreGenreEdgeAggregateSelection {
              year: IntAggregateSelection!
            }

            type MovieGenreGenreNodeAggregateSelection {
              name: StringAggregateSelection!
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
              edge: MoviePropsSubscriptionWhere
              node: GenreSubscriptionWhere
            }

            input MovieGenreUpdateConnectionInput {
              edge: MoviePropsUpdateInput
              node: GenreUpdateInput
            }

            input MovieGenreUpdateFieldInput {
              connect: MovieGenreConnectFieldInput
              connectOrCreate: MovieGenreConnectOrCreateFieldInput
              create: MovieGenreCreateFieldInput
              delete: IProductGenreDeleteFieldInput
              disconnect: IProductGenreDisconnectFieldInput
              update: MovieGenreUpdateConnectionInput
              where: IProductGenreConnectionWhere
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
            The edge properties for the following fields:
            * Movie.genre
            \\"\\"\\"
            type MovieProps {
              year: Int!
            }

            input MoviePropsAggregationWhereInput {
              AND: [MoviePropsAggregationWhereInput!]
              NOT: MoviePropsAggregationWhereInput
              OR: [MoviePropsAggregationWhereInput!]
              year_AVERAGE_EQUAL: Float
              year_AVERAGE_GT: Float
              year_AVERAGE_GTE: Float
              year_AVERAGE_LT: Float
              year_AVERAGE_LTE: Float
              year_EQUAL: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              year_GT: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              year_GTE: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              year_LT: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              year_LTE: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              year_MAX_EQUAL: Int
              year_MAX_GT: Int
              year_MAX_GTE: Int
              year_MAX_LT: Int
              year_MAX_LTE: Int
              year_MIN_EQUAL: Int
              year_MIN_GT: Int
              year_MIN_GTE: Int
              year_MIN_LT: Int
              year_MIN_LTE: Int
              year_SUM_EQUAL: Int
              year_SUM_GT: Int
              year_SUM_GTE: Int
              year_SUM_LT: Int
              year_SUM_LTE: Int
            }

            input MoviePropsCreateInput {
              year: Int!
            }

            input MoviePropsSort {
              year: SortDirection
            }

            input MoviePropsSubscriptionWhere {
              AND: [MoviePropsSubscriptionWhere!]
              NOT: MoviePropsSubscriptionWhere
              OR: [MoviePropsSubscriptionWhere!]
              year: Int
              year_GT: Int
              year_GTE: Int
              year_IN: [Int!]
              year_LT: Int
              year_LTE: Int
              year_NOT: Int @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              year_NOT_IN: [Int!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
            }

            input MoviePropsUpdateInput {
              year: Int
              year_DECREMENT: Int
              year_INCREMENT: Int
            }

            input MoviePropsWhere {
              AND: [MoviePropsWhere!]
              NOT: MoviePropsWhere
              OR: [MoviePropsWhere!]
              year: Int
              year_GT: Int
              year_GTE: Int
              year_IN: [Int!]
              year_LT: Int
              year_LTE: Int
              year_NOT: Int @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              year_NOT_IN: [Int!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
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
              iProducts(options: IProductOptions, where: IProductWhere): [IProduct!]!
              iProductsAggregate(where: IProductWhere): IProductAggregateSelection!
              iProductsConnection(after: String, first: Int, sort: [IProductSort], where: IProductWhere): IProductsConnection!
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
              id: StringAggregateSelection!
              name: StringAggregateSelection!
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
              edge: SeriesPropsAggregationWhereInput
              node: SeriesGenreNodeAggregationWhereInput
            }

            input SeriesGenreConnectFieldInput {
              connect: GenreConnectInput
              edge: SeriesPropsCreateInput
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
              edge: SeriesPropsCreateInput
              node: GenreOnCreateInput!
            }

            type SeriesGenreConnectedRelationship {
              episodes: Int
              node: GenreEventPayload!
            }

            input SeriesGenreCreateFieldInput {
              edge: SeriesPropsCreateInput
              node: GenreCreateInput!
            }

            input SeriesGenreFieldInput {
              connect: SeriesGenreConnectFieldInput
              connectOrCreate: SeriesGenreConnectOrCreateFieldInput
              create: SeriesGenreCreateFieldInput
            }

            type SeriesGenreGenreAggregationSelection {
              count: Int!
              edge: SeriesGenreGenreEdgeAggregateSelection
              node: SeriesGenreGenreNodeAggregateSelection
            }

            type SeriesGenreGenreEdgeAggregateSelection {
              episodes: IntAggregateSelection!
            }

            type SeriesGenreGenreNodeAggregateSelection {
              name: StringAggregateSelection!
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
              edge: SeriesPropsSubscriptionWhere
              node: GenreSubscriptionWhere
            }

            input SeriesGenreUpdateConnectionInput {
              edge: SeriesPropsUpdateInput
              node: GenreUpdateInput
            }

            input SeriesGenreUpdateFieldInput {
              connect: SeriesGenreConnectFieldInput
              connectOrCreate: SeriesGenreConnectOrCreateFieldInput
              create: SeriesGenreCreateFieldInput
              delete: IProductGenreDeleteFieldInput
              disconnect: IProductGenreDisconnectFieldInput
              update: SeriesGenreUpdateConnectionInput
              where: IProductGenreConnectionWhere
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
            The edge properties for the following fields:
            * Series.genre
            \\"\\"\\"
            type SeriesProps {
              episodes: Int
            }

            input SeriesPropsAggregationWhereInput {
              AND: [SeriesPropsAggregationWhereInput!]
              NOT: SeriesPropsAggregationWhereInput
              OR: [SeriesPropsAggregationWhereInput!]
              episodes_AVERAGE_EQUAL: Float
              episodes_AVERAGE_GT: Float
              episodes_AVERAGE_GTE: Float
              episodes_AVERAGE_LT: Float
              episodes_AVERAGE_LTE: Float
              episodes_EQUAL: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              episodes_GT: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              episodes_GTE: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              episodes_LT: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              episodes_LTE: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              episodes_MAX_EQUAL: Int
              episodes_MAX_GT: Int
              episodes_MAX_GTE: Int
              episodes_MAX_LT: Int
              episodes_MAX_LTE: Int
              episodes_MIN_EQUAL: Int
              episodes_MIN_GT: Int
              episodes_MIN_GTE: Int
              episodes_MIN_LT: Int
              episodes_MIN_LTE: Int
              episodes_SUM_EQUAL: Int
              episodes_SUM_GT: Int
              episodes_SUM_GTE: Int
              episodes_SUM_LT: Int
              episodes_SUM_LTE: Int
            }

            input SeriesPropsCreateInput {
              episodes: Int
            }

            input SeriesPropsSort {
              episodes: SortDirection
            }

            input SeriesPropsSubscriptionWhere {
              AND: [SeriesPropsSubscriptionWhere!]
              NOT: SeriesPropsSubscriptionWhere
              OR: [SeriesPropsSubscriptionWhere!]
              episodes: Int
              episodes_GT: Int
              episodes_GTE: Int
              episodes_IN: [Int]
              episodes_LT: Int
              episodes_LTE: Int
              episodes_NOT: Int @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              episodes_NOT_IN: [Int] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
            }

            input SeriesPropsUpdateInput {
              episodes: Int
              episodes_DECREMENT: Int
              episodes_INCREMENT: Int
            }

            input SeriesPropsWhere {
              AND: [SeriesPropsWhere!]
              NOT: SeriesPropsWhere
              OR: [SeriesPropsWhere!]
              episodes: Int
              episodes_GT: Int
              episodes_GTE: Int
              episodes_IN: [Int]
              episodes_LT: Int
              episodes_LTE: Int
              episodes_NOT: Int @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              episodes_NOT_IN: [Int] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
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

            \\"\\"\\"
            Information about the number of nodes and relationships created and deleted during an update mutation
            \\"\\"\\"
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

    test("Simple type definitions implementing just one interface - relationship to union type", async () => {
        const typeDefs = gql`
            interface IProduct {
                id: String!

                name: String!
                genre: UGenre! @declareRelationship
            }

            type Movie implements IProduct {
                id: String!

                name: String!
                genre: UGenre! @relationship(type: "HAS_GENRE", direction: OUT, properties: "MovieProps")
            }

            type Series implements IProduct {
                id: String!

                name: String!
                genre: UGenre! @relationship(type: "HAS_GENRE", direction: OUT, properties: "SeriesProps")
            }

            type MovieProps @relationshipProperties {
                year: Int!
            }

            type SeriesProps @relationshipProperties {
                episodes: Int
            }

            union UGenre = Genre | Rating

            type Genre {
                name: String! @unique
                product: [IProduct!]! @relationship(type: "HAS_GENRE", direction: IN)
            }

            type Rating {
                number: Int! @unique
                product: [IProduct!]! @relationship(type: "HAS_RATING", direction: IN)
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

            \\"\\"\\"
            Information about the number of nodes and relationships created during a create mutation
            \\"\\"\\"
            type CreateInfo {
              bookmark: String @deprecated(reason: \\"This field has been deprecated because bookmarks are now handled by the driver.\\")
              nodesCreated: Int!
              relationshipsCreated: Int!
            }

            type CreateMoviesMutationResponse {
              info: CreateInfo!
              movies: [Movie!]!
            }

            type CreateRatingsMutationResponse {
              info: CreateInfo!
              ratings: [Rating!]!
            }

            type CreateSeriesMutationResponse {
              info: CreateInfo!
              series: [Series!]!
            }

            \\"\\"\\"
            Information about the number of nodes and relationships deleted during a delete mutation
            \\"\\"\\"
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
              productAggregate(directed: Boolean = true, where: IProductWhere): GenreIProductProductAggregationSelection
              productConnection(after: String, directed: Boolean = true, first: Int, sort: [GenreProductConnectionSort!], where: GenreProductConnectionWhere): GenreProductConnection!
            }

            type GenreAggregateSelection {
              count: Int!
              name: StringAggregateSelection!
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

            type GenreIProductProductAggregationSelection {
              count: Int!
              node: GenreIProductProductNodeAggregateSelection
            }

            type GenreIProductProductNodeAggregateSelection {
              id: StringAggregateSelection!
              name: StringAggregateSelection!
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

            input GenreProductAggregateInput {
              AND: [GenreProductAggregateInput!]
              NOT: GenreProductAggregateInput
              OR: [GenreProductAggregateInput!]
              count: Int
              count_GT: Int
              count_GTE: Int
              count_LT: Int
              count_LTE: Int
              node: GenreProductNodeAggregationWhereInput
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

            input GenreProductNodeAggregationWhereInput {
              AND: [GenreProductNodeAggregationWhereInput!]
              NOT: GenreProductNodeAggregationWhereInput
              OR: [GenreProductNodeAggregationWhereInput!]
              id_AVERAGE_EQUAL: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              id_AVERAGE_GT: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              id_AVERAGE_GTE: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              id_AVERAGE_LENGTH_EQUAL: Float
              id_AVERAGE_LENGTH_GT: Float
              id_AVERAGE_LENGTH_GTE: Float
              id_AVERAGE_LENGTH_LT: Float
              id_AVERAGE_LENGTH_LTE: Float
              id_AVERAGE_LT: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              id_AVERAGE_LTE: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              id_EQUAL: String @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              id_GT: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              id_GTE: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              id_LONGEST_EQUAL: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              id_LONGEST_GT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              id_LONGEST_GTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              id_LONGEST_LENGTH_EQUAL: Int
              id_LONGEST_LENGTH_GT: Int
              id_LONGEST_LENGTH_GTE: Int
              id_LONGEST_LENGTH_LT: Int
              id_LONGEST_LENGTH_LTE: Int
              id_LONGEST_LT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              id_LONGEST_LTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              id_LT: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              id_LTE: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              id_SHORTEST_EQUAL: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              id_SHORTEST_GT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              id_SHORTEST_GTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              id_SHORTEST_LENGTH_EQUAL: Int
              id_SHORTEST_LENGTH_GT: Int
              id_SHORTEST_LENGTH_GTE: Int
              id_SHORTEST_LENGTH_LT: Int
              id_SHORTEST_LENGTH_LTE: Int
              id_SHORTEST_LT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              id_SHORTEST_LTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
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
              name_IN: [String!]
              name_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              name_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              name_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              name_NOT_IN: [String!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
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
              product: IProductWhere @deprecated(reason: \\"Use \`product_SOME\` instead.\\")
              productAggregate: GenreProductAggregateInput
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
              \\"\\"\\"Return Genres where all of the related IProducts match this filter\\"\\"\\"
              product_ALL: IProductWhere
              \\"\\"\\"Return Genres where none of the related IProducts match this filter\\"\\"\\"
              product_NONE: IProductWhere
              product_NOT: IProductWhere @deprecated(reason: \\"Use \`product_NONE\` instead.\\")
              \\"\\"\\"Return Genres where one of the related IProducts match this filter\\"\\"\\"
              product_SINGLE: IProductWhere
              \\"\\"\\"Return Genres where some of the related IProducts match this filter\\"\\"\\"
              product_SOME: IProductWhere
            }

            type GenresConnection {
              edges: [GenreEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            interface IProduct {
              genre(options: QueryOptions, where: UGenreWhere): UGenre!
              genreConnection(after: String, first: Int, sort: [IProductGenreConnectionSort!], where: IProductGenreConnectionWhere): IProductGenreConnection!
              id: String!
              name: String!
            }

            type IProductAggregateSelection {
              count: Int!
              id: StringAggregateSelection!
              name: StringAggregateSelection!
            }

            input IProductConnectInput {
              genre: IProductGenreConnectInput
            }

            input IProductConnectWhere {
              node: IProductWhere!
            }

            input IProductCreateInput {
              Movie: MovieCreateInput
              Series: SeriesCreateInput
            }

            input IProductDeleteInput {
              genre: IProductGenreDeleteInput
            }

            input IProductDisconnectInput {
              genre: IProductGenreDisconnectInput
            }

            type IProductEdge {
              cursor: String!
              node: IProduct!
            }

            interface IProductEventPayload {
              id: String!
              name: String!
            }

            input IProductGenreConnectInput {
              Genre: IProductGenreGenreConnectFieldInput
              Rating: IProductGenreRatingConnectFieldInput
            }

            type IProductGenreConnection {
              edges: [IProductGenreRelationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input IProductGenreConnectionSort {
              edge: IProductGenreEdgeSort
            }

            input IProductGenreConnectionWhere {
              Genre: IProductGenreGenreConnectionWhere
              Rating: IProductGenreRatingConnectionWhere
            }

            input IProductGenreDeleteInput {
              Genre: IProductGenreGenreDeleteFieldInput
              Rating: IProductGenreRatingDeleteFieldInput
            }

            input IProductGenreDisconnectInput {
              Genre: IProductGenreGenreDisconnectFieldInput
              Rating: IProductGenreRatingDisconnectFieldInput
            }

            input IProductGenreEdgeCreateInput {
              \\"\\"\\"
              Relationship properties when source node is of type:
              * Movie
              \\"\\"\\"
              MovieProps: MoviePropsCreateInput!
              \\"\\"\\"
              Relationship properties when source node is of type:
              * Series
              \\"\\"\\"
              SeriesProps: SeriesPropsCreateInput
            }

            input IProductGenreEdgeSort {
              \\"\\"\\"
              Relationship properties when source node is of type:
              * Movie
              \\"\\"\\"
              MovieProps: MoviePropsSort
              \\"\\"\\"
              Relationship properties when source node is of type:
              * Series
              \\"\\"\\"
              SeriesProps: SeriesPropsSort
            }

            input IProductGenreEdgeUpdateInput {
              \\"\\"\\"
              Relationship properties when source node is of type:
              * Movie
              \\"\\"\\"
              MovieProps: MoviePropsUpdateInput
              \\"\\"\\"
              Relationship properties when source node is of type:
              * Series
              \\"\\"\\"
              SeriesProps: SeriesPropsUpdateInput
            }

            input IProductGenreEdgeWhere {
              \\"\\"\\"
              Relationship properties when source node is of type:
              * Movie
              \\"\\"\\"
              MovieProps: MoviePropsWhere
              \\"\\"\\"
              Relationship properties when source node is of type:
              * Series
              \\"\\"\\"
              SeriesProps: SeriesPropsWhere
            }

            input IProductGenreGenreConnectFieldInput {
              connect: GenreConnectInput
              edge: IProductGenreEdgeCreateInput!
              where: GenreConnectWhere
            }

            input IProductGenreGenreConnectOrCreateFieldInput {
              onCreate: IProductGenreGenreConnectOrCreateFieldInputOnCreate!
              where: GenreConnectOrCreateWhere!
            }

            input IProductGenreGenreConnectOrCreateFieldInputOnCreate {
              edge: IProductGenreEdgeCreateInput!
              node: GenreOnCreateInput!
            }

            input IProductGenreGenreConnectionWhere {
              AND: [IProductGenreGenreConnectionWhere!]
              NOT: IProductGenreGenreConnectionWhere
              OR: [IProductGenreGenreConnectionWhere!]
              edge: IProductGenreEdgeWhere
              edge_NOT: IProductGenreEdgeWhere @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              node: GenreWhere
              node_NOT: GenreWhere @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
            }

            input IProductGenreGenreCreateFieldInput {
              edge: IProductGenreEdgeCreateInput!
              node: GenreCreateInput!
            }

            input IProductGenreGenreDeleteFieldInput {
              delete: GenreDeleteInput
              where: IProductGenreGenreConnectionWhere
            }

            input IProductGenreGenreDisconnectFieldInput {
              disconnect: GenreDisconnectInput
              where: IProductGenreGenreConnectionWhere
            }

            input IProductGenreGenreUpdateConnectionInput {
              edge: IProductGenreEdgeUpdateInput
              node: GenreUpdateInput
            }

            input IProductGenreGenreUpdateFieldInput {
              connect: IProductGenreGenreConnectFieldInput
              connectOrCreate: IProductGenreGenreConnectOrCreateFieldInput
              create: IProductGenreGenreCreateFieldInput
              delete: IProductGenreGenreDeleteFieldInput
              disconnect: IProductGenreGenreDisconnectFieldInput
              update: IProductGenreGenreUpdateConnectionInput
              where: IProductGenreGenreConnectionWhere
            }

            input IProductGenreRatingConnectFieldInput {
              connect: RatingConnectInput
              edge: IProductGenreEdgeCreateInput!
              where: RatingConnectWhere
            }

            input IProductGenreRatingConnectOrCreateFieldInput {
              onCreate: IProductGenreRatingConnectOrCreateFieldInputOnCreate!
              where: RatingConnectOrCreateWhere!
            }

            input IProductGenreRatingConnectOrCreateFieldInputOnCreate {
              edge: IProductGenreEdgeCreateInput!
              node: RatingOnCreateInput!
            }

            input IProductGenreRatingConnectionWhere {
              AND: [IProductGenreRatingConnectionWhere!]
              NOT: IProductGenreRatingConnectionWhere
              OR: [IProductGenreRatingConnectionWhere!]
              edge: IProductGenreEdgeWhere
              edge_NOT: IProductGenreEdgeWhere @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              node: RatingWhere
              node_NOT: RatingWhere @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
            }

            input IProductGenreRatingCreateFieldInput {
              edge: IProductGenreEdgeCreateInput!
              node: RatingCreateInput!
            }

            input IProductGenreRatingDeleteFieldInput {
              delete: RatingDeleteInput
              where: IProductGenreRatingConnectionWhere
            }

            input IProductGenreRatingDisconnectFieldInput {
              disconnect: RatingDisconnectInput
              where: IProductGenreRatingConnectionWhere
            }

            input IProductGenreRatingUpdateConnectionInput {
              edge: IProductGenreEdgeUpdateInput
              node: RatingUpdateInput
            }

            input IProductGenreRatingUpdateFieldInput {
              connect: IProductGenreRatingConnectFieldInput
              connectOrCreate: IProductGenreRatingConnectOrCreateFieldInput
              create: IProductGenreRatingCreateFieldInput
              delete: IProductGenreRatingDeleteFieldInput
              disconnect: IProductGenreRatingDisconnectFieldInput
              update: IProductGenreRatingUpdateConnectionInput
              where: IProductGenreRatingConnectionWhere
            }

            type IProductGenreRelationship {
              cursor: String!
              node: UGenre!
              properties: IProductGenreRelationshipProperties!
            }

            union IProductGenreRelationshipProperties = MovieProps | SeriesProps

            input IProductGenreUpdateInput {
              Genre: IProductGenreGenreUpdateFieldInput
              Rating: IProductGenreRatingUpdateFieldInput
            }

            enum IProductImplementation {
              Movie
              Series
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
              typename_IN: [IProductImplementation!]
            }

            input IProductUpdateInput {
              genre: IProductGenreUpdateInput
              id: String
              name: String
            }

            input IProductWhere {
              AND: [IProductWhere!]
              NOT: IProductWhere
              OR: [IProductWhere!]
              genre: UGenreWhere
              genreConnection: IProductGenreConnectionWhere
              genreConnection_NOT: IProductGenreConnectionWhere
              genre_NOT: UGenreWhere
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
              typename_IN: [IProductImplementation!]
            }

            type IProductsConnection {
              edges: [IProductEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            type IntAggregateSelection {
              average: Float
              max: Int
              min: Int
              sum: Int
            }

            type Movie implements IProduct {
              genre(directed: Boolean = true, options: QueryOptions, where: UGenreWhere): UGenre!
              genreConnection(after: String, directed: Boolean = true, first: Int, sort: [IProductGenreConnectionSort!], where: IProductGenreConnectionWhere): IProductGenreConnection!
              id: String!
              name: String!
            }

            type MovieAggregateSelection {
              count: Int!
              id: StringAggregateSelection!
              name: StringAggregateSelection!
            }

            input MovieConnectInput {
              genre: MovieGenreConnectInput
            }

            input MovieConnectOrCreateInput {
              genre: MovieGenreConnectOrCreateInput
            }

            type MovieConnectedRelationships {
              genre: MovieGenreConnectedRelationship
            }

            input MovieCreateInput {
              genre: MovieGenreCreateInput
              id: String!
              name: String!
            }

            type MovieCreatedEvent {
              createdMovie: MovieEventPayload!
              event: EventType!
              timestamp: Float!
            }

            input MovieDeleteInput {
              genre: MovieGenreDeleteInput
            }

            type MovieDeletedEvent {
              deletedMovie: MovieEventPayload!
              event: EventType!
              timestamp: Float!
            }

            input MovieDisconnectInput {
              genre: MovieGenreDisconnectInput
            }

            type MovieEdge {
              cursor: String!
              node: Movie!
            }

            type MovieEventPayload implements IProductEventPayload {
              id: String!
              name: String!
            }

            input MovieGenreConnectInput {
              Genre: MovieGenreGenreConnectFieldInput
              Rating: MovieGenreRatingConnectFieldInput
            }

            input MovieGenreConnectOrCreateInput {
              Genre: MovieGenreGenreConnectOrCreateFieldInput
              Rating: MovieGenreRatingConnectOrCreateFieldInput
            }

            type MovieGenreConnectedRelationship {
              node: UGenreEventPayload!
              year: Int!
            }

            input MovieGenreCreateFieldInput {
              Genre: MovieGenreGenreCreateFieldInput
              Rating: MovieGenreRatingCreateFieldInput
            }

            input MovieGenreCreateInput {
              Genre: MovieGenreGenreFieldInput
              Rating: MovieGenreRatingFieldInput
            }

            input MovieGenreDeleteInput {
              Genre: IProductGenreGenreDeleteFieldInput
              Rating: IProductGenreRatingDeleteFieldInput
            }

            input MovieGenreDisconnectInput {
              Genre: IProductGenreGenreDisconnectFieldInput
              Rating: IProductGenreRatingDisconnectFieldInput
            }

            input MovieGenreGenreConnectFieldInput {
              connect: GenreConnectInput
              edge: MoviePropsCreateInput!
              where: GenreConnectWhere
            }

            input MovieGenreGenreConnectOrCreateFieldInput {
              onCreate: MovieGenreGenreConnectOrCreateFieldInputOnCreate!
              where: GenreConnectOrCreateWhere!
            }

            input MovieGenreGenreConnectOrCreateFieldInputOnCreate {
              edge: MoviePropsCreateInput!
              node: GenreOnCreateInput!
            }

            input MovieGenreGenreCreateFieldInput {
              edge: MoviePropsCreateInput!
              node: GenreCreateInput!
            }

            input MovieGenreGenreFieldInput {
              connect: MovieGenreGenreConnectFieldInput
              connectOrCreate: MovieGenreGenreConnectOrCreateFieldInput
              create: MovieGenreGenreCreateFieldInput
            }

            input MovieGenreGenreSubscriptionWhere {
              edge: MoviePropsSubscriptionWhere
              node: GenreSubscriptionWhere
            }

            input MovieGenreGenreUpdateConnectionInput {
              edge: MoviePropsUpdateInput
              node: GenreUpdateInput
            }

            input MovieGenreGenreUpdateFieldInput {
              connect: MovieGenreGenreConnectFieldInput
              connectOrCreate: MovieGenreGenreConnectOrCreateFieldInput
              create: MovieGenreGenreCreateFieldInput
              delete: IProductGenreGenreDeleteFieldInput
              disconnect: IProductGenreGenreDisconnectFieldInput
              update: MovieGenreGenreUpdateConnectionInput
              where: IProductGenreGenreConnectionWhere
            }

            input MovieGenreRatingConnectFieldInput {
              connect: RatingConnectInput
              edge: MoviePropsCreateInput!
              where: RatingConnectWhere
            }

            input MovieGenreRatingConnectOrCreateFieldInput {
              onCreate: MovieGenreRatingConnectOrCreateFieldInputOnCreate!
              where: RatingConnectOrCreateWhere!
            }

            input MovieGenreRatingConnectOrCreateFieldInputOnCreate {
              edge: MoviePropsCreateInput!
              node: RatingOnCreateInput!
            }

            input MovieGenreRatingCreateFieldInput {
              edge: MoviePropsCreateInput!
              node: RatingCreateInput!
            }

            input MovieGenreRatingFieldInput {
              connect: MovieGenreRatingConnectFieldInput
              connectOrCreate: MovieGenreRatingConnectOrCreateFieldInput
              create: MovieGenreRatingCreateFieldInput
            }

            input MovieGenreRatingSubscriptionWhere {
              edge: MoviePropsSubscriptionWhere
              node: RatingSubscriptionWhere
            }

            input MovieGenreRatingUpdateConnectionInput {
              edge: MoviePropsUpdateInput
              node: RatingUpdateInput
            }

            input MovieGenreRatingUpdateFieldInput {
              connect: MovieGenreRatingConnectFieldInput
              connectOrCreate: MovieGenreRatingConnectOrCreateFieldInput
              create: MovieGenreRatingCreateFieldInput
              delete: IProductGenreRatingDeleteFieldInput
              disconnect: IProductGenreRatingDisconnectFieldInput
              update: MovieGenreRatingUpdateConnectionInput
              where: IProductGenreRatingConnectionWhere
            }

            input MovieGenreRelationshipSubscriptionWhere {
              Genre: MovieGenreGenreSubscriptionWhere
              Rating: MovieGenreRatingSubscriptionWhere
            }

            input MovieGenreUpdateInput {
              Genre: MovieGenreGenreUpdateFieldInput
              Rating: MovieGenreRatingUpdateFieldInput
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
            The edge properties for the following fields:
            * Movie.genre
            \\"\\"\\"
            type MovieProps {
              year: Int!
            }

            input MoviePropsCreateInput {
              year: Int!
            }

            input MoviePropsSort {
              year: SortDirection
            }

            input MoviePropsSubscriptionWhere {
              AND: [MoviePropsSubscriptionWhere!]
              NOT: MoviePropsSubscriptionWhere
              OR: [MoviePropsSubscriptionWhere!]
              year: Int
              year_GT: Int
              year_GTE: Int
              year_IN: [Int!]
              year_LT: Int
              year_LTE: Int
              year_NOT: Int @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              year_NOT_IN: [Int!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
            }

            input MoviePropsUpdateInput {
              year: Int
              year_DECREMENT: Int
              year_INCREMENT: Int
            }

            input MoviePropsWhere {
              AND: [MoviePropsWhere!]
              NOT: MoviePropsWhere
              OR: [MoviePropsWhere!]
              year: Int
              year_GT: Int
              year_GTE: Int
              year_IN: [Int!]
              year_LT: Int
              year_LTE: Int
              year_NOT: Int @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              year_NOT_IN: [Int!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
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

            input MovieUpdateInput {
              genre: MovieGenreUpdateInput
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
              genre: UGenreWhere
              genreConnection: IProductGenreConnectionWhere
              genreConnection_NOT: IProductGenreConnectionWhere
              genre_NOT: UGenreWhere
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
              createRatings(input: [RatingCreateInput!]!): CreateRatingsMutationResponse!
              createSeries(input: [SeriesCreateInput!]!): CreateSeriesMutationResponse!
              deleteGenres(delete: GenreDeleteInput, where: GenreWhere): DeleteInfo!
              deleteMovies(delete: MovieDeleteInput, where: MovieWhere): DeleteInfo!
              deleteRatings(delete: RatingDeleteInput, where: RatingWhere): DeleteInfo!
              deleteSeries(delete: SeriesDeleteInput, where: SeriesWhere): DeleteInfo!
              updateGenres(connect: GenreConnectInput, create: GenreRelationInput, delete: GenreDeleteInput, disconnect: GenreDisconnectInput, update: GenreUpdateInput, where: GenreWhere): UpdateGenresMutationResponse!
              updateMovies(connect: MovieConnectInput, connectOrCreate: MovieConnectOrCreateInput, create: MovieRelationInput, delete: MovieDeleteInput, disconnect: MovieDisconnectInput, update: MovieUpdateInput, where: MovieWhere): UpdateMoviesMutationResponse!
              updateRatings(connect: RatingConnectInput, create: RatingRelationInput, delete: RatingDeleteInput, disconnect: RatingDisconnectInput, update: RatingUpdateInput, where: RatingWhere): UpdateRatingsMutationResponse!
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
              iProducts(options: IProductOptions, where: IProductWhere): [IProduct!]!
              iProductsAggregate(where: IProductWhere): IProductAggregateSelection!
              iProductsConnection(after: String, first: Int, sort: [IProductSort], where: IProductWhere): IProductsConnection!
              movies(options: MovieOptions, where: MovieWhere): [Movie!]!
              moviesAggregate(where: MovieWhere): MovieAggregateSelection!
              moviesConnection(after: String, first: Int, sort: [MovieSort], where: MovieWhere): MoviesConnection!
              ratings(options: RatingOptions, where: RatingWhere): [Rating!]!
              ratingsAggregate(where: RatingWhere): RatingAggregateSelection!
              ratingsConnection(after: String, first: Int, sort: [RatingSort], where: RatingWhere): RatingsConnection!
              series(options: SeriesOptions, where: SeriesWhere): [Series!]!
              seriesAggregate(where: SeriesWhere): SeriesAggregateSelection!
              seriesConnection(after: String, first: Int, sort: [SeriesSort], where: SeriesWhere): SeriesConnection!
              uGenres(options: QueryOptions, where: UGenreWhere): [UGenre!]!
            }

            \\"\\"\\"Input type for options that can be specified on a query operation.\\"\\"\\"
            input QueryOptions {
              limit: Int
              offset: Int
            }

            type Rating {
              number: Int!
              product(directed: Boolean = true, options: IProductOptions, where: IProductWhere): [IProduct!]!
              productAggregate(directed: Boolean = true, where: IProductWhere): RatingIProductProductAggregationSelection
              productConnection(after: String, directed: Boolean = true, first: Int, sort: [RatingProductConnectionSort!], where: RatingProductConnectionWhere): RatingProductConnection!
            }

            type RatingAggregateSelection {
              count: Int!
              number: IntAggregateSelection!
            }

            input RatingConnectInput {
              product: [RatingProductConnectFieldInput!]
            }

            input RatingConnectOrCreateWhere {
              node: RatingUniqueWhere!
            }

            input RatingConnectWhere {
              node: RatingWhere!
            }

            type RatingConnectedRelationships {
              product: RatingProductConnectedRelationship
            }

            input RatingCreateInput {
              number: Int!
              product: RatingProductFieldInput
            }

            type RatingCreatedEvent {
              createdRating: RatingEventPayload!
              event: EventType!
              timestamp: Float!
            }

            input RatingDeleteInput {
              product: [RatingProductDeleteFieldInput!]
            }

            type RatingDeletedEvent {
              deletedRating: RatingEventPayload!
              event: EventType!
              timestamp: Float!
            }

            input RatingDisconnectInput {
              product: [RatingProductDisconnectFieldInput!]
            }

            type RatingEdge {
              cursor: String!
              node: Rating!
            }

            type RatingEventPayload {
              number: Int!
            }

            type RatingIProductProductAggregationSelection {
              count: Int!
              node: RatingIProductProductNodeAggregateSelection
            }

            type RatingIProductProductNodeAggregateSelection {
              id: StringAggregateSelection!
              name: StringAggregateSelection!
            }

            input RatingOnCreateInput {
              number: Int!
            }

            input RatingOptions {
              limit: Int
              offset: Int
              \\"\\"\\"
              Specify one or more RatingSort objects to sort Ratings by. The sorts will be applied in the order in which they are arranged in the array.
              \\"\\"\\"
              sort: [RatingSort!]
            }

            input RatingProductAggregateInput {
              AND: [RatingProductAggregateInput!]
              NOT: RatingProductAggregateInput
              OR: [RatingProductAggregateInput!]
              count: Int
              count_GT: Int
              count_GTE: Int
              count_LT: Int
              count_LTE: Int
              node: RatingProductNodeAggregationWhereInput
            }

            input RatingProductConnectFieldInput {
              connect: IProductConnectInput
              where: IProductConnectWhere
            }

            type RatingProductConnectedRelationship {
              node: IProductEventPayload!
            }

            type RatingProductConnection {
              edges: [RatingProductRelationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input RatingProductConnectionSort {
              node: IProductSort
            }

            input RatingProductConnectionWhere {
              AND: [RatingProductConnectionWhere!]
              NOT: RatingProductConnectionWhere
              OR: [RatingProductConnectionWhere!]
              node: IProductWhere
              node_NOT: IProductWhere @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
            }

            input RatingProductCreateFieldInput {
              node: IProductCreateInput!
            }

            input RatingProductDeleteFieldInput {
              delete: IProductDeleteInput
              where: RatingProductConnectionWhere
            }

            input RatingProductDisconnectFieldInput {
              disconnect: IProductDisconnectInput
              where: RatingProductConnectionWhere
            }

            input RatingProductFieldInput {
              connect: [RatingProductConnectFieldInput!]
              create: [RatingProductCreateFieldInput!]
            }

            input RatingProductNodeAggregationWhereInput {
              AND: [RatingProductNodeAggregationWhereInput!]
              NOT: RatingProductNodeAggregationWhereInput
              OR: [RatingProductNodeAggregationWhereInput!]
              id_AVERAGE_EQUAL: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              id_AVERAGE_GT: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              id_AVERAGE_GTE: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              id_AVERAGE_LENGTH_EQUAL: Float
              id_AVERAGE_LENGTH_GT: Float
              id_AVERAGE_LENGTH_GTE: Float
              id_AVERAGE_LENGTH_LT: Float
              id_AVERAGE_LENGTH_LTE: Float
              id_AVERAGE_LT: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              id_AVERAGE_LTE: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              id_EQUAL: String @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              id_GT: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              id_GTE: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              id_LONGEST_EQUAL: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              id_LONGEST_GT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              id_LONGEST_GTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              id_LONGEST_LENGTH_EQUAL: Int
              id_LONGEST_LENGTH_GT: Int
              id_LONGEST_LENGTH_GTE: Int
              id_LONGEST_LENGTH_LT: Int
              id_LONGEST_LENGTH_LTE: Int
              id_LONGEST_LT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              id_LONGEST_LTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              id_LT: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              id_LTE: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              id_SHORTEST_EQUAL: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              id_SHORTEST_GT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              id_SHORTEST_GTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              id_SHORTEST_LENGTH_EQUAL: Int
              id_SHORTEST_LENGTH_GT: Int
              id_SHORTEST_LENGTH_GTE: Int
              id_SHORTEST_LENGTH_LT: Int
              id_SHORTEST_LENGTH_LTE: Int
              id_SHORTEST_LT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              id_SHORTEST_LTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
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

            type RatingProductRelationship {
              cursor: String!
              node: IProduct!
            }

            input RatingProductRelationshipSubscriptionWhere {
              node: IProductSubscriptionWhere
            }

            input RatingProductUpdateConnectionInput {
              node: IProductUpdateInput
            }

            input RatingProductUpdateFieldInput {
              connect: [RatingProductConnectFieldInput!]
              create: [RatingProductCreateFieldInput!]
              delete: [RatingProductDeleteFieldInput!]
              disconnect: [RatingProductDisconnectFieldInput!]
              update: RatingProductUpdateConnectionInput
              where: RatingProductConnectionWhere
            }

            input RatingRelationInput {
              product: [RatingProductCreateFieldInput!]
            }

            type RatingRelationshipCreatedEvent {
              createdRelationship: RatingConnectedRelationships!
              event: EventType!
              rating: RatingEventPayload!
              relationshipFieldName: String!
              timestamp: Float!
            }

            input RatingRelationshipCreatedSubscriptionWhere {
              AND: [RatingRelationshipCreatedSubscriptionWhere!]
              NOT: RatingRelationshipCreatedSubscriptionWhere
              OR: [RatingRelationshipCreatedSubscriptionWhere!]
              createdRelationship: RatingRelationshipsSubscriptionWhere
              rating: RatingSubscriptionWhere
            }

            type RatingRelationshipDeletedEvent {
              deletedRelationship: RatingConnectedRelationships!
              event: EventType!
              rating: RatingEventPayload!
              relationshipFieldName: String!
              timestamp: Float!
            }

            input RatingRelationshipDeletedSubscriptionWhere {
              AND: [RatingRelationshipDeletedSubscriptionWhere!]
              NOT: RatingRelationshipDeletedSubscriptionWhere
              OR: [RatingRelationshipDeletedSubscriptionWhere!]
              deletedRelationship: RatingRelationshipsSubscriptionWhere
              rating: RatingSubscriptionWhere
            }

            input RatingRelationshipsSubscriptionWhere {
              product: RatingProductRelationshipSubscriptionWhere
            }

            \\"\\"\\"
            Fields to sort Ratings by. The order in which sorts are applied is not guaranteed when specifying many fields in one RatingSort object.
            \\"\\"\\"
            input RatingSort {
              number: SortDirection
            }

            input RatingSubscriptionWhere {
              AND: [RatingSubscriptionWhere!]
              NOT: RatingSubscriptionWhere
              OR: [RatingSubscriptionWhere!]
              number: Int
              number_GT: Int
              number_GTE: Int
              number_IN: [Int!]
              number_LT: Int
              number_LTE: Int
              number_NOT: Int @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              number_NOT_IN: [Int!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
            }

            input RatingUniqueWhere {
              number: Int
            }

            input RatingUpdateInput {
              number: Int
              number_DECREMENT: Int
              number_INCREMENT: Int
              product: [RatingProductUpdateFieldInput!]
            }

            type RatingUpdatedEvent {
              event: EventType!
              previousState: RatingEventPayload!
              timestamp: Float!
              updatedRating: RatingEventPayload!
            }

            input RatingWhere {
              AND: [RatingWhere!]
              NOT: RatingWhere
              OR: [RatingWhere!]
              number: Int
              number_GT: Int
              number_GTE: Int
              number_IN: [Int!]
              number_LT: Int
              number_LTE: Int
              number_NOT: Int @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              number_NOT_IN: [Int!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              product: IProductWhere @deprecated(reason: \\"Use \`product_SOME\` instead.\\")
              productAggregate: RatingProductAggregateInput
              productConnection: RatingProductConnectionWhere @deprecated(reason: \\"Use \`productConnection_SOME\` instead.\\")
              \\"\\"\\"
              Return Ratings where all of the related RatingProductConnections match this filter
              \\"\\"\\"
              productConnection_ALL: RatingProductConnectionWhere
              \\"\\"\\"
              Return Ratings where none of the related RatingProductConnections match this filter
              \\"\\"\\"
              productConnection_NONE: RatingProductConnectionWhere
              productConnection_NOT: RatingProductConnectionWhere @deprecated(reason: \\"Use \`productConnection_NONE\` instead.\\")
              \\"\\"\\"
              Return Ratings where one of the related RatingProductConnections match this filter
              \\"\\"\\"
              productConnection_SINGLE: RatingProductConnectionWhere
              \\"\\"\\"
              Return Ratings where some of the related RatingProductConnections match this filter
              \\"\\"\\"
              productConnection_SOME: RatingProductConnectionWhere
              \\"\\"\\"Return Ratings where all of the related IProducts match this filter\\"\\"\\"
              product_ALL: IProductWhere
              \\"\\"\\"Return Ratings where none of the related IProducts match this filter\\"\\"\\"
              product_NONE: IProductWhere
              product_NOT: IProductWhere @deprecated(reason: \\"Use \`product_NONE\` instead.\\")
              \\"\\"\\"Return Ratings where one of the related IProducts match this filter\\"\\"\\"
              product_SINGLE: IProductWhere
              \\"\\"\\"Return Ratings where some of the related IProducts match this filter\\"\\"\\"
              product_SOME: IProductWhere
            }

            type RatingsConnection {
              edges: [RatingEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            type Series implements IProduct {
              genre(directed: Boolean = true, options: QueryOptions, where: UGenreWhere): UGenre!
              genreConnection(after: String, directed: Boolean = true, first: Int, sort: [IProductGenreConnectionSort!], where: IProductGenreConnectionWhere): IProductGenreConnection!
              id: String!
              name: String!
            }

            type SeriesAggregateSelection {
              count: Int!
              id: StringAggregateSelection!
              name: StringAggregateSelection!
            }

            input SeriesConnectInput {
              genre: SeriesGenreConnectInput
            }

            input SeriesConnectOrCreateInput {
              genre: SeriesGenreConnectOrCreateInput
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
              genre: SeriesGenreCreateInput
              id: String!
              name: String!
            }

            type SeriesCreatedEvent {
              createdSeries: SeriesEventPayload!
              event: EventType!
              timestamp: Float!
            }

            input SeriesDeleteInput {
              genre: SeriesGenreDeleteInput
            }

            type SeriesDeletedEvent {
              deletedSeries: SeriesEventPayload!
              event: EventType!
              timestamp: Float!
            }

            input SeriesDisconnectInput {
              genre: SeriesGenreDisconnectInput
            }

            type SeriesEdge {
              cursor: String!
              node: Series!
            }

            type SeriesEventPayload implements IProductEventPayload {
              id: String!
              name: String!
            }

            input SeriesGenreConnectInput {
              Genre: SeriesGenreGenreConnectFieldInput
              Rating: SeriesGenreRatingConnectFieldInput
            }

            input SeriesGenreConnectOrCreateInput {
              Genre: SeriesGenreGenreConnectOrCreateFieldInput
              Rating: SeriesGenreRatingConnectOrCreateFieldInput
            }

            type SeriesGenreConnectedRelationship {
              episodes: Int
              node: UGenreEventPayload!
            }

            input SeriesGenreCreateFieldInput {
              Genre: SeriesGenreGenreCreateFieldInput
              Rating: SeriesGenreRatingCreateFieldInput
            }

            input SeriesGenreCreateInput {
              Genre: SeriesGenreGenreFieldInput
              Rating: SeriesGenreRatingFieldInput
            }

            input SeriesGenreDeleteInput {
              Genre: IProductGenreGenreDeleteFieldInput
              Rating: IProductGenreRatingDeleteFieldInput
            }

            input SeriesGenreDisconnectInput {
              Genre: IProductGenreGenreDisconnectFieldInput
              Rating: IProductGenreRatingDisconnectFieldInput
            }

            input SeriesGenreGenreConnectFieldInput {
              connect: GenreConnectInput
              edge: SeriesPropsCreateInput
              where: GenreConnectWhere
            }

            input SeriesGenreGenreConnectOrCreateFieldInput {
              onCreate: SeriesGenreGenreConnectOrCreateFieldInputOnCreate!
              where: GenreConnectOrCreateWhere!
            }

            input SeriesGenreGenreConnectOrCreateFieldInputOnCreate {
              edge: SeriesPropsCreateInput
              node: GenreOnCreateInput!
            }

            input SeriesGenreGenreCreateFieldInput {
              edge: SeriesPropsCreateInput
              node: GenreCreateInput!
            }

            input SeriesGenreGenreFieldInput {
              connect: SeriesGenreGenreConnectFieldInput
              connectOrCreate: SeriesGenreGenreConnectOrCreateFieldInput
              create: SeriesGenreGenreCreateFieldInput
            }

            input SeriesGenreGenreSubscriptionWhere {
              edge: SeriesPropsSubscriptionWhere
              node: GenreSubscriptionWhere
            }

            input SeriesGenreGenreUpdateConnectionInput {
              edge: SeriesPropsUpdateInput
              node: GenreUpdateInput
            }

            input SeriesGenreGenreUpdateFieldInput {
              connect: SeriesGenreGenreConnectFieldInput
              connectOrCreate: SeriesGenreGenreConnectOrCreateFieldInput
              create: SeriesGenreGenreCreateFieldInput
              delete: IProductGenreGenreDeleteFieldInput
              disconnect: IProductGenreGenreDisconnectFieldInput
              update: SeriesGenreGenreUpdateConnectionInput
              where: IProductGenreGenreConnectionWhere
            }

            input SeriesGenreRatingConnectFieldInput {
              connect: RatingConnectInput
              edge: SeriesPropsCreateInput
              where: RatingConnectWhere
            }

            input SeriesGenreRatingConnectOrCreateFieldInput {
              onCreate: SeriesGenreRatingConnectOrCreateFieldInputOnCreate!
              where: RatingConnectOrCreateWhere!
            }

            input SeriesGenreRatingConnectOrCreateFieldInputOnCreate {
              edge: SeriesPropsCreateInput
              node: RatingOnCreateInput!
            }

            input SeriesGenreRatingCreateFieldInput {
              edge: SeriesPropsCreateInput
              node: RatingCreateInput!
            }

            input SeriesGenreRatingFieldInput {
              connect: SeriesGenreRatingConnectFieldInput
              connectOrCreate: SeriesGenreRatingConnectOrCreateFieldInput
              create: SeriesGenreRatingCreateFieldInput
            }

            input SeriesGenreRatingSubscriptionWhere {
              edge: SeriesPropsSubscriptionWhere
              node: RatingSubscriptionWhere
            }

            input SeriesGenreRatingUpdateConnectionInput {
              edge: SeriesPropsUpdateInput
              node: RatingUpdateInput
            }

            input SeriesGenreRatingUpdateFieldInput {
              connect: SeriesGenreRatingConnectFieldInput
              connectOrCreate: SeriesGenreRatingConnectOrCreateFieldInput
              create: SeriesGenreRatingCreateFieldInput
              delete: IProductGenreRatingDeleteFieldInput
              disconnect: IProductGenreRatingDisconnectFieldInput
              update: SeriesGenreRatingUpdateConnectionInput
              where: IProductGenreRatingConnectionWhere
            }

            input SeriesGenreRelationshipSubscriptionWhere {
              Genre: SeriesGenreGenreSubscriptionWhere
              Rating: SeriesGenreRatingSubscriptionWhere
            }

            input SeriesGenreUpdateInput {
              Genre: SeriesGenreGenreUpdateFieldInput
              Rating: SeriesGenreRatingUpdateFieldInput
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
            The edge properties for the following fields:
            * Series.genre
            \\"\\"\\"
            type SeriesProps {
              episodes: Int
            }

            input SeriesPropsCreateInput {
              episodes: Int
            }

            input SeriesPropsSort {
              episodes: SortDirection
            }

            input SeriesPropsSubscriptionWhere {
              AND: [SeriesPropsSubscriptionWhere!]
              NOT: SeriesPropsSubscriptionWhere
              OR: [SeriesPropsSubscriptionWhere!]
              episodes: Int
              episodes_GT: Int
              episodes_GTE: Int
              episodes_IN: [Int]
              episodes_LT: Int
              episodes_LTE: Int
              episodes_NOT: Int @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              episodes_NOT_IN: [Int] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
            }

            input SeriesPropsUpdateInput {
              episodes: Int
              episodes_DECREMENT: Int
              episodes_INCREMENT: Int
            }

            input SeriesPropsWhere {
              AND: [SeriesPropsWhere!]
              NOT: SeriesPropsWhere
              OR: [SeriesPropsWhere!]
              episodes: Int
              episodes_GT: Int
              episodes_GTE: Int
              episodes_IN: [Int]
              episodes_LT: Int
              episodes_LTE: Int
              episodes_NOT: Int @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              episodes_NOT_IN: [Int] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
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

            input SeriesUpdateInput {
              genre: SeriesGenreUpdateInput
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
              genre: UGenreWhere
              genreConnection: IProductGenreConnectionWhere
              genreConnection_NOT: IProductGenreConnectionWhere
              genre_NOT: UGenreWhere
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
              ratingCreated(where: RatingSubscriptionWhere): RatingCreatedEvent!
              ratingDeleted(where: RatingSubscriptionWhere): RatingDeletedEvent!
              ratingRelationshipCreated(where: RatingRelationshipCreatedSubscriptionWhere): RatingRelationshipCreatedEvent!
              ratingRelationshipDeleted(where: RatingRelationshipDeletedSubscriptionWhere): RatingRelationshipDeletedEvent!
              ratingUpdated(where: RatingSubscriptionWhere): RatingUpdatedEvent!
              seriesCreated(where: SeriesSubscriptionWhere): SeriesCreatedEvent!
              seriesDeleted(where: SeriesSubscriptionWhere): SeriesDeletedEvent!
              seriesRelationshipCreated(where: SeriesRelationshipCreatedSubscriptionWhere): SeriesRelationshipCreatedEvent!
              seriesRelationshipDeleted(where: SeriesRelationshipDeletedSubscriptionWhere): SeriesRelationshipDeletedEvent!
              seriesUpdated(where: SeriesSubscriptionWhere): SeriesUpdatedEvent!
            }

            union UGenre = Genre | Rating

            union UGenreEventPayload = GenreEventPayload | RatingEventPayload

            input UGenreWhere {
              Genre: GenreWhere
              Rating: RatingWhere
            }

            type UpdateGenresMutationResponse {
              genres: [Genre!]!
              info: UpdateInfo!
            }

            \\"\\"\\"
            Information about the number of nodes and relationships created and deleted during an update mutation
            \\"\\"\\"
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

            type UpdateRatingsMutationResponse {
              info: UpdateInfo!
              ratings: [Rating!]!
            }

            type UpdateSeriesMutationResponse {
              info: UpdateInfo!
              series: [Series!]!
            }"
        `);
    });
});
