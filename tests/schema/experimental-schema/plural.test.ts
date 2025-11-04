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

describe("Plural option", () => {
    test("Plural on interface and union", async () => {
        const typeDefs = gql`
            interface Animal @plural(value: "animales") {
                name: String
            }

            type Dog implements Animal {
                name: String
                breed: String
            }

            type Cat {
                queenOf: String
            }

            union Pet @plural(value: "petties") = Dog | Cat
        `;
        const neoSchema = new Neo4jGraphQL({ typeDefs });
        const printedSchema = printSchemaWithDirectives(lexicographicSortSchema(await neoSchema.getSchema()));

        expect(printedSchema).toMatchInlineSnapshot(`
            "schema {
              query: Query
              mutation: Mutation
            }

            interface Animal {
              name: String
            }

            type AnimalAggregateSelection {
              count: Int!
              name: StringAggregateSelection!
            }

            type AnimalEdge {
              cursor: String!
              node: Animal!
            }

            enum AnimalImplementation {
              Dog
            }

            input AnimalOptions {
              limit: Int
              offset: Int
              \\"\\"\\"
              Specify one or more AnimalSort objects to sort Animales by. The sorts will be applied in the order in which they are arranged in the array.
              \\"\\"\\"
              sort: [AnimalSort]
            }

            \\"\\"\\"
            Fields to sort Animales by. The order in which sorts are applied is not guaranteed when specifying many fields in one AnimalSort object.
            \\"\\"\\"
            input AnimalSort {
              name: SortDirection
            }

            input AnimalWhere {
              AND: [AnimalWhere!]
              NOT: AnimalWhere
              OR: [AnimalWhere!]
              name: String
              name_CONTAINS: String
              name_ENDS_WITH: String
              name_IN: [String]
              name_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              name_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              name_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              name_NOT_IN: [String] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              name_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              name_STARTS_WITH: String
              typename_IN: [AnimalImplementation!]
            }

            type AnimalesConnection {
              edges: [AnimalEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            type Cat {
              queenOf: String
            }

            type CatAggregateSelection {
              count: Int!
              queenOf: StringAggregateSelection!
            }

            input CatCreateInput {
              queenOf: String
            }

            type CatEdge {
              cursor: String!
              node: Cat!
            }

            input CatOptions {
              limit: Int
              offset: Int
              \\"\\"\\"
              Specify one or more CatSort objects to sort Cats by. The sorts will be applied in the order in which they are arranged in the array.
              \\"\\"\\"
              sort: [CatSort!]
            }

            \\"\\"\\"
            Fields to sort Cats by. The order in which sorts are applied is not guaranteed when specifying many fields in one CatSort object.
            \\"\\"\\"
            input CatSort {
              queenOf: SortDirection
            }

            input CatUpdateInput {
              queenOf: String
            }

            input CatWhere {
              AND: [CatWhere!]
              NOT: CatWhere
              OR: [CatWhere!]
              queenOf: String
              queenOf_CONTAINS: String
              queenOf_ENDS_WITH: String
              queenOf_IN: [String]
              queenOf_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              queenOf_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              queenOf_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              queenOf_NOT_IN: [String] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              queenOf_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              queenOf_STARTS_WITH: String
            }

            type CatsConnection {
              edges: [CatEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            type CreateCatsMutationResponse {
              cats: [Cat!]!
              info: CreateInfo!
            }

            type CreateDogsMutationResponse {
              dogs: [Dog!]!
              info: CreateInfo!
            }

            \\"\\"\\"
            Information about the number of nodes and relationships created during a create mutation
            \\"\\"\\"
            type CreateInfo {
              bookmark: String @deprecated(reason: \\"This field has been deprecated because bookmarks are now handled by the driver.\\")
              nodesCreated: Int!
              relationshipsCreated: Int!
            }

            \\"\\"\\"
            Information about the number of nodes and relationships deleted during a delete mutation
            \\"\\"\\"
            type DeleteInfo {
              bookmark: String @deprecated(reason: \\"This field has been deprecated because bookmarks are now handled by the driver.\\")
              nodesDeleted: Int!
              relationshipsDeleted: Int!
            }

            type Dog implements Animal {
              breed: String
              name: String
            }

            type DogAggregateSelection {
              breed: StringAggregateSelection!
              count: Int!
              name: StringAggregateSelection!
            }

            input DogCreateInput {
              breed: String
              name: String
            }

            type DogEdge {
              cursor: String!
              node: Dog!
            }

            input DogOptions {
              limit: Int
              offset: Int
              \\"\\"\\"
              Specify one or more DogSort objects to sort Dogs by. The sorts will be applied in the order in which they are arranged in the array.
              \\"\\"\\"
              sort: [DogSort!]
            }

            \\"\\"\\"
            Fields to sort Dogs by. The order in which sorts are applied is not guaranteed when specifying many fields in one DogSort object.
            \\"\\"\\"
            input DogSort {
              breed: SortDirection
              name: SortDirection
            }

            input DogUpdateInput {
              breed: String
              name: String
            }

            input DogWhere {
              AND: [DogWhere!]
              NOT: DogWhere
              OR: [DogWhere!]
              breed: String
              breed_CONTAINS: String
              breed_ENDS_WITH: String
              breed_IN: [String]
              breed_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              breed_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              breed_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              breed_NOT_IN: [String] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              breed_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              breed_STARTS_WITH: String
              name: String
              name_CONTAINS: String
              name_ENDS_WITH: String
              name_IN: [String]
              name_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              name_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              name_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              name_NOT_IN: [String] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              name_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              name_STARTS_WITH: String
            }

            type DogsConnection {
              edges: [DogEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            type Mutation {
              createCats(input: [CatCreateInput!]!): CreateCatsMutationResponse!
              createDogs(input: [DogCreateInput!]!): CreateDogsMutationResponse!
              deleteCats(where: CatWhere): DeleteInfo!
              deleteDogs(where: DogWhere): DeleteInfo!
              updateCats(update: CatUpdateInput, where: CatWhere): UpdateCatsMutationResponse!
              updateDogs(update: DogUpdateInput, where: DogWhere): UpdateDogsMutationResponse!
            }

            \\"\\"\\"Pagination information (Relay)\\"\\"\\"
            type PageInfo {
              endCursor: String
              hasNextPage: Boolean!
              hasPreviousPage: Boolean!
              startCursor: String
            }

            union Pet = Cat | Dog

            input PetWhere {
              Cat: CatWhere
              Dog: DogWhere
            }

            type Query {
              animales(options: AnimalOptions, where: AnimalWhere): [Animal!]!
              animalesAggregate(where: AnimalWhere): AnimalAggregateSelection!
              animalesConnection(after: String, first: Int, sort: [AnimalSort], where: AnimalWhere): AnimalesConnection!
              cats(options: CatOptions, where: CatWhere): [Cat!]!
              catsAggregate(where: CatWhere): CatAggregateSelection!
              catsConnection(after: String, first: Int, sort: [CatSort], where: CatWhere): CatsConnection!
              dogs(options: DogOptions, where: DogWhere): [Dog!]!
              dogsAggregate(where: DogWhere): DogAggregateSelection!
              dogsConnection(after: String, first: Int, sort: [DogSort], where: DogWhere): DogsConnection!
              petties(options: QueryOptions, where: PetWhere): [Pet!]!
            }

            \\"\\"\\"Input type for options that can be specified on a query operation.\\"\\"\\"
            input QueryOptions {
              limit: Int
              offset: Int
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

            type UpdateCatsMutationResponse {
              cats: [Cat!]!
              info: UpdateInfo!
            }

            type UpdateDogsMutationResponse {
              dogs: [Dog!]!
              info: UpdateInfo!
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
            }"
        `);
    });
});
