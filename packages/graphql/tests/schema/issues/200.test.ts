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
                categoryId: ID! @id @unique
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
              categoryId: IDAggregateSelection!
              count: Int!
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
              categoryId: ID @deprecated(reason: \\"Please use the explicit _EQ version\\")
              categoryId_CONTAINS: ID
              categoryId_ENDS_WITH: ID
              categoryId_EQ: ID
              categoryId_IN: [ID!]
              categoryId_STARTS_WITH: ID
              description: String @deprecated(reason: \\"Please use the explicit _EQ version\\")
              description_CONTAINS: String
              description_ENDS_WITH: String
              description_EQ: String
              description_IN: [String!]
              description_STARTS_WITH: String
              exampleImageLocations: [String!] @deprecated(reason: \\"Please use the explicit _EQ version\\")
              exampleImageLocations_EQ: [String!]
              exampleImageLocations_INCLUDES: String
              name: String @deprecated(reason: \\"Please use the explicit _EQ version\\")
              name_CONTAINS: String
              name_ENDS_WITH: String
              name_EQ: String
              name_IN: [String!]
              name_STARTS_WITH: String
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

            type IDAggregateSelection {
              longest: ID
              shortest: ID
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
              categories(limit: Int, offset: Int, options: CategoryOptions @deprecated(reason: \\"Query options argument is deprecated, please use pagination arguments like limit, offset and sort instead.\\"), sort: [CategorySort!], where: CategoryWhere): [Category!]!
              categoriesAggregate(where: CategoryWhere): CategoryAggregateSelection!
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
