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

describe("@default directive", () => {
    test("sets default values in schema", async () => {
        const typeDefs = gql`
            interface UserInterface {
                fromInterface: String!
                toBeOverridden: String!
            }

            type User implements UserInterface @node {
                id: ID! @default(value: "00000000-00000000-00000000-00000000")
                name: String! @default(value: "Jane Smith")
                verified: Boolean! @default(value: false)
                numberOfFriends: Int! @default(value: 0)
                rating: Float! @default(value: 0.0)
                verifiedDate: DateTime! @default(value: "1970-01-01T00:00:00.000Z")
                fromInterface: String! @default(value: "Interface default value")
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

            \\"\\"\\"
            Information about the number of nodes and relationships created during a create mutation
            \\"\\"\\"
            type CreateInfo {
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
              max: DateTime
              min: DateTime
            }

            \\"\\"\\"
            Information about the number of nodes and relationships deleted during a delete mutation
            \\"\\"\\"
            type DeleteInfo {
              nodesDeleted: Int!
              relationshipsDeleted: Int!
            }

            type FloatAggregateSelection {
              average: Float
              max: Float
              min: Float
              sum: Float
            }

            type IDAggregateSelection {
              longest: ID
              shortest: ID
            }

            type IntAggregateSelection {
              average: Float
              max: Int
              min: Int
              sum: Int
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
              userInterfaces(limit: Int, offset: Int, options: UserInterfaceOptions @deprecated(reason: \\"Query options argument is deprecated, please use pagination arguments like limit, offset and sort instead.\\"), sort: [UserInterfaceSort!], where: UserInterfaceWhere): [UserInterface!]!
              userInterfacesAggregate(where: UserInterfaceWhere): UserInterfaceAggregateSelection!
              userInterfacesConnection(after: String, first: Int, sort: [UserInterfaceSort!], where: UserInterfaceWhere): UserInterfacesConnection!
              users(limit: Int, offset: Int, options: UserOptions @deprecated(reason: \\"Query options argument is deprecated, please use pagination arguments like limit, offset and sort instead.\\"), sort: [UserSort!], where: UserWhere): [User!]!
              usersAggregate(where: UserWhere): UserAggregateSelection!
              usersConnection(after: String, first: Int, sort: [UserSort!], where: UserWhere): UsersConnection!
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

            \\"\\"\\"
            Information about the number of nodes and relationships created and deleted during an update mutation
            \\"\\"\\"
            type UpdateInfo {
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

            type UserInterfaceAggregateSelection {
              count: Int!
              fromInterface: StringAggregateSelection!
              toBeOverridden: StringAggregateSelection!
            }

            type UserInterfaceEdge {
              cursor: String!
              node: UserInterface!
            }

            enum UserInterfaceImplementation {
              User
            }

            input UserInterfaceOptions {
              limit: Int
              offset: Int
              \\"\\"\\"
              Specify one or more UserInterfaceSort objects to sort UserInterfaces by. The sorts will be applied in the order in which they are arranged in the array.
              \\"\\"\\"
              sort: [UserInterfaceSort!]
            }

            \\"\\"\\"
            Fields to sort UserInterfaces by. The order in which sorts are applied is not guaranteed when specifying many fields in one UserInterfaceSort object.
            \\"\\"\\"
            input UserInterfaceSort {
              fromInterface: SortDirection
              toBeOverridden: SortDirection
            }

            input UserInterfaceWhere {
              AND: [UserInterfaceWhere!]
              NOT: UserInterfaceWhere
              OR: [UserInterfaceWhere!]
              fromInterface: String @deprecated(reason: \\"Please use the explicit _EQ version\\")
              fromInterface_CONTAINS: String
              fromInterface_ENDS_WITH: String
              fromInterface_EQ: String
              fromInterface_IN: [String!]
              fromInterface_STARTS_WITH: String
              toBeOverridden: String @deprecated(reason: \\"Please use the explicit _EQ version\\")
              toBeOverridden_CONTAINS: String
              toBeOverridden_ENDS_WITH: String
              toBeOverridden_EQ: String
              toBeOverridden_IN: [String!]
              toBeOverridden_STARTS_WITH: String
              typename_IN: [UserInterfaceImplementation!]
            }

            type UserInterfacesConnection {
              edges: [UserInterfaceEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
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
              fromInterface: String @deprecated(reason: \\"Please use the explicit _EQ version\\")
              fromInterface_CONTAINS: String
              fromInterface_ENDS_WITH: String
              fromInterface_EQ: String
              fromInterface_IN: [String!]
              fromInterface_STARTS_WITH: String
              id: ID @deprecated(reason: \\"Please use the explicit _EQ version\\")
              id_CONTAINS: ID
              id_ENDS_WITH: ID
              id_EQ: ID
              id_IN: [ID!]
              id_STARTS_WITH: ID
              location: Location @deprecated(reason: \\"Please use the explicit _EQ version\\")
              location_EQ: Location
              location_IN: [Location!]
              name: String @deprecated(reason: \\"Please use the explicit _EQ version\\")
              name_CONTAINS: String
              name_ENDS_WITH: String
              name_EQ: String
              name_IN: [String!]
              name_STARTS_WITH: String
              numberOfFriends: Int @deprecated(reason: \\"Please use the explicit _EQ version\\")
              numberOfFriends_EQ: Int
              numberOfFriends_GT: Int
              numberOfFriends_GTE: Int
              numberOfFriends_IN: [Int!]
              numberOfFriends_LT: Int
              numberOfFriends_LTE: Int
              rating: Float @deprecated(reason: \\"Please use the explicit _EQ version\\")
              rating_EQ: Float
              rating_GT: Float
              rating_GTE: Float
              rating_IN: [Float!]
              rating_LT: Float
              rating_LTE: Float
              toBeOverridden: String @deprecated(reason: \\"Please use the explicit _EQ version\\")
              toBeOverridden_CONTAINS: String
              toBeOverridden_ENDS_WITH: String
              toBeOverridden_EQ: String
              toBeOverridden_IN: [String!]
              toBeOverridden_STARTS_WITH: String
              verified: Boolean @deprecated(reason: \\"Please use the explicit _EQ version\\")
              verifiedDate: DateTime @deprecated(reason: \\"Please use the explicit _EQ version\\")
              verifiedDate_EQ: DateTime
              verifiedDate_GT: DateTime
              verifiedDate_GTE: DateTime
              verifiedDate_IN: [DateTime!]
              verifiedDate_LT: DateTime
              verifiedDate_LTE: DateTime
              verified_EQ: Boolean
            }

            type UsersConnection {
              edges: [UserEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }"
        `);
    });
});
