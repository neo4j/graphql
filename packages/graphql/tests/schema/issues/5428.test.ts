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
            type Test @plural(value: "Test") @node {
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

            type Count {
              nodes: Int!
            }

            \\"\\"\\"
            Information about the number of nodes and relationships created during a create mutation
            \\"\\"\\"
            type CreateInfo {
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
              test(limit: Int, offset: Int, sort: [TestSort!], where: TestWhere): [Test!]!
              testConnection(after: String, first: Int, sort: [TestSort!], where: TestWhere): TestConnection!
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

            type Test {
              Name: String
            }

            type TestAggregate {
              count: Count!
              node: TestAggregateNode!
            }

            type TestAggregateNode {
              Name: StringAggregateSelection!
            }

            type TestConnection {
              aggregate: TestAggregate!
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

            \\"\\"\\"
            Fields to sort Test by. The order in which sorts are applied is not guaranteed when specifying many fields in one TestSort object.
            \\"\\"\\"
            input TestSort {
              Name: SortDirection
            }

            input TestUpdateInput {
              Name: StringScalarMutations
              Name_SET: String @deprecated(reason: \\"Please use the generic mutation 'Name: { set: ... } }' instead.\\")
            }

            input TestWhere {
              AND: [TestWhere!]
              NOT: TestWhere
              Name: StringScalarFilters
              Name_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter Name: { contains: ... }\\")
              Name_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter Name: { endsWith: ... }\\")
              Name_EQ: String @deprecated(reason: \\"Please use the relevant generic filter Name: { eq: ... }\\")
              Name_IN: [String] @deprecated(reason: \\"Please use the relevant generic filter Name: { in: ... }\\")
              Name_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter Name: { startsWith: ... }\\")
              OR: [TestWhere!]
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

            type UpdateTestMutationResponse {
              info: UpdateInfo!
              test: [Test!]!
            }"
        `);
    });
});
