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

describe("Bigint", () => {
    test("BigInt", async () => {
        const typeDefs = gql`
            type File @node {
                name: String!
                size: BigInt!
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
            A BigInt value up to 64 bits in size, which can be a number or a string if used inline, or a string only if used as a variable. Always returned as a string.
            \\"\\"\\"
            scalar BigInt

            type BigIntAggregateSelection {
              average: BigInt
              max: BigInt
              min: BigInt
              sum: BigInt
            }

            type CreateFilesMutationResponse {
              files: [File!]!
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

            \\"\\"\\"
            Information about the number of nodes and relationships deleted during a delete mutation
            \\"\\"\\"
            type DeleteInfo {
              bookmark: String @deprecated(reason: \\"This field has been deprecated because bookmarks are now handled by the driver.\\")
              nodesDeleted: Int!
              relationshipsDeleted: Int!
            }

            type File {
              name: String!
              size: BigInt!
            }

            type FileAggregateSelection {
              count: Int!
              name: StringAggregateSelection!
              size: BigIntAggregateSelection!
            }

            input FileCreateInput {
              name: String!
              size: BigInt!
            }

            type FileEdge {
              cursor: String!
              node: File!
            }

            input FileOptions {
              limit: Int
              offset: Int
              \\"\\"\\"
              Specify one or more FileSort objects to sort Files by. The sorts will be applied in the order in which they are arranged in the array.
              \\"\\"\\"
              sort: [FileSort!]
            }

            \\"\\"\\"
            Fields to sort Files by. The order in which sorts are applied is not guaranteed when specifying many fields in one FileSort object.
            \\"\\"\\"
            input FileSort {
              name: SortDirection
              size: SortDirection
            }

            input FileUpdateInput {
              name: String
              size: BigInt
              size_DECREMENT: BigInt
              size_INCREMENT: BigInt
            }

            input FileWhere {
              AND: [FileWhere!]
              NOT: FileWhere
              OR: [FileWhere!]
              name: String @deprecated(reason: \\"Please use the explicit _EQ version\\")
              name_CONTAINS: String
              name_ENDS_WITH: String
              name_EQ: String
              name_IN: [String!]
              name_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              name_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              name_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              name_NOT_IN: [String!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              name_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              name_STARTS_WITH: String
              size: BigInt @deprecated(reason: \\"Please use the explicit _EQ version\\")
              size_EQ: BigInt
              size_GT: BigInt
              size_GTE: BigInt
              size_IN: [BigInt!]
              size_LT: BigInt
              size_LTE: BigInt
              size_NOT: BigInt @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              size_NOT_IN: [BigInt!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
            }

            type FilesConnection {
              edges: [FileEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            type Mutation {
              createFiles(input: [FileCreateInput!]!): CreateFilesMutationResponse!
              deleteFiles(where: FileWhere): DeleteInfo!
              updateFiles(update: FileUpdateInput, where: FileWhere): UpdateFilesMutationResponse!
            }

            \\"\\"\\"Pagination information (Relay)\\"\\"\\"
            type PageInfo {
              endCursor: String
              hasNextPage: Boolean!
              hasPreviousPage: Boolean!
              startCursor: String
            }

            type Query {
              files(limit: Int, offset: Int, options: FileOptions @deprecated(reason: \\"Query options argument is deprecated, please use pagination arguments like limit, offset and sort instead.\\"), sort: [FileSort!], where: FileWhere): [File!]!
              filesAggregate(where: FileWhere): FileAggregateSelection!
              filesConnection(after: String, first: Int, sort: [FileSort], where: FileWhere): FilesConnection!
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

            type UpdateFilesMutationResponse {
              files: [File!]!
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
            }"
        `);
    });
});
