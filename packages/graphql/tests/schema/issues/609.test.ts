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

describe("609", () => {
    test("@deprecated directive should remain in output", async () => {
        const typeDefs = gql`
            type Deprecated {
                deprecatedField: String @deprecated
            }
        `;
        const neoSchema = new Neo4jGraphQL({ typeDefs });
        const printedSchema = printSchemaWithDirectives(lexicographicSortSchema(await neoSchema.getSchema()));

        expect(printedSchema).toMatchInlineSnapshot(`
            "schema {
              query: Query
              mutation: Mutation
            }

            type CreateDeprecatedsMutationResponse {
              deprecateds: [Deprecated!]!
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

            type Deprecated {
              deprecatedField: String @deprecated
            }

            type DeprecatedAggregateSelection {
              count: Int!
              deprecatedField: StringAggregateSelectionNullable!
            }

            input DeprecatedCreateInput {
              deprecatedField: String @deprecated
            }

            type DeprecatedEdge {
              cursor: String!
              node: Deprecated!
            }

            input DeprecatedOptions {
              limit: Int
              offset: Int
              \\"\\"\\"
              Specify one or more DeprecatedSort objects to sort Deprecateds by. The sorts will be applied in the order in which they are arranged in the array.
              \\"\\"\\"
              sort: [DeprecatedSort!]
            }

            \\"\\"\\"
            Fields to sort Deprecateds by. The order in which sorts are applied is not guaranteed when specifying many fields in one DeprecatedSort object.
            \\"\\"\\"
            input DeprecatedSort {
              deprecatedField: SortDirection @deprecated
            }

            input DeprecatedUpdateInput {
              deprecatedField: String @deprecated
            }

            input DeprecatedWhere {
              AND: [DeprecatedWhere!]
              NOT: DeprecatedWhere
              OR: [DeprecatedWhere!]
              deprecatedField: String @deprecated
              deprecatedField_CONTAINS: String @deprecated
              deprecatedField_ENDS_WITH: String @deprecated
              deprecatedField_IN: [String] @deprecated
              deprecatedField_NOT: String @deprecated
              deprecatedField_NOT_CONTAINS: String @deprecated
              deprecatedField_NOT_ENDS_WITH: String @deprecated
              deprecatedField_NOT_IN: [String] @deprecated
              deprecatedField_NOT_STARTS_WITH: String @deprecated
              deprecatedField_STARTS_WITH: String @deprecated
            }

            type DeprecatedsConnection {
              edges: [DeprecatedEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            type Mutation {
              createDeprecateds(input: [DeprecatedCreateInput!]!): CreateDeprecatedsMutationResponse!
              deleteDeprecateds(where: DeprecatedWhere): DeleteInfo!
              updateDeprecateds(update: DeprecatedUpdateInput, where: DeprecatedWhere): UpdateDeprecatedsMutationResponse!
            }

            \\"\\"\\"Pagination information (Relay)\\"\\"\\"
            type PageInfo {
              endCursor: String
              hasNextPage: Boolean!
              hasPreviousPage: Boolean!
              startCursor: String
            }

            type Query {
              deprecateds(options: DeprecatedOptions, where: DeprecatedWhere): [Deprecated!]!
              deprecatedsAggregate(where: DeprecatedWhere): DeprecatedAggregateSelection!
              deprecatedsConnection(after: String, first: Int, sort: [DeprecatedSort], where: DeprecatedWhere): DeprecatedsConnection!
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

            type UpdateDeprecatedsMutationResponse {
              deprecateds: [Deprecated!]!
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
