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

describe("https://github.com/neo4j/graphql/issues/2981", () => {
    test("BookTranslatedTitleCreateFieldInput fields should not be of type List", async () => {
        const typeDefs = gql`
            type Book {
                originalTitle: String!
                translatedTitle: BookTitle @relationship(type: "TRANSLATED_BOOK_TITLE", direction: IN)
                isbn: String!
            }

            union BookTitle = BookTitle_SV | BookTitle_EN

            type BookTitle_SV {
                book: Book! @relationship(type: "TRANSLATED_BOOK_TITLE", direction: OUT)
                value: String!
            }

            type BookTitle_EN {
                book: Book! @relationship(type: "TRANSLATED_BOOK_TITLE", direction: OUT)
                value: String!
            }
        `;
        const neoSchema = new Neo4jGraphQL({ typeDefs });
        const printedSchema = printSchemaWithDirectives(lexicographicSortSchema(await neoSchema.getSchema()));

        expect(printedSchema).toMatchInlineSnapshot(`
            "schema {
              query: Query
              mutation: Mutation
            }

            type Book {
              isbn: String!
              originalTitle: String!
              translatedTitle(directed: Boolean = true, options: QueryOptions, where: BookTitleWhere): BookTitle
              translatedTitleConnection(after: String, directed: Boolean = true, first: Int, where: BookTranslatedTitleConnectionWhere): BookTranslatedTitleConnection!
            }

            type BookAggregateSelection {
              count: Int!
              isbn: StringAggregateSelectionNonNullable!
              originalTitle: StringAggregateSelectionNonNullable!
            }

            input BookConnectInput {
              translatedTitle: BookTranslatedTitleConnectInput
            }

            input BookConnectWhere {
              node: BookWhere!
            }

            input BookCreateInput {
              isbn: String!
              originalTitle: String!
              translatedTitle: BookTranslatedTitleCreateInput
            }

            input BookDeleteInput {
              translatedTitle: BookTranslatedTitleDeleteInput
            }

            input BookDisconnectInput {
              translatedTitle: BookTranslatedTitleDisconnectInput
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
              translatedTitle: BookTranslatedTitleCreateFieldInput
            }

            \\"\\"\\"
            Fields to sort Books by. The order in which sorts are applied is not guaranteed when specifying many fields in one BookSort object.
            \\"\\"\\"
            input BookSort {
              isbn: SortDirection
              originalTitle: SortDirection
            }

            union BookTitle = BookTitle_EN | BookTitle_SV

            type BookTitleEnsConnection {
              edges: [BookTitle_ENEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            type BookTitleSvsConnection {
              edges: [BookTitle_SVEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input BookTitleWhere {
              BookTitle_EN: BookTitle_ENWhere
              BookTitle_SV: BookTitle_SVWhere
            }

            type BookTitle_EN {
              book(directed: Boolean = true, options: BookOptions, where: BookWhere): Book!
              bookAggregate(directed: Boolean = true, where: BookWhere): BookTitle_ENBookBookAggregationSelection
              bookConnection(after: String, directed: Boolean = true, first: Int, sort: [BookTitle_ENBookConnectionSort!], where: BookTitle_ENBookConnectionWhere): BookTitle_ENBookConnection!
              value: String!
            }

            type BookTitle_ENAggregateSelection {
              count: Int!
              value: StringAggregateSelectionNonNullable!
            }

            input BookTitle_ENBookAggregateInput {
              AND: [BookTitle_ENBookAggregateInput!]
              NOT: BookTitle_ENBookAggregateInput
              OR: [BookTitle_ENBookAggregateInput!]
              count: Int
              count_GT: Int
              count_GTE: Int
              count_LT: Int
              count_LTE: Int
              node: BookTitle_ENBookNodeAggregationWhereInput
            }

            type BookTitle_ENBookBookAggregationSelection {
              count: Int!
              node: BookTitle_ENBookBookNodeAggregateSelection
            }

            type BookTitle_ENBookBookNodeAggregateSelection {
              isbn: StringAggregateSelectionNonNullable!
              originalTitle: StringAggregateSelectionNonNullable!
            }

            input BookTitle_ENBookConnectFieldInput {
              connect: BookConnectInput
              \\"\\"\\"
              Whether or not to overwrite any matching relationship with the new properties. Will default to \`false\` in 4.0.0.
              \\"\\"\\"
              overwrite: Boolean! = true
              where: BookConnectWhere
            }

            type BookTitle_ENBookConnection {
              edges: [BookTitle_ENBookRelationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input BookTitle_ENBookConnectionSort {
              node: BookSort
            }

            input BookTitle_ENBookConnectionWhere {
              AND: [BookTitle_ENBookConnectionWhere!]
              NOT: BookTitle_ENBookConnectionWhere
              OR: [BookTitle_ENBookConnectionWhere!]
              node: BookWhere
              node_NOT: BookWhere @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
            }

            input BookTitle_ENBookCreateFieldInput {
              node: BookCreateInput!
            }

            input BookTitle_ENBookDeleteFieldInput {
              delete: BookDeleteInput
              where: BookTitle_ENBookConnectionWhere
            }

            input BookTitle_ENBookDisconnectFieldInput {
              disconnect: BookDisconnectInput
              where: BookTitle_ENBookConnectionWhere
            }

            input BookTitle_ENBookFieldInput {
              connect: BookTitle_ENBookConnectFieldInput
              create: BookTitle_ENBookCreateFieldInput
            }

            input BookTitle_ENBookNodeAggregationWhereInput {
              AND: [BookTitle_ENBookNodeAggregationWhereInput!]
              NOT: BookTitle_ENBookNodeAggregationWhereInput
              OR: [BookTitle_ENBookNodeAggregationWhereInput!]
              isbn_AVERAGE_EQUAL: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              isbn_AVERAGE_GT: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              isbn_AVERAGE_GTE: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              isbn_AVERAGE_LENGTH_EQUAL: Float
              isbn_AVERAGE_LENGTH_GT: Float
              isbn_AVERAGE_LENGTH_GTE: Float
              isbn_AVERAGE_LENGTH_LT: Float
              isbn_AVERAGE_LENGTH_LTE: Float
              isbn_AVERAGE_LT: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              isbn_AVERAGE_LTE: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              isbn_EQUAL: String @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              isbn_GT: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              isbn_GTE: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              isbn_LONGEST_EQUAL: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              isbn_LONGEST_GT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              isbn_LONGEST_GTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              isbn_LONGEST_LENGTH_EQUAL: Int
              isbn_LONGEST_LENGTH_GT: Int
              isbn_LONGEST_LENGTH_GTE: Int
              isbn_LONGEST_LENGTH_LT: Int
              isbn_LONGEST_LENGTH_LTE: Int
              isbn_LONGEST_LT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              isbn_LONGEST_LTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              isbn_LT: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              isbn_LTE: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              isbn_SHORTEST_EQUAL: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              isbn_SHORTEST_GT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              isbn_SHORTEST_GTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              isbn_SHORTEST_LENGTH_EQUAL: Int
              isbn_SHORTEST_LENGTH_GT: Int
              isbn_SHORTEST_LENGTH_GTE: Int
              isbn_SHORTEST_LENGTH_LT: Int
              isbn_SHORTEST_LENGTH_LTE: Int
              isbn_SHORTEST_LT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              isbn_SHORTEST_LTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              originalTitle_AVERAGE_EQUAL: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              originalTitle_AVERAGE_GT: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              originalTitle_AVERAGE_GTE: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              originalTitle_AVERAGE_LENGTH_EQUAL: Float
              originalTitle_AVERAGE_LENGTH_GT: Float
              originalTitle_AVERAGE_LENGTH_GTE: Float
              originalTitle_AVERAGE_LENGTH_LT: Float
              originalTitle_AVERAGE_LENGTH_LTE: Float
              originalTitle_AVERAGE_LT: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              originalTitle_AVERAGE_LTE: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              originalTitle_EQUAL: String @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              originalTitle_GT: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              originalTitle_GTE: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              originalTitle_LONGEST_EQUAL: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              originalTitle_LONGEST_GT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              originalTitle_LONGEST_GTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              originalTitle_LONGEST_LENGTH_EQUAL: Int
              originalTitle_LONGEST_LENGTH_GT: Int
              originalTitle_LONGEST_LENGTH_GTE: Int
              originalTitle_LONGEST_LENGTH_LT: Int
              originalTitle_LONGEST_LENGTH_LTE: Int
              originalTitle_LONGEST_LT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              originalTitle_LONGEST_LTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              originalTitle_LT: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              originalTitle_LTE: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              originalTitle_SHORTEST_EQUAL: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              originalTitle_SHORTEST_GT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              originalTitle_SHORTEST_GTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              originalTitle_SHORTEST_LENGTH_EQUAL: Int
              originalTitle_SHORTEST_LENGTH_GT: Int
              originalTitle_SHORTEST_LENGTH_GTE: Int
              originalTitle_SHORTEST_LENGTH_LT: Int
              originalTitle_SHORTEST_LENGTH_LTE: Int
              originalTitle_SHORTEST_LT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              originalTitle_SHORTEST_LTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
            }

            type BookTitle_ENBookRelationship {
              cursor: String!
              node: Book!
            }

            input BookTitle_ENBookUpdateConnectionInput {
              node: BookUpdateInput
            }

            input BookTitle_ENBookUpdateFieldInput {
              connect: BookTitle_ENBookConnectFieldInput
              create: BookTitle_ENBookCreateFieldInput
              delete: BookTitle_ENBookDeleteFieldInput
              disconnect: BookTitle_ENBookDisconnectFieldInput
              update: BookTitle_ENBookUpdateConnectionInput
              where: BookTitle_ENBookConnectionWhere
            }

            input BookTitle_ENConnectInput {
              book: BookTitle_ENBookConnectFieldInput
            }

            input BookTitle_ENConnectWhere {
              node: BookTitle_ENWhere!
            }

            input BookTitle_ENCreateInput {
              book: BookTitle_ENBookFieldInput
              value: String!
            }

            input BookTitle_ENDeleteInput {
              book: BookTitle_ENBookDeleteFieldInput
            }

            input BookTitle_ENDisconnectInput {
              book: BookTitle_ENBookDisconnectFieldInput
            }

            type BookTitle_ENEdge {
              cursor: String!
              node: BookTitle_EN!
            }

            input BookTitle_ENOptions {
              limit: Int
              offset: Int
              \\"\\"\\"
              Specify one or more BookTitle_ENSort objects to sort BookTitleEns by. The sorts will be applied in the order in which they are arranged in the array.
              \\"\\"\\"
              sort: [BookTitle_ENSort!]
            }

            input BookTitle_ENRelationInput {
              book: BookTitle_ENBookCreateFieldInput
            }

            \\"\\"\\"
            Fields to sort BookTitleEns by. The order in which sorts are applied is not guaranteed when specifying many fields in one BookTitle_ENSort object.
            \\"\\"\\"
            input BookTitle_ENSort {
              value: SortDirection
            }

            input BookTitle_ENUpdateInput {
              book: BookTitle_ENBookUpdateFieldInput
              value: String
            }

            input BookTitle_ENWhere {
              AND: [BookTitle_ENWhere!]
              NOT: BookTitle_ENWhere
              OR: [BookTitle_ENWhere!]
              book: BookWhere
              bookAggregate: BookTitle_ENBookAggregateInput
              bookConnection: BookTitle_ENBookConnectionWhere
              bookConnection_NOT: BookTitle_ENBookConnectionWhere
              book_NOT: BookWhere
              value: String
              value_CONTAINS: String
              value_ENDS_WITH: String
              value_IN: [String!]
              value_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              value_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              value_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              value_NOT_IN: [String!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              value_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              value_STARTS_WITH: String
            }

            type BookTitle_SV {
              book(directed: Boolean = true, options: BookOptions, where: BookWhere): Book!
              bookAggregate(directed: Boolean = true, where: BookWhere): BookTitle_SVBookBookAggregationSelection
              bookConnection(after: String, directed: Boolean = true, first: Int, sort: [BookTitle_SVBookConnectionSort!], where: BookTitle_SVBookConnectionWhere): BookTitle_SVBookConnection!
              value: String!
            }

            type BookTitle_SVAggregateSelection {
              count: Int!
              value: StringAggregateSelectionNonNullable!
            }

            input BookTitle_SVBookAggregateInput {
              AND: [BookTitle_SVBookAggregateInput!]
              NOT: BookTitle_SVBookAggregateInput
              OR: [BookTitle_SVBookAggregateInput!]
              count: Int
              count_GT: Int
              count_GTE: Int
              count_LT: Int
              count_LTE: Int
              node: BookTitle_SVBookNodeAggregationWhereInput
            }

            type BookTitle_SVBookBookAggregationSelection {
              count: Int!
              node: BookTitle_SVBookBookNodeAggregateSelection
            }

            type BookTitle_SVBookBookNodeAggregateSelection {
              isbn: StringAggregateSelectionNonNullable!
              originalTitle: StringAggregateSelectionNonNullable!
            }

            input BookTitle_SVBookConnectFieldInput {
              connect: BookConnectInput
              \\"\\"\\"
              Whether or not to overwrite any matching relationship with the new properties. Will default to \`false\` in 4.0.0.
              \\"\\"\\"
              overwrite: Boolean! = true
              where: BookConnectWhere
            }

            type BookTitle_SVBookConnection {
              edges: [BookTitle_SVBookRelationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input BookTitle_SVBookConnectionSort {
              node: BookSort
            }

            input BookTitle_SVBookConnectionWhere {
              AND: [BookTitle_SVBookConnectionWhere!]
              NOT: BookTitle_SVBookConnectionWhere
              OR: [BookTitle_SVBookConnectionWhere!]
              node: BookWhere
              node_NOT: BookWhere @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
            }

            input BookTitle_SVBookCreateFieldInput {
              node: BookCreateInput!
            }

            input BookTitle_SVBookDeleteFieldInput {
              delete: BookDeleteInput
              where: BookTitle_SVBookConnectionWhere
            }

            input BookTitle_SVBookDisconnectFieldInput {
              disconnect: BookDisconnectInput
              where: BookTitle_SVBookConnectionWhere
            }

            input BookTitle_SVBookFieldInput {
              connect: BookTitle_SVBookConnectFieldInput
              create: BookTitle_SVBookCreateFieldInput
            }

            input BookTitle_SVBookNodeAggregationWhereInput {
              AND: [BookTitle_SVBookNodeAggregationWhereInput!]
              NOT: BookTitle_SVBookNodeAggregationWhereInput
              OR: [BookTitle_SVBookNodeAggregationWhereInput!]
              isbn_AVERAGE_EQUAL: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              isbn_AVERAGE_GT: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              isbn_AVERAGE_GTE: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              isbn_AVERAGE_LENGTH_EQUAL: Float
              isbn_AVERAGE_LENGTH_GT: Float
              isbn_AVERAGE_LENGTH_GTE: Float
              isbn_AVERAGE_LENGTH_LT: Float
              isbn_AVERAGE_LENGTH_LTE: Float
              isbn_AVERAGE_LT: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              isbn_AVERAGE_LTE: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              isbn_EQUAL: String @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              isbn_GT: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              isbn_GTE: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              isbn_LONGEST_EQUAL: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              isbn_LONGEST_GT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              isbn_LONGEST_GTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              isbn_LONGEST_LENGTH_EQUAL: Int
              isbn_LONGEST_LENGTH_GT: Int
              isbn_LONGEST_LENGTH_GTE: Int
              isbn_LONGEST_LENGTH_LT: Int
              isbn_LONGEST_LENGTH_LTE: Int
              isbn_LONGEST_LT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              isbn_LONGEST_LTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              isbn_LT: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              isbn_LTE: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              isbn_SHORTEST_EQUAL: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              isbn_SHORTEST_GT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              isbn_SHORTEST_GTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              isbn_SHORTEST_LENGTH_EQUAL: Int
              isbn_SHORTEST_LENGTH_GT: Int
              isbn_SHORTEST_LENGTH_GTE: Int
              isbn_SHORTEST_LENGTH_LT: Int
              isbn_SHORTEST_LENGTH_LTE: Int
              isbn_SHORTEST_LT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              isbn_SHORTEST_LTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              originalTitle_AVERAGE_EQUAL: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              originalTitle_AVERAGE_GT: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              originalTitle_AVERAGE_GTE: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              originalTitle_AVERAGE_LENGTH_EQUAL: Float
              originalTitle_AVERAGE_LENGTH_GT: Float
              originalTitle_AVERAGE_LENGTH_GTE: Float
              originalTitle_AVERAGE_LENGTH_LT: Float
              originalTitle_AVERAGE_LENGTH_LTE: Float
              originalTitle_AVERAGE_LT: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              originalTitle_AVERAGE_LTE: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              originalTitle_EQUAL: String @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              originalTitle_GT: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              originalTitle_GTE: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              originalTitle_LONGEST_EQUAL: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              originalTitle_LONGEST_GT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              originalTitle_LONGEST_GTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              originalTitle_LONGEST_LENGTH_EQUAL: Int
              originalTitle_LONGEST_LENGTH_GT: Int
              originalTitle_LONGEST_LENGTH_GTE: Int
              originalTitle_LONGEST_LENGTH_LT: Int
              originalTitle_LONGEST_LENGTH_LTE: Int
              originalTitle_LONGEST_LT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              originalTitle_LONGEST_LTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              originalTitle_LT: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              originalTitle_LTE: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              originalTitle_SHORTEST_EQUAL: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              originalTitle_SHORTEST_GT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              originalTitle_SHORTEST_GTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              originalTitle_SHORTEST_LENGTH_EQUAL: Int
              originalTitle_SHORTEST_LENGTH_GT: Int
              originalTitle_SHORTEST_LENGTH_GTE: Int
              originalTitle_SHORTEST_LENGTH_LT: Int
              originalTitle_SHORTEST_LENGTH_LTE: Int
              originalTitle_SHORTEST_LT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              originalTitle_SHORTEST_LTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
            }

            type BookTitle_SVBookRelationship {
              cursor: String!
              node: Book!
            }

            input BookTitle_SVBookUpdateConnectionInput {
              node: BookUpdateInput
            }

            input BookTitle_SVBookUpdateFieldInput {
              connect: BookTitle_SVBookConnectFieldInput
              create: BookTitle_SVBookCreateFieldInput
              delete: BookTitle_SVBookDeleteFieldInput
              disconnect: BookTitle_SVBookDisconnectFieldInput
              update: BookTitle_SVBookUpdateConnectionInput
              where: BookTitle_SVBookConnectionWhere
            }

            input BookTitle_SVConnectInput {
              book: BookTitle_SVBookConnectFieldInput
            }

            input BookTitle_SVConnectWhere {
              node: BookTitle_SVWhere!
            }

            input BookTitle_SVCreateInput {
              book: BookTitle_SVBookFieldInput
              value: String!
            }

            input BookTitle_SVDeleteInput {
              book: BookTitle_SVBookDeleteFieldInput
            }

            input BookTitle_SVDisconnectInput {
              book: BookTitle_SVBookDisconnectFieldInput
            }

            type BookTitle_SVEdge {
              cursor: String!
              node: BookTitle_SV!
            }

            input BookTitle_SVOptions {
              limit: Int
              offset: Int
              \\"\\"\\"
              Specify one or more BookTitle_SVSort objects to sort BookTitleSvs by. The sorts will be applied in the order in which they are arranged in the array.
              \\"\\"\\"
              sort: [BookTitle_SVSort!]
            }

            input BookTitle_SVRelationInput {
              book: BookTitle_SVBookCreateFieldInput
            }

            \\"\\"\\"
            Fields to sort BookTitleSvs by. The order in which sorts are applied is not guaranteed when specifying many fields in one BookTitle_SVSort object.
            \\"\\"\\"
            input BookTitle_SVSort {
              value: SortDirection
            }

            input BookTitle_SVUpdateInput {
              book: BookTitle_SVBookUpdateFieldInput
              value: String
            }

            input BookTitle_SVWhere {
              AND: [BookTitle_SVWhere!]
              NOT: BookTitle_SVWhere
              OR: [BookTitle_SVWhere!]
              book: BookWhere
              bookAggregate: BookTitle_SVBookAggregateInput
              bookConnection: BookTitle_SVBookConnectionWhere
              bookConnection_NOT: BookTitle_SVBookConnectionWhere
              book_NOT: BookWhere
              value: String
              value_CONTAINS: String
              value_ENDS_WITH: String
              value_IN: [String!]
              value_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              value_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              value_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              value_NOT_IN: [String!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              value_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              value_STARTS_WITH: String
            }

            input BookTranslatedTitleBookTitle_ENConnectFieldInput {
              connect: BookTitle_ENConnectInput
              where: BookTitle_ENConnectWhere
            }

            input BookTranslatedTitleBookTitle_ENConnectionWhere {
              AND: [BookTranslatedTitleBookTitle_ENConnectionWhere!]
              NOT: BookTranslatedTitleBookTitle_ENConnectionWhere
              OR: [BookTranslatedTitleBookTitle_ENConnectionWhere!]
              node: BookTitle_ENWhere
              node_NOT: BookTitle_ENWhere @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
            }

            input BookTranslatedTitleBookTitle_ENCreateFieldInput {
              node: BookTitle_ENCreateInput!
            }

            input BookTranslatedTitleBookTitle_ENDeleteFieldInput {
              delete: BookTitle_ENDeleteInput
              where: BookTranslatedTitleBookTitle_ENConnectionWhere
            }

            input BookTranslatedTitleBookTitle_ENDisconnectFieldInput {
              disconnect: BookTitle_ENDisconnectInput
              where: BookTranslatedTitleBookTitle_ENConnectionWhere
            }

            input BookTranslatedTitleBookTitle_ENFieldInput {
              connect: BookTranslatedTitleBookTitle_ENConnectFieldInput
              create: BookTranslatedTitleBookTitle_ENCreateFieldInput
            }

            input BookTranslatedTitleBookTitle_ENUpdateConnectionInput {
              node: BookTitle_ENUpdateInput
            }

            input BookTranslatedTitleBookTitle_ENUpdateFieldInput {
              connect: BookTranslatedTitleBookTitle_ENConnectFieldInput
              create: BookTranslatedTitleBookTitle_ENCreateFieldInput
              delete: BookTranslatedTitleBookTitle_ENDeleteFieldInput
              disconnect: BookTranslatedTitleBookTitle_ENDisconnectFieldInput
              update: BookTranslatedTitleBookTitle_ENUpdateConnectionInput
              where: BookTranslatedTitleBookTitle_ENConnectionWhere
            }

            input BookTranslatedTitleBookTitle_SVConnectFieldInput {
              connect: BookTitle_SVConnectInput
              where: BookTitle_SVConnectWhere
            }

            input BookTranslatedTitleBookTitle_SVConnectionWhere {
              AND: [BookTranslatedTitleBookTitle_SVConnectionWhere!]
              NOT: BookTranslatedTitleBookTitle_SVConnectionWhere
              OR: [BookTranslatedTitleBookTitle_SVConnectionWhere!]
              node: BookTitle_SVWhere
              node_NOT: BookTitle_SVWhere @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
            }

            input BookTranslatedTitleBookTitle_SVCreateFieldInput {
              node: BookTitle_SVCreateInput!
            }

            input BookTranslatedTitleBookTitle_SVDeleteFieldInput {
              delete: BookTitle_SVDeleteInput
              where: BookTranslatedTitleBookTitle_SVConnectionWhere
            }

            input BookTranslatedTitleBookTitle_SVDisconnectFieldInput {
              disconnect: BookTitle_SVDisconnectInput
              where: BookTranslatedTitleBookTitle_SVConnectionWhere
            }

            input BookTranslatedTitleBookTitle_SVFieldInput {
              connect: BookTranslatedTitleBookTitle_SVConnectFieldInput
              create: BookTranslatedTitleBookTitle_SVCreateFieldInput
            }

            input BookTranslatedTitleBookTitle_SVUpdateConnectionInput {
              node: BookTitle_SVUpdateInput
            }

            input BookTranslatedTitleBookTitle_SVUpdateFieldInput {
              connect: BookTranslatedTitleBookTitle_SVConnectFieldInput
              create: BookTranslatedTitleBookTitle_SVCreateFieldInput
              delete: BookTranslatedTitleBookTitle_SVDeleteFieldInput
              disconnect: BookTranslatedTitleBookTitle_SVDisconnectFieldInput
              update: BookTranslatedTitleBookTitle_SVUpdateConnectionInput
              where: BookTranslatedTitleBookTitle_SVConnectionWhere
            }

            input BookTranslatedTitleConnectInput {
              BookTitle_EN: BookTranslatedTitleBookTitle_ENConnectFieldInput
              BookTitle_SV: BookTranslatedTitleBookTitle_SVConnectFieldInput
            }

            type BookTranslatedTitleConnection {
              edges: [BookTranslatedTitleRelationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input BookTranslatedTitleConnectionWhere {
              BookTitle_EN: BookTranslatedTitleBookTitle_ENConnectionWhere
              BookTitle_SV: BookTranslatedTitleBookTitle_SVConnectionWhere
            }

            input BookTranslatedTitleCreateFieldInput {
              BookTitle_EN: BookTranslatedTitleBookTitle_ENCreateFieldInput
              BookTitle_SV: BookTranslatedTitleBookTitle_SVCreateFieldInput
            }

            input BookTranslatedTitleCreateInput {
              BookTitle_EN: BookTranslatedTitleBookTitle_ENFieldInput
              BookTitle_SV: BookTranslatedTitleBookTitle_SVFieldInput
            }

            input BookTranslatedTitleDeleteInput {
              BookTitle_EN: BookTranslatedTitleBookTitle_ENDeleteFieldInput
              BookTitle_SV: BookTranslatedTitleBookTitle_SVDeleteFieldInput
            }

            input BookTranslatedTitleDisconnectInput {
              BookTitle_EN: BookTranslatedTitleBookTitle_ENDisconnectFieldInput
              BookTitle_SV: BookTranslatedTitleBookTitle_SVDisconnectFieldInput
            }

            type BookTranslatedTitleRelationship {
              cursor: String!
              node: BookTitle!
            }

            input BookTranslatedTitleUpdateInput {
              BookTitle_EN: BookTranslatedTitleBookTitle_ENUpdateFieldInput
              BookTitle_SV: BookTranslatedTitleBookTitle_SVUpdateFieldInput
            }

            input BookUpdateInput {
              isbn: String
              originalTitle: String
              translatedTitle: BookTranslatedTitleUpdateInput
            }

            input BookWhere {
              AND: [BookWhere!]
              NOT: BookWhere
              OR: [BookWhere!]
              isbn: String
              isbn_CONTAINS: String
              isbn_ENDS_WITH: String
              isbn_IN: [String!]
              isbn_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              isbn_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              isbn_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              isbn_NOT_IN: [String!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              isbn_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              isbn_STARTS_WITH: String
              originalTitle: String
              originalTitle_CONTAINS: String
              originalTitle_ENDS_WITH: String
              originalTitle_IN: [String!]
              originalTitle_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              originalTitle_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              originalTitle_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              originalTitle_NOT_IN: [String!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              originalTitle_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              originalTitle_STARTS_WITH: String
              translatedTitleConnection: BookTranslatedTitleConnectionWhere
              translatedTitleConnection_NOT: BookTranslatedTitleConnectionWhere
            }

            type BooksConnection {
              edges: [BookEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            type CreateBookTitleEnsMutationResponse {
              bookTitleEns: [BookTitle_EN!]!
              info: CreateInfo!
            }

            type CreateBookTitleSvsMutationResponse {
              bookTitleSvs: [BookTitle_SV!]!
              info: CreateInfo!
            }

            type CreateBooksMutationResponse {
              books: [Book!]!
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
              createBookTitleEns(input: [BookTitle_ENCreateInput!]!): CreateBookTitleEnsMutationResponse!
              createBookTitleSvs(input: [BookTitle_SVCreateInput!]!): CreateBookTitleSvsMutationResponse!
              createBooks(input: [BookCreateInput!]!): CreateBooksMutationResponse!
              deleteBookTitleEns(delete: BookTitle_ENDeleteInput, where: BookTitle_ENWhere): DeleteInfo!
              deleteBookTitleSvs(delete: BookTitle_SVDeleteInput, where: BookTitle_SVWhere): DeleteInfo!
              deleteBooks(delete: BookDeleteInput, where: BookWhere): DeleteInfo!
              updateBookTitleEns(connect: BookTitle_ENConnectInput, create: BookTitle_ENRelationInput, delete: BookTitle_ENDeleteInput, disconnect: BookTitle_ENDisconnectInput, update: BookTitle_ENUpdateInput, where: BookTitle_ENWhere): UpdateBookTitleEnsMutationResponse!
              updateBookTitleSvs(connect: BookTitle_SVConnectInput, create: BookTitle_SVRelationInput, delete: BookTitle_SVDeleteInput, disconnect: BookTitle_SVDisconnectInput, update: BookTitle_SVUpdateInput, where: BookTitle_SVWhere): UpdateBookTitleSvsMutationResponse!
              updateBooks(connect: BookConnectInput, create: BookRelationInput, delete: BookDeleteInput, disconnect: BookDisconnectInput, update: BookUpdateInput, where: BookWhere): UpdateBooksMutationResponse!
            }

            \\"\\"\\"Pagination information (Relay)\\"\\"\\"
            type PageInfo {
              endCursor: String
              hasNextPage: Boolean!
              hasPreviousPage: Boolean!
              startCursor: String
            }

            type Query {
              bookTitleEns(options: BookTitle_ENOptions, where: BookTitle_ENWhere): [BookTitle_EN!]!
              bookTitleEnsAggregate(where: BookTitle_ENWhere): BookTitle_ENAggregateSelection!
              bookTitleEnsConnection(after: String, first: Int, sort: [BookTitle_ENSort], where: BookTitle_ENWhere): BookTitleEnsConnection!
              bookTitleSvs(options: BookTitle_SVOptions, where: BookTitle_SVWhere): [BookTitle_SV!]!
              bookTitleSvsAggregate(where: BookTitle_SVWhere): BookTitle_SVAggregateSelection!
              bookTitleSvsConnection(after: String, first: Int, sort: [BookTitle_SVSort], where: BookTitle_SVWhere): BookTitleSvsConnection!
              books(options: BookOptions, where: BookWhere): [Book!]!
              booksAggregate(where: BookWhere): BookAggregateSelection!
              booksConnection(after: String, first: Int, sort: [BookSort], where: BookWhere): BooksConnection!
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

            type UpdateBookTitleEnsMutationResponse {
              bookTitleEns: [BookTitle_EN!]!
              info: UpdateInfo!
            }

            type UpdateBookTitleSvsMutationResponse {
              bookTitleSvs: [BookTitle_SV!]!
              info: UpdateInfo!
            }

            type UpdateBooksMutationResponse {
              books: [Book!]!
              info: UpdateInfo!
            }

            type UpdateInfo {
              bookmark: String
              nodesCreated: Int!
              nodesDeleted: Int!
              relationshipsCreated: Int!
              relationshipsDeleted: Int!
            }"
        `);
    });
});
