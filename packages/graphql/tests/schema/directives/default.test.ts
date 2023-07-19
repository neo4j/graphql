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
import { gql } from "graphql-tag";
import { Neo4jGraphQL } from "../../../src";

describe("@default directive", () => {
    test("sets default values in schema", async () => {
        const typeDefs = gql`
            interface UserInterface {
                fromInterface: String! @default(value: "Interface default value")
                toBeOverridden: String! @default(value: "Interface override value")
            }

            type User implements UserInterface {
                id: ID! @default(value: "00000000-00000000-00000000-00000000")
                name: String! @default(value: "Jane Smith")
                verified: Boolean! @default(value: false)
                numberOfFriends: Int! @default(value: 0)
                rating: Float! @default(value: 0.0)
                verifiedDate: DateTime! @default(value: "1970-01-01T00:00:00.000Z")
                fromInterface: String!
                toBeOverridden: String! @default(value: "Overridden value")
                location: Location! @default(value: HERE)
            }

            enum Location {
                HERE
                THERE
                EVERYWHERE
            }
        `;
        const neoSchema = new Neo4jGraphQL({ typeDefs });
        const printedSchema = printSchemaWithDirectives(lexicographicSortSchema(await neoSchema.getSchema()));

        expect(printedSchema).toMatchInlineSnapshot(`
            "schema {
              query: Query
              mutation: Mutation
            }

            type CreateInfo {
              bookmark: String @deprecated(reason: \\"This field has been deprecated because bookmarks are now handled by the driver.\\")
              nodesCreated: Int!
              relationshipsCreated: Int!
            }

            type CreateUsersMutationResponse {
              info: CreateInfo!
              users: [User!]!
            }

            \\"\\"\\"A date and time, represented as an ISO-8601 string\\"\\"\\"
            scalar DateTime

            type DateTimeAggregateSelectionNonNullable {
              max: DateTime!
              min: DateTime!
            }

            type DeleteInfo {
              bookmark: String @deprecated(reason: \\"This field has been deprecated because bookmarks are now handled by the driver.\\")
              nodesDeleted: Int!
              relationshipsDeleted: Int!
            }

            type FloatAggregateSelectionNonNullable {
              average: Float!
              max: Float!
              min: Float!
              sum: Float!
            }

            type IDAggregateSelectionNonNullable {
              longest: ID!
              shortest: ID!
            }

            type IntAggregateSelectionNonNullable {
              average: Float!
              max: Int!
              min: Int!
              sum: Int!
            }

            enum Location {
              EVERYWHERE
              HERE
              THERE
            }

            type Mutation {
              createUsers(input: [UserCreateInput!]!): CreateUsersMutationResponse!
              deleteUsers(where: UserWhere): DeleteInfo!
              updateUsers(update: UserUpdateInput, where: UserWhere): UpdateUsersMutationResponse!
            }

            \\"\\"\\"Pagination information (Relay)\\"\\"\\"
            type PageInfo {
              endCursor: String
              hasNextPage: Boolean!
              hasPreviousPage: Boolean!
              startCursor: String
            }

            type Query {
              users(options: UserOptions, where: UserWhere): [User!]!
              usersAggregate(where: UserWhere): UserAggregateSelection!
              usersConnection(after: String, first: Int, sort: [UserSort], where: UserWhere): UsersConnection!
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

            type UpdateInfo {
              bookmark: String @deprecated(reason: \\"This field has been deprecated because bookmarks are now handled by the driver.\\")
              nodesCreated: Int!
              nodesDeleted: Int!
              relationshipsCreated: Int!
              relationshipsDeleted: Int!
            }

            type UpdateUsersMutationResponse {
              info: UpdateInfo!
              users: [User!]!
            }

            type User implements UserInterface {
              fromInterface: String!
              id: ID!
              location: Location!
              name: String!
              numberOfFriends: Int!
              rating: Float!
              toBeOverridden: String!
              verified: Boolean!
              verifiedDate: DateTime!
            }

            type UserAggregateSelection {
              count: Int!
              fromInterface: StringAggregateSelectionNonNullable!
              id: IDAggregateSelectionNonNullable!
              name: StringAggregateSelectionNonNullable!
              numberOfFriends: IntAggregateSelectionNonNullable!
              rating: FloatAggregateSelectionNonNullable!
              toBeOverridden: StringAggregateSelectionNonNullable!
              verifiedDate: DateTimeAggregateSelectionNonNullable!
            }

            input UserCreateInput {
              fromInterface: String! = \\"Interface default value\\"
              id: ID! = \\"00000000-00000000-00000000-00000000\\"
              location: Location! = HERE
              name: String! = \\"Jane Smith\\"
              numberOfFriends: Int! = 0
              rating: Float! = 0
              toBeOverridden: String! = \\"Overridden value\\"
              verified: Boolean! = false
              verifiedDate: DateTime! = \\"1970-01-01T00:00:00.000Z\\"
            }

            type UserEdge {
              cursor: String!
              node: User!
            }

            interface UserInterface {
              fromInterface: String!
              toBeOverridden: String!
            }

            input UserOptions {
              limit: Int
              offset: Int
              \\"\\"\\"
              Specify one or more UserSort objects to sort Users by. The sorts will be applied in the order in which they are arranged in the array.
              \\"\\"\\"
              sort: [UserSort!]
            }

            \\"\\"\\"
            Fields to sort Users by. The order in which sorts are applied is not guaranteed when specifying many fields in one UserSort object.
            \\"\\"\\"
            input UserSort {
              fromInterface: SortDirection
              id: SortDirection
              location: SortDirection
              name: SortDirection
              numberOfFriends: SortDirection
              rating: SortDirection
              toBeOverridden: SortDirection
              verified: SortDirection
              verifiedDate: SortDirection
            }

            input UserUpdateInput {
              fromInterface: String
              id: ID
              location: Location
              name: String
              numberOfFriends: Int
              numberOfFriends_DECREMENT: Int
              numberOfFriends_INCREMENT: Int
              rating: Float
              rating_ADD: Float
              rating_DIVIDE: Float
              rating_MULTIPLY: Float
              rating_SUBTRACT: Float
              toBeOverridden: String
              verified: Boolean
              verifiedDate: DateTime
            }

            input UserWhere {
              AND: [UserWhere!]
              NOT: UserWhere
              OR: [UserWhere!]
              fromInterface: String
              fromInterface_CONTAINS: String
              fromInterface_ENDS_WITH: String
              fromInterface_IN: [String!]
              fromInterface_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              fromInterface_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              fromInterface_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              fromInterface_NOT_IN: [String!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              fromInterface_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              fromInterface_STARTS_WITH: String
              id: ID
              id_CONTAINS: ID
              id_ENDS_WITH: ID
              id_IN: [ID!]
              id_NOT: ID @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              id_NOT_CONTAINS: ID @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              id_NOT_ENDS_WITH: ID @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              id_NOT_IN: [ID!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              id_NOT_STARTS_WITH: ID @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              id_STARTS_WITH: ID
              location: Location
              location_IN: [Location!]
              location_NOT: Location @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              location_NOT_IN: [Location!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
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
              numberOfFriends: Int
              numberOfFriends_GT: Int
              numberOfFriends_GTE: Int
              numberOfFriends_IN: [Int!]
              numberOfFriends_LT: Int
              numberOfFriends_LTE: Int
              numberOfFriends_NOT: Int @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              numberOfFriends_NOT_IN: [Int!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              rating: Float
              rating_GT: Float
              rating_GTE: Float
              rating_IN: [Float!]
              rating_LT: Float
              rating_LTE: Float
              rating_NOT: Float @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              rating_NOT_IN: [Float!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              toBeOverridden: String
              toBeOverridden_CONTAINS: String
              toBeOverridden_ENDS_WITH: String
              toBeOverridden_IN: [String!]
              toBeOverridden_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              toBeOverridden_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              toBeOverridden_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              toBeOverridden_NOT_IN: [String!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              toBeOverridden_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              toBeOverridden_STARTS_WITH: String
              verified: Boolean
              verifiedDate: DateTime
              verifiedDate_GT: DateTime
              verifiedDate_GTE: DateTime
              verifiedDate_IN: [DateTime!]
              verifiedDate_LT: DateTime
              verifiedDate_LTE: DateTime
              verifiedDate_NOT: DateTime @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              verifiedDate_NOT_IN: [DateTime!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              verified_NOT: Boolean @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
            }

            type UsersConnection {
              edges: [UserEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }"
        `);
    });
});
