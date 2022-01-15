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

describe("Bigint", () => {
    test("BigInt", () => {
        const typeDefs = gql`
            type File {
                name: String!
                size: BigInt!
            }
        `;
        const neoSchema = new Neo4jGraphQL({ typeDefs });
        const printedSchema = printSchemaWithDirectives(lexicographicSortSchema(neoSchema.schema));

        expect(printedSchema).toMatchInlineSnapshot(`
            "schema {
              query: Query
              mutation: Mutation
            }

            \\"\\"\\"A BigInt value up to 64 bits in size, which can be a number or a string if used inline, or a string only if used as a variable. Always returned as a string.\\"\\"\\"
            scalar BigInt

            type BigIntAggregateSelectionNonNullable {
              average: BigInt!
              max: BigInt!
              min: BigInt!
              sum: BigInt!
            }

            type CreateFilesMutationResponse {
              files: [File!]!
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

            type File {
              name: String!
              size: BigInt!
            }

            type FileAggregateSelection {
              count: Int!
              name: StringAggregateSelectionNonNullable!
              size: BigIntAggregateSelectionNonNullable!
            }

            input FileCreateInput {
              name: String!
              size: BigInt!
            }

            input FileOptions {
              distinct: Boolean
              limit: Int
              offset: Int
              \\"\\"\\"Specify one or more FileSort objects to sort Files by. The sorts will be applied in the order in which they are arranged in the array.\\"\\"\\"
              sort: [FileSort]
            }

            \\"\\"\\"Fields to sort Files by. The order in which sorts are applied is not guaranteed when specifying many fields in one FileSort object.\\"\\"\\"
            input FileSort {
              name: SortDirection
              size: SortDirection
            }

            input FileUpdateInput {
              name: String
              size: BigInt
            }

            input FileWhere {
              AND: [FileWhere!]
              OR: [FileWhere!]
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
              size: BigInt
              size_GT: BigInt
              size_GTE: BigInt
              size_IN: [BigInt]
              size_LT: BigInt
              size_LTE: BigInt
              size_NOT: BigInt
              size_NOT_IN: [BigInt]
            }

            type Mutation {
              createFiles(input: [FileCreateInput!]!): CreateFilesMutationResponse!
              deleteFiles(where: FileWhere): DeleteInfo!
              updateFiles(update: FileUpdateInput, where: FileWhere): UpdateFilesMutationResponse!
            }

            type Query {
              files(options: FileOptions, where: FileWhere): [File!]!
              filesAggregate(where: FileWhere): FileAggregateSelection!
              filesCount(where: FileWhere): Int!
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

            type UpdateFilesMutationResponse {
              files: [File!]!
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
});
