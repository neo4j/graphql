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
import { Neo4jGraphQL } from "../../../src";

describe("https://github.com/neo4j/graphql/issues/6422", () => {
    test("Mutation operations should not be required for list of Enums or Custom scalar properties", async () => {
        const typeDefs = /* GraphQL */ `
            scalar CustomScalar
            type EnumMutationTest @mutation(operations: [CREATE, UPDATE, DELETE]) @node @subscription(events: []) {
                enumValue: [EnumMutationTestEnumValue!]!
                intValue: [Int!]!
                stringValue: [String!]!
                myScalar: [CustomScalar!]!
            }

            """
            enum test
            """
            enum EnumMutationTestEnumValue {
                ONE
                TWO
                THREE
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

            type CreateEnumMutationTestsMutationResponse {
              enumMutationTests: [EnumMutationTest!]!
              info: CreateInfo!
            }

            \\"\\"\\"
            Information about the number of nodes and relationships created during a create mutation
            \\"\\"\\"
            type CreateInfo {
              nodesCreated: Int!
              relationshipsCreated: Int!
            }

            scalar CustomScalar

            \\"\\"\\"CustomScalar filters\\"\\"\\"
            input CustomScalarListScalarFilters {
              eq: [CustomScalar!]
              includes: CustomScalar
            }

            \\"\\"\\"Mutations for a list for CustomScalar\\"\\"\\"
            input CustomScalarListScalarMutations {
              pop: CustomScalar
              push: [CustomScalar!]
              set: [CustomScalar!]
            }

            \\"\\"\\"
            Information about the number of nodes and relationships deleted during a delete mutation
            \\"\\"\\"
            type DeleteInfo {
              nodesDeleted: Int!
              relationshipsDeleted: Int!
            }

            type EnumMutationTest {
              enumValue: [EnumMutationTestEnumValue!]!
              intValue: [Int!]!
              myScalar: [CustomScalar!]!
              stringValue: [String!]!
            }

            type EnumMutationTestAggregate {
              count: Count!
            }

            input EnumMutationTestCreateInput {
              enumValue: [EnumMutationTestEnumValue!]!
              intValue: [Int!]!
              myScalar: [CustomScalar!]!
              stringValue: [String!]!
            }

            type EnumMutationTestEdge {
              cursor: String!
              node: EnumMutationTest!
            }

            \\"\\"\\"enum test\\"\\"\\"
            enum EnumMutationTestEnumValue {
              ONE
              THREE
              TWO
            }

            \\"\\"\\"EnumMutationTestEnumValue filters\\"\\"\\"
            input EnumMutationTestEnumValueListEnumScalarFilters {
              eq: [EnumMutationTestEnumValue!]
              includes: EnumMutationTestEnumValue
            }

            \\"\\"\\"Mutations for a list for EnumMutationTestEnumValue\\"\\"\\"
            input EnumMutationTestEnumValueListEnumScalarMutations {
              pop: EnumMutationTestEnumValue
              push: [EnumMutationTestEnumValue!]
              set: [EnumMutationTestEnumValue!]
            }

            input EnumMutationTestUpdateInput {
              enumValue: EnumMutationTestEnumValueListEnumScalarMutations
              enumValue_SET: [EnumMutationTestEnumValue!] @deprecated(reason: \\"Please use the generic mutation 'enumValue: { set: ... } }' instead.\\")
              intValue: ListIntMutations
              intValue_POP: Int @deprecated(reason: \\"Please use the generic mutation 'intValue: { pop: ... } }' instead.\\")
              intValue_PUSH: [Int!] @deprecated(reason: \\"Please use the generic mutation 'intValue: { push: ... } }' instead.\\")
              intValue_SET: [Int!] @deprecated(reason: \\"Please use the generic mutation 'intValue: { set: ... } }' instead.\\")
              myScalar: CustomScalarListScalarMutations
              myScalar_SET: [CustomScalar!] @deprecated(reason: \\"Please use the generic mutation 'myScalar: { set: ... } }' instead.\\")
              stringValue: ListStringMutations
              stringValue_POP: Int @deprecated(reason: \\"Please use the generic mutation 'stringValue: { pop: ... } }' instead.\\")
              stringValue_PUSH: [String!] @deprecated(reason: \\"Please use the generic mutation 'stringValue: { push: ... } }' instead.\\")
              stringValue_SET: [String!] @deprecated(reason: \\"Please use the generic mutation 'stringValue: { set: ... } }' instead.\\")
            }

            input EnumMutationTestWhere {
              AND: [EnumMutationTestWhere!]
              NOT: EnumMutationTestWhere
              OR: [EnumMutationTestWhere!]
              enumValue: EnumMutationTestEnumValueListEnumScalarFilters
              enumValue_EQ: [EnumMutationTestEnumValue!] @deprecated(reason: \\"Please use the relevant generic filter enumValue: { eq: ... }\\")
              enumValue_INCLUDES: EnumMutationTestEnumValue @deprecated(reason: \\"Please use the relevant generic filter enumValue: { includes: ... }\\")
              intValue: IntListFilters
              intValue_EQ: [Int!] @deprecated(reason: \\"Please use the relevant generic filter intValue: { eq: ... }\\")
              intValue_INCLUDES: Int @deprecated(reason: \\"Please use the relevant generic filter intValue: { includes: ... }\\")
              myScalar: CustomScalarListScalarFilters
              myScalar_EQ: [CustomScalar!] @deprecated(reason: \\"Please use the relevant generic filter myScalar: { eq: ... }\\")
              myScalar_INCLUDES: CustomScalar @deprecated(reason: \\"Please use the relevant generic filter myScalar: { includes: ... }\\")
              stringValue: StringListFilters
              stringValue_EQ: [String!] @deprecated(reason: \\"Please use the relevant generic filter stringValue: { eq: ... }\\")
              stringValue_INCLUDES: String @deprecated(reason: \\"Please use the relevant generic filter stringValue: { includes: ... }\\")
            }

            type EnumMutationTestsConnection {
              aggregate: EnumMutationTestAggregate!
              edges: [EnumMutationTestEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            \\"\\"\\"Int list filters\\"\\"\\"
            input IntListFilters {
              eq: [Int!]
              includes: Int
            }

            \\"\\"\\"Mutations for a list for Int\\"\\"\\"
            input ListIntMutations {
              pop: Int
              push: [Int!]
              set: [Int!]
            }

            \\"\\"\\"Mutations for a list for String\\"\\"\\"
            input ListStringMutations {
              pop: Int
              push: [String!]
              set: [String!]
            }

            type Mutation {
              createEnumMutationTests(input: [EnumMutationTestCreateInput!]!): CreateEnumMutationTestsMutationResponse!
              deleteEnumMutationTests(where: EnumMutationTestWhere): DeleteInfo!
              updateEnumMutationTests(update: EnumMutationTestUpdateInput, where: EnumMutationTestWhere): UpdateEnumMutationTestsMutationResponse!
            }

            \\"\\"\\"Pagination information (Relay)\\"\\"\\"
            type PageInfo {
              endCursor: String
              hasNextPage: Boolean!
              hasPreviousPage: Boolean!
              startCursor: String
            }

            type Query {
              enumMutationTests(limit: Int, offset: Int, where: EnumMutationTestWhere): [EnumMutationTest!]!
              enumMutationTestsConnection(after: String, first: Int, where: EnumMutationTestWhere): EnumMutationTestsConnection!
            }

            \\"\\"\\"String list filters\\"\\"\\"
            input StringListFilters {
              eq: [String!]
              includes: String
            }

            type UpdateEnumMutationTestsMutationResponse {
              enumMutationTests: [EnumMutationTest!]!
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
