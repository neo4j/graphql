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

describe("https://github.com/neo4j/graphql/issues/5428", () => {
    test("Non plural value in should not be pluralized", async () => {
        const typeDefs = gql`
            type Test @plural(value: "Test") {
                Name: String
            }
        `;
        const neoSchema = new Neo4jGraphQL({
            typeDefs,
        });
        const printedSchema = printSchemaWithDirectives(lexicographicSortSchema(await neoSchema.getSchema()));

        expect(printedSchema).toMatchInlineSnapshot(`
            "schema {
              query: Query
              mutation: Mutation
            }

            \\"\\"\\"
            Information about the number of nodes and relationships created during a create mutation
            \\"\\"\\"
            type CreateInfo {
              bookmark: String @deprecated(reason: \\"This field has been deprecated because bookmarks are now handled by the driver.\\")
              nodesCreated: Int!
              relationshipsCreated: Int!
            }

            type CreateTestMutationResponse {
              info: CreateInfo!
              test: [Test!]!
            }

            \\"\\"\\"
            Information about the number of nodes and relationships deleted during a delete mutation
            \\"\\"\\"
            type DeleteInfo {
              bookmark: String @deprecated(reason: \\"This field has been deprecated because bookmarks are now handled by the driver.\\")
              nodesDeleted: Int!
              relationshipsDeleted: Int!
            }

            type Mutation {
              createTest(input: [TestCreateInput!]!): CreateTestMutationResponse!
              deleteTest(where: TestWhere): DeleteInfo!
              updateTest(update: TestUpdateInput, where: TestWhere): UpdateTestMutationResponse!
            }

            \\"\\"\\"Pagination information (Relay)\\"\\"\\"
            type PageInfo {
              endCursor: String
              hasNextPage: Boolean!
              hasPreviousPage: Boolean!
              startCursor: String
            }

            type Query {
              test(options: TestOptions, where: TestWhere): [Test!]!
              testAggregate(where: TestWhere): TestAggregateSelection!
              testConnection(after: String, first: Int, sort: [TestSort], where: TestWhere): TestConnection!
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

            type Test {
              Name: String
            }

            type TestAggregateSelection {
              Name: StringAggregateSelection!
              count: Int!
            }

            type TestConnection {
              edges: [TestEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input TestCreateInput {
              Name: String
            }

            type TestEdge {
              cursor: String!
              node: Test!
            }

            input TestOptions {
              limit: Int
              offset: Int
              \\"\\"\\"
              Specify one or more TestSort objects to sort Test by. The sorts will be applied in the order in which they are arranged in the array.
              \\"\\"\\"
              sort: [TestSort!]
            }

            \\"\\"\\"
            Fields to sort Test by. The order in which sorts are applied is not guaranteed when specifying many fields in one TestSort object.
            \\"\\"\\"
            input TestSort {
              Name: SortDirection
            }

            input TestUpdateInput {
              Name: String
            }

            input TestWhere {
              AND: [TestWhere!]
              NOT: TestWhere
              Name: String
              Name_CONTAINS: String
              Name_ENDS_WITH: String
              Name_IN: [String]
              Name_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              Name_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              Name_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              Name_NOT_IN: [String] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              Name_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              Name_STARTS_WITH: String
              OR: [TestWhere!]
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

            type UpdateTestMutationResponse {
              info: UpdateInfo!
              test: [Test!]!
            }"
        `);
    });
});
