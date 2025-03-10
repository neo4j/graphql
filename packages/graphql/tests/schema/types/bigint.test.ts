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

            \\"\\"\\"BigInt filters\\"\\"\\"
            input BigIntScalarFilters {
              eq: BigInt
              gt: BigInt
              gte: BigInt
              in: [BigInt!]
              lt: BigInt
              lte: BigInt
            }

            \\"\\"\\"BigInt mutations\\"\\"\\"
            input BigIntScalarMutations {
              add: BigInt
              set: BigInt
              subtract: BigInt
            }

            type Count {
              nodes: Int!
            }

            type CreateFilesMutationResponse {
              files: [File!]!
              info: CreateInfo!
            }

            \\"\\"\\"
            Information about the number of nodes and relationships created during a create mutation
            \\"\\"\\"
            type CreateInfo {
              nodesCreated: Int!
              relationshipsCreated: Int!
            }

            \\"\\"\\"
            Information about the number of nodes and relationships deleted during a delete mutation
            \\"\\"\\"
            type DeleteInfo {
              nodesDeleted: Int!
              relationshipsDeleted: Int!
            }

            type File {
              name: String!
              size: BigInt!
            }

            type FileAggregate {
              count: Count!
              node: FileAggregateNode!
            }

            type FileAggregateNode {
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

            \\"\\"\\"
            Fields to sort Files by. The order in which sorts are applied is not guaranteed when specifying many fields in one FileSort object.
            \\"\\"\\"
            input FileSort {
              name: SortDirection
              size: SortDirection
            }

            input FileUpdateInput {
              name: StringScalarMutations
              name_SET: String @deprecated(reason: \\"Please use the generic mutation 'name: { set: ... } }' instead.\\")
              size: BigIntScalarMutations
              size_DECREMENT: BigInt @deprecated(reason: \\"Please use the relevant generic mutation 'size: { decrement: ... } }' instead.\\")
              size_INCREMENT: BigInt @deprecated(reason: \\"Please use the relevant generic mutation 'size: { increment: ... } }' instead.\\")
              size_SET: BigInt @deprecated(reason: \\"Please use the generic mutation 'size: { set: ... } }' instead.\\")
            }

            input FileWhere {
              AND: [FileWhere!]
              NOT: FileWhere
              OR: [FileWhere!]
              name: StringScalarFilters
              name_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter name: { contains: ... }\\")
              name_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter name: { endsWith: ... }\\")
              name_EQ: String @deprecated(reason: \\"Please use the relevant generic filter name: { eq: ... }\\")
              name_IN: [String!] @deprecated(reason: \\"Please use the relevant generic filter name: { in: ... }\\")
              name_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter name: { startsWith: ... }\\")
              size: BigIntScalarFilters
              size_EQ: BigInt @deprecated(reason: \\"Please use the relevant generic filter size: { eq: ... }\\")
              size_GT: BigInt @deprecated(reason: \\"Please use the relevant generic filter size: { gt: ... }\\")
              size_GTE: BigInt @deprecated(reason: \\"Please use the relevant generic filter size: { gte: ... }\\")
              size_IN: [BigInt!] @deprecated(reason: \\"Please use the relevant generic filter size: { in: ... }\\")
              size_LT: BigInt @deprecated(reason: \\"Please use the relevant generic filter size: { lt: ... }\\")
              size_LTE: BigInt @deprecated(reason: \\"Please use the relevant generic filter size: { lte: ... }\\")
            }

            type FilesConnection {
              aggregate: FileAggregate!
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
              files(limit: Int, offset: Int, sort: [FileSort!], where: FileWhere): [File!]!
              filesConnection(after: String, first: Int, sort: [FileSort!], where: FileWhere): FilesConnection!
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

            type UpdateFilesMutationResponse {
              files: [File!]!
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
            }"
        `);
    });
});
