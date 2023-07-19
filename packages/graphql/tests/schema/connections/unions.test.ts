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
import { Neo4jGraphQL } from "../../../src";

describe("Unions", () => {
    test("Relationship Properties", async () => {
        const typeDefs = gql`
            union Publication = Book | Journal

            type Author {
                name: String!
                publications: [Publication!]! @relationship(type: "WROTE", direction: OUT, properties: "Wrote")
            }

            type Book {
                title: String!
                author: [Author!]! @relationship(type: "WROTE", direction: IN, properties: "Wrote")
            }

            type Journal {
                subject: String!
                author: [Author!]! @relationship(type: "WROTE", direction: IN, properties: "Wrote")
            }

            interface Wrote @relationshipProperties {
                words: Int!
            }
        `;
        const neoSchema = new Neo4jGraphQL({ typeDefs });
        const printedSchema = printSchemaWithDirectives(lexicographicSortSchema(await neoSchema.getSchema()));

        expect(printedSchema).toMatchInlineSnapshot(`
            "schema {
              query: Query
              mutation: Mutation
            }

            type Author {
              name: String!
              publications(directed: Boolean = true, options: QueryOptions, where: PublicationWhere): [Publication!]!
              publicationsConnection(after: String, directed: Boolean = true, first: Int, sort: [AuthorPublicationsConnectionSort!], where: AuthorPublicationsConnectionWhere): AuthorPublicationsConnection!
            }

            type AuthorAggregateSelection {
              count: Int!
              name: StringAggregateSelectionNonNullable!
            }

            input AuthorConnectInput {
              publications: AuthorPublicationsConnectInput
            }

            input AuthorConnectWhere {
              node: AuthorWhere!
            }

            input AuthorCreateInput {
              name: String!
              publications: AuthorPublicationsCreateInput
            }

            input AuthorDeleteInput {
              publications: AuthorPublicationsDeleteInput
            }

            input AuthorDisconnectInput {
              publications: AuthorPublicationsDisconnectInput
            }

            type AuthorEdge {
              cursor: String!
              node: Author!
            }

            input AuthorOptions {
              limit: Int
              offset: Int
              \\"\\"\\"
              Specify one or more AuthorSort objects to sort Authors by. The sorts will be applied in the order in which they are arranged in the array.
              \\"\\"\\"
              sort: [AuthorSort!]
            }

            input AuthorPublicationsBookConnectFieldInput {
              connect: [BookConnectInput!]
              edge: WroteCreateInput!
              where: BookConnectWhere
            }

            input AuthorPublicationsBookConnectionWhere {
              AND: [AuthorPublicationsBookConnectionWhere!]
              NOT: AuthorPublicationsBookConnectionWhere
              OR: [AuthorPublicationsBookConnectionWhere!]
              edge: WroteWhere
              edge_NOT: WroteWhere @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              node: BookWhere
              node_NOT: BookWhere @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
            }

            input AuthorPublicationsBookCreateFieldInput {
              edge: WroteCreateInput!
              node: BookCreateInput!
            }

            input AuthorPublicationsBookDeleteFieldInput {
              delete: BookDeleteInput
              where: AuthorPublicationsBookConnectionWhere
            }

            input AuthorPublicationsBookDisconnectFieldInput {
              disconnect: BookDisconnectInput
              where: AuthorPublicationsBookConnectionWhere
            }

            input AuthorPublicationsBookFieldInput {
              connect: [AuthorPublicationsBookConnectFieldInput!]
              create: [AuthorPublicationsBookCreateFieldInput!]
            }

            input AuthorPublicationsBookUpdateConnectionInput {
              edge: WroteUpdateInput
              node: BookUpdateInput
            }

            input AuthorPublicationsBookUpdateFieldInput {
              connect: [AuthorPublicationsBookConnectFieldInput!]
              create: [AuthorPublicationsBookCreateFieldInput!]
              delete: [AuthorPublicationsBookDeleteFieldInput!]
              disconnect: [AuthorPublicationsBookDisconnectFieldInput!]
              update: AuthorPublicationsBookUpdateConnectionInput
              where: AuthorPublicationsBookConnectionWhere
            }

            input AuthorPublicationsConnectInput {
              Book: [AuthorPublicationsBookConnectFieldInput!]
              Journal: [AuthorPublicationsJournalConnectFieldInput!]
            }

            type AuthorPublicationsConnection {
              edges: [AuthorPublicationsRelationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input AuthorPublicationsConnectionSort {
              edge: WroteSort
            }

            input AuthorPublicationsConnectionWhere {
              Book: AuthorPublicationsBookConnectionWhere
              Journal: AuthorPublicationsJournalConnectionWhere
            }

            input AuthorPublicationsCreateFieldInput {
              Book: [AuthorPublicationsBookCreateFieldInput!]
              Journal: [AuthorPublicationsJournalCreateFieldInput!]
            }

            input AuthorPublicationsCreateInput {
              Book: AuthorPublicationsBookFieldInput
              Journal: AuthorPublicationsJournalFieldInput
            }

            input AuthorPublicationsDeleteInput {
              Book: [AuthorPublicationsBookDeleteFieldInput!]
              Journal: [AuthorPublicationsJournalDeleteFieldInput!]
            }

            input AuthorPublicationsDisconnectInput {
              Book: [AuthorPublicationsBookDisconnectFieldInput!]
              Journal: [AuthorPublicationsJournalDisconnectFieldInput!]
            }

            input AuthorPublicationsJournalConnectFieldInput {
              connect: [JournalConnectInput!]
              edge: WroteCreateInput!
              where: JournalConnectWhere
            }

            input AuthorPublicationsJournalConnectionWhere {
              AND: [AuthorPublicationsJournalConnectionWhere!]
              NOT: AuthorPublicationsJournalConnectionWhere
              OR: [AuthorPublicationsJournalConnectionWhere!]
              edge: WroteWhere
              edge_NOT: WroteWhere @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              node: JournalWhere
              node_NOT: JournalWhere @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
            }

            input AuthorPublicationsJournalCreateFieldInput {
              edge: WroteCreateInput!
              node: JournalCreateInput!
            }

            input AuthorPublicationsJournalDeleteFieldInput {
              delete: JournalDeleteInput
              where: AuthorPublicationsJournalConnectionWhere
            }

            input AuthorPublicationsJournalDisconnectFieldInput {
              disconnect: JournalDisconnectInput
              where: AuthorPublicationsJournalConnectionWhere
            }

            input AuthorPublicationsJournalFieldInput {
              connect: [AuthorPublicationsJournalConnectFieldInput!]
              create: [AuthorPublicationsJournalCreateFieldInput!]
            }

            input AuthorPublicationsJournalUpdateConnectionInput {
              edge: WroteUpdateInput
              node: JournalUpdateInput
            }

            input AuthorPublicationsJournalUpdateFieldInput {
              connect: [AuthorPublicationsJournalConnectFieldInput!]
              create: [AuthorPublicationsJournalCreateFieldInput!]
              delete: [AuthorPublicationsJournalDeleteFieldInput!]
              disconnect: [AuthorPublicationsJournalDisconnectFieldInput!]
              update: AuthorPublicationsJournalUpdateConnectionInput
              where: AuthorPublicationsJournalConnectionWhere
            }

            type AuthorPublicationsRelationship implements Wrote {
              cursor: String!
              node: Publication!
              words: Int!
            }

            input AuthorPublicationsUpdateInput {
              Book: [AuthorPublicationsBookUpdateFieldInput!]
              Journal: [AuthorPublicationsJournalUpdateFieldInput!]
            }

            input AuthorRelationInput {
              publications: AuthorPublicationsCreateFieldInput
            }

            \\"\\"\\"
            Fields to sort Authors by. The order in which sorts are applied is not guaranteed when specifying many fields in one AuthorSort object.
            \\"\\"\\"
            input AuthorSort {
              name: SortDirection
            }

            input AuthorUpdateInput {
              name: String
              publications: AuthorPublicationsUpdateInput
            }

            input AuthorWhere {
              AND: [AuthorWhere!]
              NOT: AuthorWhere
              OR: [AuthorWhere!]
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
              publicationsConnection: AuthorPublicationsConnectionWhere @deprecated(reason: \\"Use \`publicationsConnection_SOME\` instead.\\")
              \\"\\"\\"
              Return Authors where all of the related AuthorPublicationsConnections match this filter
              \\"\\"\\"
              publicationsConnection_ALL: AuthorPublicationsConnectionWhere
              \\"\\"\\"
              Return Authors where none of the related AuthorPublicationsConnections match this filter
              \\"\\"\\"
              publicationsConnection_NONE: AuthorPublicationsConnectionWhere
              publicationsConnection_NOT: AuthorPublicationsConnectionWhere @deprecated(reason: \\"Use \`publicationsConnection_NONE\` instead.\\")
              \\"\\"\\"
              Return Authors where one of the related AuthorPublicationsConnections match this filter
              \\"\\"\\"
              publicationsConnection_SINGLE: AuthorPublicationsConnectionWhere
              \\"\\"\\"
              Return Authors where some of the related AuthorPublicationsConnections match this filter
              \\"\\"\\"
              publicationsConnection_SOME: AuthorPublicationsConnectionWhere
            }

            type AuthorsConnection {
              edges: [AuthorEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            type Book {
              author(directed: Boolean = true, options: AuthorOptions, where: AuthorWhere): [Author!]!
              authorAggregate(directed: Boolean = true, where: AuthorWhere): BookAuthorAuthorAggregationSelection
              authorConnection(after: String, directed: Boolean = true, first: Int, sort: [BookAuthorConnectionSort!], where: BookAuthorConnectionWhere): BookAuthorConnection!
              title: String!
            }

            type BookAggregateSelection {
              count: Int!
              title: StringAggregateSelectionNonNullable!
            }

            input BookAuthorAggregateInput {
              AND: [BookAuthorAggregateInput!]
              NOT: BookAuthorAggregateInput
              OR: [BookAuthorAggregateInput!]
              count: Int
              count_GT: Int
              count_GTE: Int
              count_LT: Int
              count_LTE: Int
              edge: BookAuthorEdgeAggregationWhereInput
              node: BookAuthorNodeAggregationWhereInput
            }

            type BookAuthorAuthorAggregationSelection {
              count: Int!
              edge: BookAuthorAuthorEdgeAggregateSelection
              node: BookAuthorAuthorNodeAggregateSelection
            }

            type BookAuthorAuthorEdgeAggregateSelection {
              words: IntAggregateSelectionNonNullable!
            }

            type BookAuthorAuthorNodeAggregateSelection {
              name: StringAggregateSelectionNonNullable!
            }

            input BookAuthorConnectFieldInput {
              connect: [AuthorConnectInput!]
              edge: WroteCreateInput!
              \\"\\"\\"
              Whether or not to overwrite any matching relationship with the new properties. Will default to \`false\` in 4.0.0.
              \\"\\"\\"
              overwrite: Boolean! = true
              where: AuthorConnectWhere
            }

            type BookAuthorConnection {
              edges: [BookAuthorRelationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input BookAuthorConnectionSort {
              edge: WroteSort
              node: AuthorSort
            }

            input BookAuthorConnectionWhere {
              AND: [BookAuthorConnectionWhere!]
              NOT: BookAuthorConnectionWhere
              OR: [BookAuthorConnectionWhere!]
              edge: WroteWhere
              edge_NOT: WroteWhere @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              node: AuthorWhere
              node_NOT: AuthorWhere @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
            }

            input BookAuthorCreateFieldInput {
              edge: WroteCreateInput!
              node: AuthorCreateInput!
            }

            input BookAuthorDeleteFieldInput {
              delete: AuthorDeleteInput
              where: BookAuthorConnectionWhere
            }

            input BookAuthorDisconnectFieldInput {
              disconnect: AuthorDisconnectInput
              where: BookAuthorConnectionWhere
            }

            input BookAuthorEdgeAggregationWhereInput {
              AND: [BookAuthorEdgeAggregationWhereInput!]
              NOT: BookAuthorEdgeAggregationWhereInput
              OR: [BookAuthorEdgeAggregationWhereInput!]
              words_AVERAGE_EQUAL: Float
              words_AVERAGE_GT: Float
              words_AVERAGE_GTE: Float
              words_AVERAGE_LT: Float
              words_AVERAGE_LTE: Float
              words_EQUAL: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              words_GT: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              words_GTE: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              words_LT: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              words_LTE: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              words_MAX_EQUAL: Int
              words_MAX_GT: Int
              words_MAX_GTE: Int
              words_MAX_LT: Int
              words_MAX_LTE: Int
              words_MIN_EQUAL: Int
              words_MIN_GT: Int
              words_MIN_GTE: Int
              words_MIN_LT: Int
              words_MIN_LTE: Int
              words_SUM_EQUAL: Int
              words_SUM_GT: Int
              words_SUM_GTE: Int
              words_SUM_LT: Int
              words_SUM_LTE: Int
            }

            input BookAuthorFieldInput {
              connect: [BookAuthorConnectFieldInput!]
              create: [BookAuthorCreateFieldInput!]
            }

            input BookAuthorNodeAggregationWhereInput {
              AND: [BookAuthorNodeAggregationWhereInput!]
              NOT: BookAuthorNodeAggregationWhereInput
              OR: [BookAuthorNodeAggregationWhereInput!]
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

            type BookAuthorRelationship implements Wrote {
              cursor: String!
              node: Author!
              words: Int!
            }

            input BookAuthorUpdateConnectionInput {
              edge: WroteUpdateInput
              node: AuthorUpdateInput
            }

            input BookAuthorUpdateFieldInput {
              connect: [BookAuthorConnectFieldInput!]
              create: [BookAuthorCreateFieldInput!]
              delete: [BookAuthorDeleteFieldInput!]
              disconnect: [BookAuthorDisconnectFieldInput!]
              update: BookAuthorUpdateConnectionInput
              where: BookAuthorConnectionWhere
            }

            input BookConnectInput {
              author: [BookAuthorConnectFieldInput!]
            }

            input BookConnectWhere {
              node: BookWhere!
            }

            input BookCreateInput {
              author: BookAuthorFieldInput
              title: String!
            }

            input BookDeleteInput {
              author: [BookAuthorDeleteFieldInput!]
            }

            input BookDisconnectInput {
              author: [BookAuthorDisconnectFieldInput!]
            }

            type BookEdge {
              cursor: String!
              node: Book!
            }

            input BookOptions {
              limit: Int
              offset: Int
              \\"\\"\\"
              Specify one or more BookSort objects to sort Books by. The sorts will be applied in the order in which they are arranged in the array.
              \\"\\"\\"
              sort: [BookSort!]
            }

            input BookRelationInput {
              author: [BookAuthorCreateFieldInput!]
            }

            \\"\\"\\"
            Fields to sort Books by. The order in which sorts are applied is not guaranteed when specifying many fields in one BookSort object.
            \\"\\"\\"
            input BookSort {
              title: SortDirection
            }

            input BookUpdateInput {
              author: [BookAuthorUpdateFieldInput!]
              title: String
            }

            input BookWhere {
              AND: [BookWhere!]
              NOT: BookWhere
              OR: [BookWhere!]
              author: AuthorWhere @deprecated(reason: \\"Use \`author_SOME\` instead.\\")
              authorAggregate: BookAuthorAggregateInput
              authorConnection: BookAuthorConnectionWhere @deprecated(reason: \\"Use \`authorConnection_SOME\` instead.\\")
              \\"\\"\\"
              Return Books where all of the related BookAuthorConnections match this filter
              \\"\\"\\"
              authorConnection_ALL: BookAuthorConnectionWhere
              \\"\\"\\"
              Return Books where none of the related BookAuthorConnections match this filter
              \\"\\"\\"
              authorConnection_NONE: BookAuthorConnectionWhere
              authorConnection_NOT: BookAuthorConnectionWhere @deprecated(reason: \\"Use \`authorConnection_NONE\` instead.\\")
              \\"\\"\\"
              Return Books where one of the related BookAuthorConnections match this filter
              \\"\\"\\"
              authorConnection_SINGLE: BookAuthorConnectionWhere
              \\"\\"\\"
              Return Books where some of the related BookAuthorConnections match this filter
              \\"\\"\\"
              authorConnection_SOME: BookAuthorConnectionWhere
              \\"\\"\\"Return Books where all of the related Authors match this filter\\"\\"\\"
              author_ALL: AuthorWhere
              \\"\\"\\"Return Books where none of the related Authors match this filter\\"\\"\\"
              author_NONE: AuthorWhere
              author_NOT: AuthorWhere @deprecated(reason: \\"Use \`author_NONE\` instead.\\")
              \\"\\"\\"Return Books where one of the related Authors match this filter\\"\\"\\"
              author_SINGLE: AuthorWhere
              \\"\\"\\"Return Books where some of the related Authors match this filter\\"\\"\\"
              author_SOME: AuthorWhere
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

            type BooksConnection {
              edges: [BookEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            type CreateAuthorsMutationResponse {
              authors: [Author!]!
              info: CreateInfo!
            }

            type CreateBooksMutationResponse {
              books: [Book!]!
              info: CreateInfo!
            }

            type CreateInfo {
              bookmark: String @deprecated(reason: \\"This field has been deprecated because bookmarks are now handled by the driver.\\")
              nodesCreated: Int!
              relationshipsCreated: Int!
            }

            type CreateJournalsMutationResponse {
              info: CreateInfo!
              journals: [Journal!]!
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

            type Journal {
              author(directed: Boolean = true, options: AuthorOptions, where: AuthorWhere): [Author!]!
              authorAggregate(directed: Boolean = true, where: AuthorWhere): JournalAuthorAuthorAggregationSelection
              authorConnection(after: String, directed: Boolean = true, first: Int, sort: [JournalAuthorConnectionSort!], where: JournalAuthorConnectionWhere): JournalAuthorConnection!
              subject: String!
            }

            type JournalAggregateSelection {
              count: Int!
              subject: StringAggregateSelectionNonNullable!
            }

            input JournalAuthorAggregateInput {
              AND: [JournalAuthorAggregateInput!]
              NOT: JournalAuthorAggregateInput
              OR: [JournalAuthorAggregateInput!]
              count: Int
              count_GT: Int
              count_GTE: Int
              count_LT: Int
              count_LTE: Int
              edge: JournalAuthorEdgeAggregationWhereInput
              node: JournalAuthorNodeAggregationWhereInput
            }

            type JournalAuthorAuthorAggregationSelection {
              count: Int!
              edge: JournalAuthorAuthorEdgeAggregateSelection
              node: JournalAuthorAuthorNodeAggregateSelection
            }

            type JournalAuthorAuthorEdgeAggregateSelection {
              words: IntAggregateSelectionNonNullable!
            }

            type JournalAuthorAuthorNodeAggregateSelection {
              name: StringAggregateSelectionNonNullable!
            }

            input JournalAuthorConnectFieldInput {
              connect: [AuthorConnectInput!]
              edge: WroteCreateInput!
              \\"\\"\\"
              Whether or not to overwrite any matching relationship with the new properties. Will default to \`false\` in 4.0.0.
              \\"\\"\\"
              overwrite: Boolean! = true
              where: AuthorConnectWhere
            }

            type JournalAuthorConnection {
              edges: [JournalAuthorRelationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input JournalAuthorConnectionSort {
              edge: WroteSort
              node: AuthorSort
            }

            input JournalAuthorConnectionWhere {
              AND: [JournalAuthorConnectionWhere!]
              NOT: JournalAuthorConnectionWhere
              OR: [JournalAuthorConnectionWhere!]
              edge: WroteWhere
              edge_NOT: WroteWhere @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              node: AuthorWhere
              node_NOT: AuthorWhere @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
            }

            input JournalAuthorCreateFieldInput {
              edge: WroteCreateInput!
              node: AuthorCreateInput!
            }

            input JournalAuthorDeleteFieldInput {
              delete: AuthorDeleteInput
              where: JournalAuthorConnectionWhere
            }

            input JournalAuthorDisconnectFieldInput {
              disconnect: AuthorDisconnectInput
              where: JournalAuthorConnectionWhere
            }

            input JournalAuthorEdgeAggregationWhereInput {
              AND: [JournalAuthorEdgeAggregationWhereInput!]
              NOT: JournalAuthorEdgeAggregationWhereInput
              OR: [JournalAuthorEdgeAggregationWhereInput!]
              words_AVERAGE_EQUAL: Float
              words_AVERAGE_GT: Float
              words_AVERAGE_GTE: Float
              words_AVERAGE_LT: Float
              words_AVERAGE_LTE: Float
              words_EQUAL: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              words_GT: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              words_GTE: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              words_LT: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              words_LTE: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              words_MAX_EQUAL: Int
              words_MAX_GT: Int
              words_MAX_GTE: Int
              words_MAX_LT: Int
              words_MAX_LTE: Int
              words_MIN_EQUAL: Int
              words_MIN_GT: Int
              words_MIN_GTE: Int
              words_MIN_LT: Int
              words_MIN_LTE: Int
              words_SUM_EQUAL: Int
              words_SUM_GT: Int
              words_SUM_GTE: Int
              words_SUM_LT: Int
              words_SUM_LTE: Int
            }

            input JournalAuthorFieldInput {
              connect: [JournalAuthorConnectFieldInput!]
              create: [JournalAuthorCreateFieldInput!]
            }

            input JournalAuthorNodeAggregationWhereInput {
              AND: [JournalAuthorNodeAggregationWhereInput!]
              NOT: JournalAuthorNodeAggregationWhereInput
              OR: [JournalAuthorNodeAggregationWhereInput!]
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

            type JournalAuthorRelationship implements Wrote {
              cursor: String!
              node: Author!
              words: Int!
            }

            input JournalAuthorUpdateConnectionInput {
              edge: WroteUpdateInput
              node: AuthorUpdateInput
            }

            input JournalAuthorUpdateFieldInput {
              connect: [JournalAuthorConnectFieldInput!]
              create: [JournalAuthorCreateFieldInput!]
              delete: [JournalAuthorDeleteFieldInput!]
              disconnect: [JournalAuthorDisconnectFieldInput!]
              update: JournalAuthorUpdateConnectionInput
              where: JournalAuthorConnectionWhere
            }

            input JournalConnectInput {
              author: [JournalAuthorConnectFieldInput!]
            }

            input JournalConnectWhere {
              node: JournalWhere!
            }

            input JournalCreateInput {
              author: JournalAuthorFieldInput
              subject: String!
            }

            input JournalDeleteInput {
              author: [JournalAuthorDeleteFieldInput!]
            }

            input JournalDisconnectInput {
              author: [JournalAuthorDisconnectFieldInput!]
            }

            type JournalEdge {
              cursor: String!
              node: Journal!
            }

            input JournalOptions {
              limit: Int
              offset: Int
              \\"\\"\\"
              Specify one or more JournalSort objects to sort Journals by. The sorts will be applied in the order in which they are arranged in the array.
              \\"\\"\\"
              sort: [JournalSort!]
            }

            input JournalRelationInput {
              author: [JournalAuthorCreateFieldInput!]
            }

            \\"\\"\\"
            Fields to sort Journals by. The order in which sorts are applied is not guaranteed when specifying many fields in one JournalSort object.
            \\"\\"\\"
            input JournalSort {
              subject: SortDirection
            }

            input JournalUpdateInput {
              author: [JournalAuthorUpdateFieldInput!]
              subject: String
            }

            input JournalWhere {
              AND: [JournalWhere!]
              NOT: JournalWhere
              OR: [JournalWhere!]
              author: AuthorWhere @deprecated(reason: \\"Use \`author_SOME\` instead.\\")
              authorAggregate: JournalAuthorAggregateInput
              authorConnection: JournalAuthorConnectionWhere @deprecated(reason: \\"Use \`authorConnection_SOME\` instead.\\")
              \\"\\"\\"
              Return Journals where all of the related JournalAuthorConnections match this filter
              \\"\\"\\"
              authorConnection_ALL: JournalAuthorConnectionWhere
              \\"\\"\\"
              Return Journals where none of the related JournalAuthorConnections match this filter
              \\"\\"\\"
              authorConnection_NONE: JournalAuthorConnectionWhere
              authorConnection_NOT: JournalAuthorConnectionWhere @deprecated(reason: \\"Use \`authorConnection_NONE\` instead.\\")
              \\"\\"\\"
              Return Journals where one of the related JournalAuthorConnections match this filter
              \\"\\"\\"
              authorConnection_SINGLE: JournalAuthorConnectionWhere
              \\"\\"\\"
              Return Journals where some of the related JournalAuthorConnections match this filter
              \\"\\"\\"
              authorConnection_SOME: JournalAuthorConnectionWhere
              \\"\\"\\"Return Journals where all of the related Authors match this filter\\"\\"\\"
              author_ALL: AuthorWhere
              \\"\\"\\"Return Journals where none of the related Authors match this filter\\"\\"\\"
              author_NONE: AuthorWhere
              author_NOT: AuthorWhere @deprecated(reason: \\"Use \`author_NONE\` instead.\\")
              \\"\\"\\"Return Journals where one of the related Authors match this filter\\"\\"\\"
              author_SINGLE: AuthorWhere
              \\"\\"\\"Return Journals where some of the related Authors match this filter\\"\\"\\"
              author_SOME: AuthorWhere
              subject: String
              subject_CONTAINS: String
              subject_ENDS_WITH: String
              subject_IN: [String!]
              subject_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              subject_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              subject_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              subject_NOT_IN: [String!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              subject_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              subject_STARTS_WITH: String
            }

            type JournalsConnection {
              edges: [JournalEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            type Mutation {
              createAuthors(input: [AuthorCreateInput!]!): CreateAuthorsMutationResponse!
              createBooks(input: [BookCreateInput!]!): CreateBooksMutationResponse!
              createJournals(input: [JournalCreateInput!]!): CreateJournalsMutationResponse!
              deleteAuthors(delete: AuthorDeleteInput, where: AuthorWhere): DeleteInfo!
              deleteBooks(delete: BookDeleteInput, where: BookWhere): DeleteInfo!
              deleteJournals(delete: JournalDeleteInput, where: JournalWhere): DeleteInfo!
              updateAuthors(connect: AuthorConnectInput, create: AuthorRelationInput, delete: AuthorDeleteInput, disconnect: AuthorDisconnectInput, update: AuthorUpdateInput, where: AuthorWhere): UpdateAuthorsMutationResponse!
              updateBooks(connect: BookConnectInput, create: BookRelationInput, delete: BookDeleteInput, disconnect: BookDisconnectInput, update: BookUpdateInput, where: BookWhere): UpdateBooksMutationResponse!
              updateJournals(connect: JournalConnectInput, create: JournalRelationInput, delete: JournalDeleteInput, disconnect: JournalDisconnectInput, update: JournalUpdateInput, where: JournalWhere): UpdateJournalsMutationResponse!
            }

            \\"\\"\\"Pagination information (Relay)\\"\\"\\"
            type PageInfo {
              endCursor: String
              hasNextPage: Boolean!
              hasPreviousPage: Boolean!
              startCursor: String
            }

            union Publication = Book | Journal

            input PublicationWhere {
              Book: BookWhere
              Journal: JournalWhere
            }

            type Query {
              authors(options: AuthorOptions, where: AuthorWhere): [Author!]!
              authorsAggregate(where: AuthorWhere): AuthorAggregateSelection!
              authorsConnection(after: String, first: Int, sort: [AuthorSort], where: AuthorWhere): AuthorsConnection!
              books(options: BookOptions, where: BookWhere): [Book!]!
              booksAggregate(where: BookWhere): BookAggregateSelection!
              booksConnection(after: String, first: Int, sort: [BookSort], where: BookWhere): BooksConnection!
              journals(options: JournalOptions, where: JournalWhere): [Journal!]!
              journalsAggregate(where: JournalWhere): JournalAggregateSelection!
              journalsConnection(after: String, first: Int, sort: [JournalSort], where: JournalWhere): JournalsConnection!
            }

            input QueryOptions {
              limit: Int
              offset: Int
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

            type UpdateAuthorsMutationResponse {
              authors: [Author!]!
              info: UpdateInfo!
            }

            type UpdateBooksMutationResponse {
              books: [Book!]!
              info: UpdateInfo!
            }

            type UpdateInfo {
              bookmark: String @deprecated(reason: \\"This field has been deprecated because bookmarks are now handled by the driver.\\")
              nodesCreated: Int!
              nodesDeleted: Int!
              relationshipsCreated: Int!
              relationshipsDeleted: Int!
            }

            type UpdateJournalsMutationResponse {
              info: UpdateInfo!
              journals: [Journal!]!
            }

            interface Wrote {
              words: Int!
            }

            input WroteCreateInput {
              words: Int!
            }

            input WroteSort {
              words: SortDirection
            }

            input WroteUpdateInput {
              words: Int
              words_DECREMENT: Int
              words_INCREMENT: Int
            }

            input WroteWhere {
              AND: [WroteWhere!]
              NOT: WroteWhere
              OR: [WroteWhere!]
              words: Int
              words_GT: Int
              words_GTE: Int
              words_IN: [Int!]
              words_LT: Int
              words_LTE: Int
              words_NOT: Int @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              words_NOT_IN: [Int!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
            }"
        `);
    });
});
