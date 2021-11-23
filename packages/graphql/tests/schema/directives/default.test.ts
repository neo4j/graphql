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

describe("@default directive", () => {
    test("sets default values in schema", () => {
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
            }
        `;
        const neoSchema = new Neo4jGraphQL({ typeDefs });
        const printedSchema = printSchemaWithDirectives(lexicographicSortSchema(neoSchema.schema));

        expect(printedSchema).toMatchInlineSnapshot(`
            "schema {
              query: Query
              mutation: Mutation
            }

            type CreateInfo {
              bookmark: String
              nodesCreated: Int!
              relationshipsCreated: Int!
            }

            type CreateUsersMutationResponse {
              info: CreateInfo!
              users: [User!]!
            }

            \\"\\"\\"A date and time, represented as an ISO-8601 string\\"\\"\\"
            scalar DateTime

            type DateTimeAggregateSelection {
              max: DateTime!
              min: DateTime!
            }

            type DeleteInfo {
              bookmark: String
              nodesDeleted: Int!
              relationshipsDeleted: Int!
            }

            type FloatAggregateSelection {
              average: Float!
              max: Float!
              min: Float!
              sum: Float!
            }

            type IDAggregateSelection {
              longest: ID!
              shortest: ID!
            }

            type IntAggregateSelection {
              average: Float!
              max: Int!
              min: Int!
              sum: Int!
            }

            type Mutation {
              createUsers(input: [UserCreateInput!]!): CreateUsersMutationResponse!
              deleteUsers(where: UserWhere): DeleteInfo!
              updateUsers(update: UserUpdateInput, where: UserWhere): UpdateUsersMutationResponse!
            }

            type Query {
              users(options: UserOptions, where: UserWhere): [User!]!
              usersAggregate(where: UserWhere): UserAggregateSelection!
              usersCount(where: UserWhere): Int!
            }

            enum SortDirection {
              \\"\\"\\"Sort by field values in ascending order.\\"\\"\\"
              ASC
              \\"\\"\\"Sort by field values in descending order.\\"\\"\\"
              DESC
            }

            type StringAggregateSelection {
              longest: String!
              shortest: String!
            }

            type UpdateInfo {
              bookmark: String
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
              name: String!
              numberOfFriends: Int!
              rating: Float!
              toBeOverridden: String!
              verified: Boolean!
              verifiedDate: DateTime!
            }

            type UserAggregateSelection {
              count: Int!
              fromInterface: StringAggregateSelection!
              id: IDAggregateSelection!
              name: StringAggregateSelection!
              numberOfFriends: IntAggregateSelection!
              rating: FloatAggregateSelection!
              toBeOverridden: StringAggregateSelection!
              verifiedDate: DateTimeAggregateSelection!
            }

            input UserCreateInput {
              fromInterface: String! = \\"Interface default value\\"
              id: ID! = \\"00000000-00000000-00000000-00000000\\"
              name: String! = \\"Jane Smith\\"
              numberOfFriends: Int! = 0
              rating: Float! = 0
              toBeOverridden: String! = \\"Overridden value\\"
              verified: Boolean! = false
              verifiedDate: DateTime! = \\"1970-01-01T00:00:00.000Z\\"
            }

            interface UserInterface {
              fromInterface: String!
              toBeOverridden: String!
            }

            input UserOptions {
              limit: Int
              offset: Int
              \\"\\"\\"Specify one or more UserSort objects to sort Users by. The sorts will be applied in the order in which they are arranged in the array.\\"\\"\\"
              sort: [UserSort]
            }

            \\"\\"\\"Fields to sort Users by. The order in which sorts are applied is not guaranteed when specifying many fields in one UserSort object.\\"\\"\\"
            input UserSort {
              fromInterface: SortDirection
              id: SortDirection
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
              name: String
              numberOfFriends: Int
              rating: Float
              toBeOverridden: String
              verified: Boolean
              verifiedDate: DateTime
            }

            input UserWhere {
              AND: [UserWhere!]
              OR: [UserWhere!]
              fromInterface: String
              fromInterface_CONTAINS: String
              fromInterface_ENDS_WITH: String
              fromInterface_IN: [String]
              fromInterface_NOT: String
              fromInterface_NOT_CONTAINS: String
              fromInterface_NOT_ENDS_WITH: String
              fromInterface_NOT_IN: [String]
              fromInterface_NOT_STARTS_WITH: String
              fromInterface_STARTS_WITH: String
              id: ID
              id_CONTAINS: ID
              id_ENDS_WITH: ID
              id_IN: [ID]
              id_NOT: ID
              id_NOT_CONTAINS: ID
              id_NOT_ENDS_WITH: ID
              id_NOT_IN: [ID]
              id_NOT_STARTS_WITH: ID
              id_STARTS_WITH: ID
              name: String
              name_CONTAINS: String
              name_ENDS_WITH: String
              name_IN: [String]
              name_NOT: String
              name_NOT_CONTAINS: String
              name_NOT_ENDS_WITH: String
              name_NOT_IN: [String]
              name_NOT_STARTS_WITH: String
              name_STARTS_WITH: String
              numberOfFriends: Int
              numberOfFriends_GT: Int
              numberOfFriends_GTE: Int
              numberOfFriends_IN: [Int]
              numberOfFriends_LT: Int
              numberOfFriends_LTE: Int
              numberOfFriends_NOT: Int
              numberOfFriends_NOT_IN: [Int]
              rating: Float
              rating_GT: Float
              rating_GTE: Float
              rating_IN: [Float]
              rating_LT: Float
              rating_LTE: Float
              rating_NOT: Float
              rating_NOT_IN: [Float]
              toBeOverridden: String
              toBeOverridden_CONTAINS: String
              toBeOverridden_ENDS_WITH: String
              toBeOverridden_IN: [String]
              toBeOverridden_NOT: String
              toBeOverridden_NOT_CONTAINS: String
              toBeOverridden_NOT_ENDS_WITH: String
              toBeOverridden_NOT_IN: [String]
              toBeOverridden_NOT_STARTS_WITH: String
              toBeOverridden_STARTS_WITH: String
              verified: Boolean
              verifiedDate: DateTime
              verifiedDate_GT: DateTime
              verifiedDate_GTE: DateTime
              verifiedDate_IN: [DateTime]
              verifiedDate_LT: DateTime
              verifiedDate_LTE: DateTime
              verifiedDate_NOT: DateTime
              verifiedDate_NOT_IN: [DateTime]
              verified_NOT: Boolean
            }
            "
        `);
    });
});
