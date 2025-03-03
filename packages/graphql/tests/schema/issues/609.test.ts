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

describe("609", () => {
    test("@deprecated directive should remain in output", async () => {
        const typeDefs = gql`
            type Deprecated @node {
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

            type Count {
              nodes: Int!
            }

            type CreateDeprecatedsMutationResponse {
              deprecateds: [Deprecated!]!
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

            type Deprecated {
              deprecatedField: String @deprecated
            }

            type DeprecatedAggregate {
              count: Count!
              node: DeprecatedAggregateNode!
            }

            type DeprecatedAggregateNode {
              deprecatedField: StringAggregateSelection!
            }

            input DeprecatedCreateInput {
              deprecatedField: String @deprecated
            }

            type DeprecatedEdge {
              cursor: String!
              node: Deprecated!
            }

            \\"\\"\\"
            Fields to sort Deprecateds by. The order in which sorts are applied is not guaranteed when specifying many fields in one DeprecatedSort object.
            \\"\\"\\"
            input DeprecatedSort {
              deprecatedField: SortDirection
            }

            input DeprecatedUpdateInput {
              deprecatedField: StringScalarMutations @deprecated
              deprecatedField_SET: String @deprecated
            }

            input DeprecatedWhere {
              AND: [DeprecatedWhere!]
              NOT: DeprecatedWhere
              OR: [DeprecatedWhere!]
              deprecatedField: StringScalarFilters @deprecated
              deprecatedField_CONTAINS: String @deprecated
              deprecatedField_ENDS_WITH: String @deprecated
              deprecatedField_EQ: String @deprecated
              deprecatedField_IN: [String] @deprecated
              deprecatedField_STARTS_WITH: String @deprecated
            }

            type DeprecatedsConnection {
              aggregate: DeprecatedAggregate!
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
              deprecateds(limit: Int, offset: Int, sort: [DeprecatedSort!], where: DeprecatedWhere): [Deprecated!]!
              deprecatedsConnection(after: String, first: Int, sort: [DeprecatedSort!], where: DeprecatedWhere): DeprecatedsConnection!
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

            type UpdateDeprecatedsMutationResponse {
              deprecateds: [Deprecated!]!
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
