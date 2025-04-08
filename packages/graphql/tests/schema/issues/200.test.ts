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

describe("200", () => {
    test("Preserve schema array non null", async () => {
        const typeDefs = gql`
            type Category @node {
                categoryId: ID! @id
                name: String!
                description: String! @default(value: "")
                exampleImageLocations: [String!]
            }
        `;
        const neoSchema = new Neo4jGraphQL({ typeDefs });
        const printedSchema = printSchemaWithDirectives(lexicographicSortSchema(await neoSchema.getSchema()));

        expect(printedSchema).toMatchInlineSnapshot(`
            "schema {
              query: Query
              mutation: Mutation
            }

            type CategoriesConnection {
              aggregate: CategoryAggregate!
              edges: [CategoryEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            type Category {
              categoryId: ID!
              description: String!
              exampleImageLocations: [String!]
              name: String!
            }

            type CategoryAggregate {
              count: Count!
              node: CategoryAggregateNode!
            }

            type CategoryAggregateNode {
              description: StringAggregateSelection!
              name: StringAggregateSelection!
            }

            input CategoryCreateInput {
              description: String! = \\"\\"
              exampleImageLocations: [String!]
              name: String!
            }

            type CategoryEdge {
              cursor: String!
              node: Category!
            }

            \\"\\"\\"
            Fields to sort Categories by. The order in which sorts are applied is not guaranteed when specifying many fields in one CategorySort object.
            \\"\\"\\"
            input CategorySort {
              categoryId: SortDirection
              description: SortDirection
              name: SortDirection
            }

            input CategoryUpdateInput {
              description: StringScalarMutations
              description_SET: String @deprecated(reason: \\"Please use the generic mutation 'description: { set: ... } }' instead.\\")
              exampleImageLocations: ListStringMutations
              exampleImageLocations_POP: Int @deprecated(reason: \\"Please use the generic mutation 'exampleImageLocations: { pop: ... } }' instead.\\")
              exampleImageLocations_PUSH: [String!] @deprecated(reason: \\"Please use the generic mutation 'exampleImageLocations: { push: ... } }' instead.\\")
              exampleImageLocations_SET: [String!] @deprecated(reason: \\"Please use the generic mutation 'exampleImageLocations: { set: ... } }' instead.\\")
              name: StringScalarMutations
              name_SET: String @deprecated(reason: \\"Please use the generic mutation 'name: { set: ... } }' instead.\\")
            }

            input CategoryWhere {
              AND: [CategoryWhere!]
              NOT: CategoryWhere
              OR: [CategoryWhere!]
              categoryId: IDScalarFilters
              categoryId_CONTAINS: ID @deprecated(reason: \\"Please use the relevant generic filter categoryId: { contains: ... }\\")
              categoryId_ENDS_WITH: ID @deprecated(reason: \\"Please use the relevant generic filter categoryId: { endsWith: ... }\\")
              categoryId_EQ: ID @deprecated(reason: \\"Please use the relevant generic filter categoryId: { eq: ... }\\")
              categoryId_IN: [ID!] @deprecated(reason: \\"Please use the relevant generic filter categoryId: { in: ... }\\")
              categoryId_STARTS_WITH: ID @deprecated(reason: \\"Please use the relevant generic filter categoryId: { startsWith: ... }\\")
              description: StringScalarFilters
              description_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter description: { contains: ... }\\")
              description_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter description: { endsWith: ... }\\")
              description_EQ: String @deprecated(reason: \\"Please use the relevant generic filter description: { eq: ... }\\")
              description_IN: [String!] @deprecated(reason: \\"Please use the relevant generic filter description: { in: ... }\\")
              description_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter description: { startsWith: ... }\\")
              exampleImageLocations: StringListFilters
              exampleImageLocations_EQ: [String!] @deprecated(reason: \\"Please use the relevant generic filter exampleImageLocations: { eq: ... }\\")
              exampleImageLocations_INCLUDES: String @deprecated(reason: \\"Please use the relevant generic filter exampleImageLocations: { includes: ... }\\")
              name: StringScalarFilters
              name_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter name: { contains: ... }\\")
              name_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter name: { endsWith: ... }\\")
              name_EQ: String @deprecated(reason: \\"Please use the relevant generic filter name: { eq: ... }\\")
              name_IN: [String!] @deprecated(reason: \\"Please use the relevant generic filter name: { in: ... }\\")
              name_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter name: { startsWith: ... }\\")
            }

            type Count {
              nodes: Int!
            }

            type CreateCategoriesMutationResponse {
              categories: [Category!]!
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

            \\"\\"\\"ID filters\\"\\"\\"
            input IDScalarFilters {
              contains: ID
              endsWith: ID
              eq: ID
              in: [ID!]
              startsWith: ID
            }

            \\"\\"\\"Mutations for a list for String\\"\\"\\"
            input ListStringMutations {
              pop: Int
              push: [String!]
              set: [String!]
            }

            type Mutation {
              createCategories(input: [CategoryCreateInput!]!): CreateCategoriesMutationResponse!
              deleteCategories(where: CategoryWhere): DeleteInfo!
              updateCategories(update: CategoryUpdateInput, where: CategoryWhere): UpdateCategoriesMutationResponse!
            }

            \\"\\"\\"Pagination information (Relay)\\"\\"\\"
            type PageInfo {
              endCursor: String
              hasNextPage: Boolean!
              hasPreviousPage: Boolean!
              startCursor: String
            }

            type Query {
              categories(limit: Int, offset: Int, sort: [CategorySort!], where: CategoryWhere): [Category!]!
              categoriesConnection(after: String, first: Int, sort: [CategorySort!], where: CategoryWhere): CategoriesConnection!
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

            \\"\\"\\"String list filters\\"\\"\\"
            input StringListFilters {
              eq: [String!]
              includes: String
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

            type UpdateCategoriesMutationResponse {
              categories: [Category!]!
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
