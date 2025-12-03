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

describe("Unions", () => {
    test("Relationship Properties", async () => {
        const typeDefs = gql`
            union Publication = Book | Journal

            type Author @node {
                name: String!
                publications: [Publication!]! @relationship(type: "WROTE", direction: OUT, properties: "Wrote")
            }

            type Book @node {
                title: String!
                author: [Author!]! @relationship(type: "WROTE", direction: IN, properties: "Wrote")
            }

            type Journal @node {
                subject: String!
                author: [Author!]! @relationship(type: "WROTE", direction: IN, properties: "Wrote")
            }

            type Wrote @relationshipProperties {
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
              publications(limit: Int, offset: Int, where: PublicationWhere): [Publication!]!
              publicationsConnection(after: String, first: Int, sort: [AuthorPublicationsConnectionSort!], where: AuthorPublicationsConnectionWhere): AuthorPublicationsConnection!
            }

            type AuthorAggregate {
              count: Count!
              node: AuthorAggregateNode!
            }

            type AuthorAggregateNode {
              name: StringAggregateSelection!
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
              node: BookWhere
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
              where: AuthorPublicationsBookConnectionWhere
            }

            input AuthorPublicationsBookUpdateFieldInput {
              connect: [AuthorPublicationsBookConnectFieldInput!]
              create: [AuthorPublicationsBookCreateFieldInput!]
              delete: [AuthorPublicationsBookDeleteFieldInput!]
              disconnect: [AuthorPublicationsBookDisconnectFieldInput!]
              update: AuthorPublicationsBookUpdateConnectionInput
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

            input AuthorPublicationsConnectionFilters {
              \\"\\"\\"
              Return Authors where all of the related AuthorPublicationsConnections match this filter
              \\"\\"\\"
              all: AuthorPublicationsConnectionWhere
              \\"\\"\\"
              Return Authors where none of the related AuthorPublicationsConnections match this filter
              \\"\\"\\"
              none: AuthorPublicationsConnectionWhere
              \\"\\"\\"
              Return Authors where one of the related AuthorPublicationsConnections match this filter
              \\"\\"\\"
              single: AuthorPublicationsConnectionWhere
              \\"\\"\\"
              Return Authors where some of the related AuthorPublicationsConnections match this filter
              \\"\\"\\"
              some: AuthorPublicationsConnectionWhere
            }

            input AuthorPublicationsConnectionSort {
              edge: WroteSort
            }

            input AuthorPublicationsConnectionWhere {
              Book: AuthorPublicationsBookConnectionWhere
              Journal: AuthorPublicationsJournalConnectionWhere
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
              node: JournalWhere
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
              where: AuthorPublicationsJournalConnectionWhere
            }

            input AuthorPublicationsJournalUpdateFieldInput {
              connect: [AuthorPublicationsJournalConnectFieldInput!]
              create: [AuthorPublicationsJournalCreateFieldInput!]
              delete: [AuthorPublicationsJournalDeleteFieldInput!]
              disconnect: [AuthorPublicationsJournalDisconnectFieldInput!]
              update: AuthorPublicationsJournalUpdateConnectionInput
            }

            type AuthorPublicationsRelationship {
              cursor: String!
              node: Publication!
              properties: Wrote!
            }

            input AuthorPublicationsUpdateInput {
              Book: [AuthorPublicationsBookUpdateFieldInput!]
              Journal: [AuthorPublicationsJournalUpdateFieldInput!]
            }

            input AuthorRelationshipFilters {
              \\"\\"\\"Filter type where all of the related Authors match this filter\\"\\"\\"
              all: AuthorWhere
              \\"\\"\\"Filter type where none of the related Authors match this filter\\"\\"\\"
              none: AuthorWhere
              \\"\\"\\"Filter type where one of the related Authors match this filter\\"\\"\\"
              single: AuthorWhere
              \\"\\"\\"Filter type where some of the related Authors match this filter\\"\\"\\"
              some: AuthorWhere
            }

            \\"\\"\\"
            Fields to sort Authors by. The order in which sorts are applied is not guaranteed when specifying many fields in one AuthorSort object.
            \\"\\"\\"
            input AuthorSort {
              name: SortDirection
            }

            input AuthorUpdateInput {
              name: StringScalarMutations
              name_SET: String @deprecated(reason: \\"Please use the generic mutation 'name: { set: ... } }' instead.\\")
              publications: AuthorPublicationsUpdateInput
            }

            input AuthorWhere {
              AND: [AuthorWhere!]
              NOT: AuthorWhere
              OR: [AuthorWhere!]
              name: StringScalarFilters
              name_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter name: { contains: ... }\\")
              name_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter name: { endsWith: ... }\\")
              name_EQ: String @deprecated(reason: \\"Please use the relevant generic filter name: { eq: ... }\\")
              name_IN: [String!] @deprecated(reason: \\"Please use the relevant generic filter name: { in: ... }\\")
              name_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter name: { startsWith: ... }\\")
              publications: PublicationRelationshipFilters
              publicationsConnection: AuthorPublicationsConnectionFilters
              \\"\\"\\"
              Return Authors where all of the related AuthorPublicationsConnections match this filter
              \\"\\"\\"
              publicationsConnection_ALL: AuthorPublicationsConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'publicationsConnection: { all: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Authors where none of the related AuthorPublicationsConnections match this filter
              \\"\\"\\"
              publicationsConnection_NONE: AuthorPublicationsConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'publicationsConnection: { none: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Authors where one of the related AuthorPublicationsConnections match this filter
              \\"\\"\\"
              publicationsConnection_SINGLE: AuthorPublicationsConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'publicationsConnection: { single: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Authors where some of the related AuthorPublicationsConnections match this filter
              \\"\\"\\"
              publicationsConnection_SOME: AuthorPublicationsConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'publicationsConnection: { some: { node: ... } } }' instead.\\")
              \\"\\"\\"Return Authors where all of the related Publications match this filter\\"\\"\\"
              publications_ALL: PublicationWhere @deprecated(reason: \\"Please use the relevant generic filter 'publications: { all: ... }' instead.\\")
              \\"\\"\\"
              Return Authors where none of the related Publications match this filter
              \\"\\"\\"
              publications_NONE: PublicationWhere @deprecated(reason: \\"Please use the relevant generic filter 'publications: { none: ... }' instead.\\")
              \\"\\"\\"Return Authors where one of the related Publications match this filter\\"\\"\\"
              publications_SINGLE: PublicationWhere @deprecated(reason: \\"Please use the relevant generic filter 'publications: {  single: ... }' instead.\\")
              \\"\\"\\"
              Return Authors where some of the related Publications match this filter
              \\"\\"\\"
              publications_SOME: PublicationWhere @deprecated(reason: \\"Please use the relevant generic filter 'publications: {  some: ... }' instead.\\")
            }

            type AuthorsConnection {
              aggregate: AuthorAggregate!
              edges: [AuthorEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            type Book {
              author(limit: Int, offset: Int, sort: [AuthorSort!], where: AuthorWhere): [Author!]!
              authorConnection(after: String, first: Int, sort: [BookAuthorConnectionSort!], where: BookAuthorConnectionWhere): BookAuthorConnection!
              title: String!
            }

            type BookAggregate {
              count: Count!
              node: BookAggregateNode!
            }

            type BookAggregateNode {
              title: StringAggregateSelection!
            }

            input BookAuthorAggregateInput {
              AND: [BookAuthorAggregateInput!]
              NOT: BookAuthorAggregateInput
              OR: [BookAuthorAggregateInput!]
              count: IntScalarFilters
              count_EQ: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { eq: ... } } }' instead.\\")
              count_GT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gt: ... } } }' instead.\\")
              count_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gte: ... } } }' instead.\\")
              count_LT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lt: ... } } }' instead.\\")
              count_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lte: ... } } }' instead.\\")
              edge: WroteAggregationWhereInput
              node: BookAuthorNodeAggregationWhereInput
            }

            type BookAuthorAuthorAggregateSelection {
              count: CountConnection!
              edge: BookAuthorAuthorEdgeAggregateSelection
              node: BookAuthorAuthorNodeAggregateSelection
            }

            type BookAuthorAuthorEdgeAggregateSelection {
              words: IntAggregateSelection!
            }

            type BookAuthorAuthorNodeAggregateSelection {
              name: StringAggregateSelection!
            }

            input BookAuthorConnectFieldInput {
              connect: [AuthorConnectInput!]
              edge: WroteCreateInput!
              where: AuthorConnectWhere
            }

            type BookAuthorConnection {
              aggregate: BookAuthorAuthorAggregateSelection!
              edges: [BookAuthorRelationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input BookAuthorConnectionAggregateInput {
              AND: [BookAuthorConnectionAggregateInput!]
              NOT: BookAuthorConnectionAggregateInput
              OR: [BookAuthorConnectionAggregateInput!]
              count: ConnectionAggregationCountFilterInput
              edge: WroteAggregationWhereInput
              node: BookAuthorNodeAggregationWhereInput
            }

            input BookAuthorConnectionFilters {
              \\"\\"\\"Filter Books by aggregating results on related BookAuthorConnections\\"\\"\\"
              aggregate: BookAuthorConnectionAggregateInput
              \\"\\"\\"
              Return Books where all of the related BookAuthorConnections match this filter
              \\"\\"\\"
              all: BookAuthorConnectionWhere
              \\"\\"\\"
              Return Books where none of the related BookAuthorConnections match this filter
              \\"\\"\\"
              none: BookAuthorConnectionWhere
              \\"\\"\\"
              Return Books where one of the related BookAuthorConnections match this filter
              \\"\\"\\"
              single: BookAuthorConnectionWhere
              \\"\\"\\"
              Return Books where some of the related BookAuthorConnections match this filter
              \\"\\"\\"
              some: BookAuthorConnectionWhere
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
              node: AuthorWhere
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

            input BookAuthorFieldInput {
              connect: [BookAuthorConnectFieldInput!]
              create: [BookAuthorCreateFieldInput!]
            }

            input BookAuthorNodeAggregationWhereInput {
              AND: [BookAuthorNodeAggregationWhereInput!]
              NOT: BookAuthorNodeAggregationWhereInput
              OR: [BookAuthorNodeAggregationWhereInput!]
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

            type BookAuthorRelationship {
              cursor: String!
              node: Author!
              properties: Wrote!
            }

            input BookAuthorUpdateConnectionInput {
              edge: WroteUpdateInput
              node: AuthorUpdateInput
              where: BookAuthorConnectionWhere
            }

            input BookAuthorUpdateFieldInput {
              connect: [BookAuthorConnectFieldInput!]
              create: [BookAuthorCreateFieldInput!]
              delete: [BookAuthorDeleteFieldInput!]
              disconnect: [BookAuthorDisconnectFieldInput!]
              update: BookAuthorUpdateConnectionInput
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

            \\"\\"\\"
            Fields to sort Books by. The order in which sorts are applied is not guaranteed when specifying many fields in one BookSort object.
            \\"\\"\\"
            input BookSort {
              title: SortDirection
            }

            input BookUpdateInput {
              author: [BookAuthorUpdateFieldInput!]
              title: StringScalarMutations
              title_SET: String @deprecated(reason: \\"Please use the generic mutation 'title: { set: ... } }' instead.\\")
            }

            input BookWhere {
              AND: [BookWhere!]
              NOT: BookWhere
              OR: [BookWhere!]
              author: AuthorRelationshipFilters
              authorAggregate: BookAuthorAggregateInput @deprecated(reason: \\"Aggregate filters are moved inside the authorConnection filter, please use { authorConnection: { aggregate: {...} } } instead\\")
              authorConnection: BookAuthorConnectionFilters
              \\"\\"\\"
              Return Books where all of the related BookAuthorConnections match this filter
              \\"\\"\\"
              authorConnection_ALL: BookAuthorConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'authorConnection: { all: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Books where none of the related BookAuthorConnections match this filter
              \\"\\"\\"
              authorConnection_NONE: BookAuthorConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'authorConnection: { none: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Books where one of the related BookAuthorConnections match this filter
              \\"\\"\\"
              authorConnection_SINGLE: BookAuthorConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'authorConnection: { single: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Books where some of the related BookAuthorConnections match this filter
              \\"\\"\\"
              authorConnection_SOME: BookAuthorConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'authorConnection: { some: { node: ... } } }' instead.\\")
              \\"\\"\\"Return Books where all of the related Authors match this filter\\"\\"\\"
              author_ALL: AuthorWhere @deprecated(reason: \\"Please use the relevant generic filter 'author: { all: ... }' instead.\\")
              \\"\\"\\"Return Books where none of the related Authors match this filter\\"\\"\\"
              author_NONE: AuthorWhere @deprecated(reason: \\"Please use the relevant generic filter 'author: { none: ... }' instead.\\")
              \\"\\"\\"Return Books where one of the related Authors match this filter\\"\\"\\"
              author_SINGLE: AuthorWhere @deprecated(reason: \\"Please use the relevant generic filter 'author: {  single: ... }' instead.\\")
              \\"\\"\\"Return Books where some of the related Authors match this filter\\"\\"\\"
              author_SOME: AuthorWhere @deprecated(reason: \\"Please use the relevant generic filter 'author: {  some: ... }' instead.\\")
              title: StringScalarFilters
              title_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter title: { contains: ... }\\")
              title_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter title: { endsWith: ... }\\")
              title_EQ: String @deprecated(reason: \\"Please use the relevant generic filter title: { eq: ... }\\")
              title_IN: [String!] @deprecated(reason: \\"Please use the relevant generic filter title: { in: ... }\\")
              title_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter title: { startsWith: ... }\\")
            }

            type BooksConnection {
              aggregate: BookAggregate!
              edges: [BookEdge!]!
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

            type CreateAuthorsMutationResponse {
              authors: [Author!]!
              info: CreateInfo!
            }

            type CreateBooksMutationResponse {
              books: [Book!]!
              info: CreateInfo!
            }

            \\"\\"\\"
            Information about the number of nodes and relationships created during a create mutation
            \\"\\"\\"
            type CreateInfo {
              nodesCreated: Int!
              relationshipsCreated: Int!
            }

            type CreateJournalsMutationResponse {
              info: CreateInfo!
              journals: [Journal!]!
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

            type Journal {
              author(limit: Int, offset: Int, sort: [AuthorSort!], where: AuthorWhere): [Author!]!
              authorConnection(after: String, first: Int, sort: [JournalAuthorConnectionSort!], where: JournalAuthorConnectionWhere): JournalAuthorConnection!
              subject: String!
            }

            type JournalAggregate {
              count: Count!
              node: JournalAggregateNode!
            }

            type JournalAggregateNode {
              subject: StringAggregateSelection!
            }

            input JournalAuthorAggregateInput {
              AND: [JournalAuthorAggregateInput!]
              NOT: JournalAuthorAggregateInput
              OR: [JournalAuthorAggregateInput!]
              count: IntScalarFilters
              count_EQ: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { eq: ... } } }' instead.\\")
              count_GT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gt: ... } } }' instead.\\")
              count_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gte: ... } } }' instead.\\")
              count_LT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lt: ... } } }' instead.\\")
              count_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lte: ... } } }' instead.\\")
              edge: WroteAggregationWhereInput
              node: JournalAuthorNodeAggregationWhereInput
            }

            type JournalAuthorAuthorAggregateSelection {
              count: CountConnection!
              edge: JournalAuthorAuthorEdgeAggregateSelection
              node: JournalAuthorAuthorNodeAggregateSelection
            }

            type JournalAuthorAuthorEdgeAggregateSelection {
              words: IntAggregateSelection!
            }

            type JournalAuthorAuthorNodeAggregateSelection {
              name: StringAggregateSelection!
            }

            input JournalAuthorConnectFieldInput {
              connect: [AuthorConnectInput!]
              edge: WroteCreateInput!
              where: AuthorConnectWhere
            }

            type JournalAuthorConnection {
              aggregate: JournalAuthorAuthorAggregateSelection!
              edges: [JournalAuthorRelationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input JournalAuthorConnectionAggregateInput {
              AND: [JournalAuthorConnectionAggregateInput!]
              NOT: JournalAuthorConnectionAggregateInput
              OR: [JournalAuthorConnectionAggregateInput!]
              count: ConnectionAggregationCountFilterInput
              edge: WroteAggregationWhereInput
              node: JournalAuthorNodeAggregationWhereInput
            }

            input JournalAuthorConnectionFilters {
              \\"\\"\\"
              Filter Journals by aggregating results on related JournalAuthorConnections
              \\"\\"\\"
              aggregate: JournalAuthorConnectionAggregateInput
              \\"\\"\\"
              Return Journals where all of the related JournalAuthorConnections match this filter
              \\"\\"\\"
              all: JournalAuthorConnectionWhere
              \\"\\"\\"
              Return Journals where none of the related JournalAuthorConnections match this filter
              \\"\\"\\"
              none: JournalAuthorConnectionWhere
              \\"\\"\\"
              Return Journals where one of the related JournalAuthorConnections match this filter
              \\"\\"\\"
              single: JournalAuthorConnectionWhere
              \\"\\"\\"
              Return Journals where some of the related JournalAuthorConnections match this filter
              \\"\\"\\"
              some: JournalAuthorConnectionWhere
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
              node: AuthorWhere
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

            input JournalAuthorFieldInput {
              connect: [JournalAuthorConnectFieldInput!]
              create: [JournalAuthorCreateFieldInput!]
            }

            input JournalAuthorNodeAggregationWhereInput {
              AND: [JournalAuthorNodeAggregationWhereInput!]
              NOT: JournalAuthorNodeAggregationWhereInput
              OR: [JournalAuthorNodeAggregationWhereInput!]
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

            type JournalAuthorRelationship {
              cursor: String!
              node: Author!
              properties: Wrote!
            }

            input JournalAuthorUpdateConnectionInput {
              edge: WroteUpdateInput
              node: AuthorUpdateInput
              where: JournalAuthorConnectionWhere
            }

            input JournalAuthorUpdateFieldInput {
              connect: [JournalAuthorConnectFieldInput!]
              create: [JournalAuthorCreateFieldInput!]
              delete: [JournalAuthorDeleteFieldInput!]
              disconnect: [JournalAuthorDisconnectFieldInput!]
              update: JournalAuthorUpdateConnectionInput
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

            \\"\\"\\"
            Fields to sort Journals by. The order in which sorts are applied is not guaranteed when specifying many fields in one JournalSort object.
            \\"\\"\\"
            input JournalSort {
              subject: SortDirection
            }

            input JournalUpdateInput {
              author: [JournalAuthorUpdateFieldInput!]
              subject: StringScalarMutations
              subject_SET: String @deprecated(reason: \\"Please use the generic mutation 'subject: { set: ... } }' instead.\\")
            }

            input JournalWhere {
              AND: [JournalWhere!]
              NOT: JournalWhere
              OR: [JournalWhere!]
              author: AuthorRelationshipFilters
              authorAggregate: JournalAuthorAggregateInput @deprecated(reason: \\"Aggregate filters are moved inside the authorConnection filter, please use { authorConnection: { aggregate: {...} } } instead\\")
              authorConnection: JournalAuthorConnectionFilters
              \\"\\"\\"
              Return Journals where all of the related JournalAuthorConnections match this filter
              \\"\\"\\"
              authorConnection_ALL: JournalAuthorConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'authorConnection: { all: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Journals where none of the related JournalAuthorConnections match this filter
              \\"\\"\\"
              authorConnection_NONE: JournalAuthorConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'authorConnection: { none: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Journals where one of the related JournalAuthorConnections match this filter
              \\"\\"\\"
              authorConnection_SINGLE: JournalAuthorConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'authorConnection: { single: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Journals where some of the related JournalAuthorConnections match this filter
              \\"\\"\\"
              authorConnection_SOME: JournalAuthorConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'authorConnection: { some: { node: ... } } }' instead.\\")
              \\"\\"\\"Return Journals where all of the related Authors match this filter\\"\\"\\"
              author_ALL: AuthorWhere @deprecated(reason: \\"Please use the relevant generic filter 'author: { all: ... }' instead.\\")
              \\"\\"\\"Return Journals where none of the related Authors match this filter\\"\\"\\"
              author_NONE: AuthorWhere @deprecated(reason: \\"Please use the relevant generic filter 'author: { none: ... }' instead.\\")
              \\"\\"\\"Return Journals where one of the related Authors match this filter\\"\\"\\"
              author_SINGLE: AuthorWhere @deprecated(reason: \\"Please use the relevant generic filter 'author: {  single: ... }' instead.\\")
              \\"\\"\\"Return Journals where some of the related Authors match this filter\\"\\"\\"
              author_SOME: AuthorWhere @deprecated(reason: \\"Please use the relevant generic filter 'author: {  some: ... }' instead.\\")
              subject: StringScalarFilters
              subject_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter subject: { contains: ... }\\")
              subject_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter subject: { endsWith: ... }\\")
              subject_EQ: String @deprecated(reason: \\"Please use the relevant generic filter subject: { eq: ... }\\")
              subject_IN: [String!] @deprecated(reason: \\"Please use the relevant generic filter subject: { in: ... }\\")
              subject_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter subject: { startsWith: ... }\\")
            }

            type JournalsConnection {
              aggregate: JournalAggregate!
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
              updateAuthors(update: AuthorUpdateInput, where: AuthorWhere): UpdateAuthorsMutationResponse!
              updateBooks(update: BookUpdateInput, where: BookWhere): UpdateBooksMutationResponse!
              updateJournals(update: JournalUpdateInput, where: JournalWhere): UpdateJournalsMutationResponse!
            }

            \\"\\"\\"Pagination information (Relay)\\"\\"\\"
            type PageInfo {
              endCursor: String
              hasNextPage: Boolean!
              hasPreviousPage: Boolean!
              startCursor: String
            }

            union Publication = Book | Journal

            input PublicationRelationshipFilters {
              \\"\\"\\"Filter type where all of the related Publications match this filter\\"\\"\\"
              all: PublicationWhere
              \\"\\"\\"Filter type where none of the related Publications match this filter\\"\\"\\"
              none: PublicationWhere
              \\"\\"\\"Filter type where one of the related Publications match this filter\\"\\"\\"
              single: PublicationWhere
              \\"\\"\\"Filter type where some of the related Publications match this filter\\"\\"\\"
              some: PublicationWhere
            }

            input PublicationWhere {
              Book: BookWhere
              Journal: JournalWhere
            }

            type Query {
              authors(limit: Int, offset: Int, sort: [AuthorSort!], where: AuthorWhere): [Author!]!
              authorsConnection(after: String, first: Int, sort: [AuthorSort!], where: AuthorWhere): AuthorsConnection!
              books(limit: Int, offset: Int, sort: [BookSort!], where: BookWhere): [Book!]!
              booksConnection(after: String, first: Int, sort: [BookSort!], where: BookWhere): BooksConnection!
              journals(limit: Int, offset: Int, sort: [JournalSort!], where: JournalWhere): [Journal!]!
              journalsConnection(after: String, first: Int, sort: [JournalSort!], where: JournalWhere): JournalsConnection!
              publications(limit: Int, offset: Int, where: PublicationWhere): [Publication!]!
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

            type UpdateAuthorsMutationResponse {
              authors: [Author!]!
              info: UpdateInfo!
            }

            type UpdateBooksMutationResponse {
              books: [Book!]!
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

            type UpdateJournalsMutationResponse {
              info: UpdateInfo!
              journals: [Journal!]!
            }

            \\"\\"\\"
            The edge properties for the following fields:
            * Author.publications
            * Book.author
            * Journal.author
            \\"\\"\\"
            type Wrote {
              words: Int!
            }

            input WroteAggregationWhereInput {
              AND: [WroteAggregationWhereInput!]
              NOT: WroteAggregationWhereInput
              OR: [WroteAggregationWhereInput!]
              words: IntScalarAggregationFilters
              words_AVERAGE_EQUAL: Float @deprecated(reason: \\"Please use the relevant generic filter 'words: { average: { eq: ... } } }' instead.\\")
              words_AVERAGE_GT: Float @deprecated(reason: \\"Please use the relevant generic filter 'words: { average: { gt: ... } } }' instead.\\")
              words_AVERAGE_GTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'words: { average: { gte: ... } } }' instead.\\")
              words_AVERAGE_LT: Float @deprecated(reason: \\"Please use the relevant generic filter 'words: { average: { lt: ... } } }' instead.\\")
              words_AVERAGE_LTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'words: { average: { lte: ... } } }' instead.\\")
              words_MAX_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'words: { max: { eq: ... } } }' instead.\\")
              words_MAX_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'words: { max: { gt: ... } } }' instead.\\")
              words_MAX_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'words: { max: { gte: ... } } }' instead.\\")
              words_MAX_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'words: { max: { lt: ... } } }' instead.\\")
              words_MAX_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'words: { max: { lte: ... } } }' instead.\\")
              words_MIN_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'words: { min: { eq: ... } } }' instead.\\")
              words_MIN_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'words: { min: { gt: ... } } }' instead.\\")
              words_MIN_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'words: { min: { gte: ... } } }' instead.\\")
              words_MIN_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'words: { min: { lt: ... } } }' instead.\\")
              words_MIN_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'words: { min: { lte: ... } } }' instead.\\")
              words_SUM_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'words: { sum: { eq: ... } } }' instead.\\")
              words_SUM_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'words: { sum: { gt: ... } } }' instead.\\")
              words_SUM_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'words: { sum: { gte: ... } } }' instead.\\")
              words_SUM_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'words: { sum: { lt: ... } } }' instead.\\")
              words_SUM_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'words: { sum: { lte: ... } } }' instead.\\")
            }

            input WroteCreateInput {
              words: Int!
            }

            input WroteSort {
              words: SortDirection
            }

            input WroteUpdateInput {
              words: IntScalarMutations
              words_DECREMENT: Int @deprecated(reason: \\"Please use the relevant generic mutation 'words: { decrement: ... } }' instead.\\")
              words_INCREMENT: Int @deprecated(reason: \\"Please use the relevant generic mutation 'words: { increment: ... } }' instead.\\")
              words_SET: Int @deprecated(reason: \\"Please use the generic mutation 'words: { set: ... } }' instead.\\")
            }

            input WroteWhere {
              AND: [WroteWhere!]
              NOT: WroteWhere
              OR: [WroteWhere!]
              words: IntScalarFilters
              words_EQ: Int @deprecated(reason: \\"Please use the relevant generic filter words: { eq: ... }\\")
              words_GT: Int @deprecated(reason: \\"Please use the relevant generic filter words: { gt: ... }\\")
              words_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter words: { gte: ... }\\")
              words_IN: [Int!] @deprecated(reason: \\"Please use the relevant generic filter words: { in: ... }\\")
              words_LT: Int @deprecated(reason: \\"Please use the relevant generic filter words: { lt: ... }\\")
              words_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter words: { lte: ... }\\")
            }"
        `);
    });
});
