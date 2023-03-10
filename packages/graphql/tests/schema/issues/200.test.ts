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

describe("200", () => {
    test("Preserve schema array non null", async () => {
        const typeDefs = gql`
            type Category {
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

            type CategoryAggregateSelection {
              categoryId: IDAggregateSelectionNonNullable!
              count: Int!
              description: StringAggregateSelectionNonNullable!
              name: StringAggregateSelectionNonNullable!
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

            input CategoryOptions {
              limit: Int
              offset: Int
              \\"\\"\\"
              Specify one or more CategorySort objects to sort Categories by. The sorts will be applied in the order in which they are arranged in the array.
              \\"\\"\\"
              sort: [CategorySort!]
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
              description: String
              exampleImageLocations: [String!]
              exampleImageLocations_POP: Int
              exampleImageLocations_PUSH: [String!]
              name: String
            }

            input CategoryWhere {
              AND: [CategoryWhere!]
              NOT: CategoryWhere
              OR: [CategoryWhere!]
              categoryId: ID
              categoryId_CONTAINS: ID
              categoryId_ENDS_WITH: ID
              categoryId_IN: [ID!]
              categoryId_NOT: ID @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              categoryId_NOT_CONTAINS: ID @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              categoryId_NOT_ENDS_WITH: ID @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              categoryId_NOT_IN: [ID!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              categoryId_NOT_STARTS_WITH: ID @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              categoryId_STARTS_WITH: ID
              description: String
              description_CONTAINS: String
              description_ENDS_WITH: String
              description_IN: [String!]
              description_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              description_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              description_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              description_NOT_IN: [String!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              description_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              description_STARTS_WITH: String
              exampleImageLocations: [String!]
              exampleImageLocations_INCLUDES: String
              exampleImageLocations_NOT: [String!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              exampleImageLocations_NOT_INCLUDES: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              name: String
              name_CONTAINS: String
              name_ENDS_WITH: String
              name_IN: [String!]
              name_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              name_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              name_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              name_NOT_IN: [String!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              name_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              name_STARTS_WITH: String
            }

            type CreateCategoriesMutationResponse {
              categories: [Category!]!
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

            type IDAggregateSelectionNonNullable {
              longest: ID!
              shortest: ID!
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
              categories(options: CategoryOptions, where: CategoryWhere): [Category!]!
              categoriesAggregate(where: CategoryWhere): CategoryAggregateSelection!
              categoriesConnection(after: String, first: Int, sort: [CategorySort], where: CategoryWhere): CategoriesConnection!
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

            type UpdateCategoriesMutationResponse {
              categories: [Category!]!
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
