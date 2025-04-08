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

            \\"\\"\\"Boolean filters\\"\\"\\"
            input BooleanScalarFilters {
              eq: Boolean
            }

            \\"\\"\\"Boolean mutations\\"\\"\\"
            input BooleanScalarMutations {
              set: Boolean
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

            \\"\\"\\"DateTime filters\\"\\"\\"
            input DateTimeScalarFilters {
              eq: DateTime
              gt: DateTime
              gte: DateTime
              in: [DateTime!]
              lt: DateTime
              lte: DateTime
            }

            \\"\\"\\"DateTime mutations\\"\\"\\"
            input DateTimeScalarMutations {
              set: DateTime
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

            \\"\\"\\"Float filters\\"\\"\\"
            input FloatScalarFilters {
              eq: Float
              gt: Float
              gte: Float
              in: [Float!]
              lt: Float
              lte: Float
            }

            \\"\\"\\"Float mutations\\"\\"\\"
            input FloatScalarMutations {
              add: Float
              divide: Float
              multiply: Float
              set: Float
              subtract: Float
            }

            \\"\\"\\"ID filters\\"\\"\\"
            input IDScalarFilters {
              contains: ID
              endsWith: ID
              eq: ID
              in: [ID!]
              startsWith: ID
            }

            \\"\\"\\"ID mutations\\"\\"\\"
            input IDScalarMutations {
              set: ID
            }

            type IntAggregateSelection {
              average: Float
              max: Int
              min: Int
              sum: Int
            }

            \\"\\"\\"Int filters\\"\\"\\"
            input IntScalarFilters {
              eq: Int
              gt: Int
              gte: Int
              in: [Int!]
              lt: Int
              lte: Int
            }

            \\"\\"\\"Int mutations\\"\\"\\"
            input IntScalarMutations {
              add: Int
              set: Int
              subtract: Int
            }

            enum Location {
              EVERYWHERE
              HERE
              THERE
            }

            \\"\\"\\"Location filters\\"\\"\\"
            input LocationEnumScalarFilters {
              eq: Location
              in: [Location!]
            }

            \\"\\"\\"Location mutations\\"\\"\\"
            input LocationEnumScalarMutations {
              set: Location
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
              userInterfaces(limit: Int, offset: Int, sort: [UserInterfaceSort!], where: UserInterfaceWhere): [UserInterface!]!
              userInterfacesConnection(after: String, first: Int, sort: [UserInterfaceSort!], where: UserInterfaceWhere): UserInterfacesConnection!
              users(limit: Int, offset: Int, sort: [UserSort!], where: UserWhere): [User!]!
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

            type UserAggregate {
              count: Count!
              node: UserAggregateNode!
            }

            type UserAggregateNode {
              fromInterface: StringAggregateSelection!
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

            type UserInterfaceAggregate {
              count: Count!
              node: UserInterfaceAggregateNode!
            }

            type UserInterfaceAggregateNode {
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
              fromInterface: StringScalarFilters
              fromInterface_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter fromInterface: { contains: ... }\\")
              fromInterface_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter fromInterface: { endsWith: ... }\\")
              fromInterface_EQ: String @deprecated(reason: \\"Please use the relevant generic filter fromInterface: { eq: ... }\\")
              fromInterface_IN: [String!] @deprecated(reason: \\"Please use the relevant generic filter fromInterface: { in: ... }\\")
              fromInterface_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter fromInterface: { startsWith: ... }\\")
              toBeOverridden: StringScalarFilters
              toBeOverridden_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter toBeOverridden: { contains: ... }\\")
              toBeOverridden_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter toBeOverridden: { endsWith: ... }\\")
              toBeOverridden_EQ: String @deprecated(reason: \\"Please use the relevant generic filter toBeOverridden: { eq: ... }\\")
              toBeOverridden_IN: [String!] @deprecated(reason: \\"Please use the relevant generic filter toBeOverridden: { in: ... }\\")
              toBeOverridden_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter toBeOverridden: { startsWith: ... }\\")
              typename: [UserInterfaceImplementation!]
            }

            type UserInterfacesConnection {
              aggregate: UserInterfaceAggregate!
              edges: [UserInterfaceEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
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
              fromInterface: StringScalarMutations
              fromInterface_SET: String @deprecated(reason: \\"Please use the generic mutation 'fromInterface: { set: ... } }' instead.\\")
              id: IDScalarMutations
              id_SET: ID @deprecated(reason: \\"Please use the generic mutation 'id: { set: ... } }' instead.\\")
              location: LocationEnumScalarMutations
              location_SET: Location @deprecated(reason: \\"Please use the generic mutation 'location: { set: ... } }' instead.\\")
              name: StringScalarMutations
              name_SET: String @deprecated(reason: \\"Please use the generic mutation 'name: { set: ... } }' instead.\\")
              numberOfFriends: IntScalarMutations
              numberOfFriends_DECREMENT: Int @deprecated(reason: \\"Please use the relevant generic mutation 'numberOfFriends: { decrement: ... } }' instead.\\")
              numberOfFriends_INCREMENT: Int @deprecated(reason: \\"Please use the relevant generic mutation 'numberOfFriends: { increment: ... } }' instead.\\")
              numberOfFriends_SET: Int @deprecated(reason: \\"Please use the generic mutation 'numberOfFriends: { set: ... } }' instead.\\")
              rating: FloatScalarMutations
              rating_ADD: Float @deprecated(reason: \\"Please use the relevant generic mutation 'rating: { add: ... } }' instead.\\")
              rating_DIVIDE: Float @deprecated(reason: \\"Please use the relevant generic mutation 'rating: { divide: ... } }' instead.\\")
              rating_MULTIPLY: Float @deprecated(reason: \\"Please use the relevant generic mutation 'rating: { multiply: ... } }' instead.\\")
              rating_SET: Float @deprecated(reason: \\"Please use the generic mutation 'rating: { set: ... } }' instead.\\")
              rating_SUBTRACT: Float @deprecated(reason: \\"Please use the relevant generic mutation 'rating: { subtract: ... } }' instead.\\")
              toBeOverridden: StringScalarMutations
              toBeOverridden_SET: String @deprecated(reason: \\"Please use the generic mutation 'toBeOverridden: { set: ... } }' instead.\\")
              verified: BooleanScalarMutations
              verifiedDate: DateTimeScalarMutations
              verifiedDate_SET: DateTime @deprecated(reason: \\"Please use the generic mutation 'verifiedDate: { set: ... } }' instead.\\")
              verified_SET: Boolean @deprecated(reason: \\"Please use the generic mutation 'verified: { set: ... } }' instead.\\")
            }

            input UserWhere {
              AND: [UserWhere!]
              NOT: UserWhere
              OR: [UserWhere!]
              fromInterface: StringScalarFilters
              fromInterface_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter fromInterface: { contains: ... }\\")
              fromInterface_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter fromInterface: { endsWith: ... }\\")
              fromInterface_EQ: String @deprecated(reason: \\"Please use the relevant generic filter fromInterface: { eq: ... }\\")
              fromInterface_IN: [String!] @deprecated(reason: \\"Please use the relevant generic filter fromInterface: { in: ... }\\")
              fromInterface_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter fromInterface: { startsWith: ... }\\")
              id: IDScalarFilters
              id_CONTAINS: ID @deprecated(reason: \\"Please use the relevant generic filter id: { contains: ... }\\")
              id_ENDS_WITH: ID @deprecated(reason: \\"Please use the relevant generic filter id: { endsWith: ... }\\")
              id_EQ: ID @deprecated(reason: \\"Please use the relevant generic filter id: { eq: ... }\\")
              id_IN: [ID!] @deprecated(reason: \\"Please use the relevant generic filter id: { in: ... }\\")
              id_STARTS_WITH: ID @deprecated(reason: \\"Please use the relevant generic filter id: { startsWith: ... }\\")
              location: LocationEnumScalarFilters
              location_EQ: Location @deprecated(reason: \\"Please use the relevant generic filter location: { eq: ... }\\")
              location_IN: [Location!] @deprecated(reason: \\"Please use the relevant generic filter location: { in: ... }\\")
              name: StringScalarFilters
              name_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter name: { contains: ... }\\")
              name_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter name: { endsWith: ... }\\")
              name_EQ: String @deprecated(reason: \\"Please use the relevant generic filter name: { eq: ... }\\")
              name_IN: [String!] @deprecated(reason: \\"Please use the relevant generic filter name: { in: ... }\\")
              name_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter name: { startsWith: ... }\\")
              numberOfFriends: IntScalarFilters
              numberOfFriends_EQ: Int @deprecated(reason: \\"Please use the relevant generic filter numberOfFriends: { eq: ... }\\")
              numberOfFriends_GT: Int @deprecated(reason: \\"Please use the relevant generic filter numberOfFriends: { gt: ... }\\")
              numberOfFriends_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter numberOfFriends: { gte: ... }\\")
              numberOfFriends_IN: [Int!] @deprecated(reason: \\"Please use the relevant generic filter numberOfFriends: { in: ... }\\")
              numberOfFriends_LT: Int @deprecated(reason: \\"Please use the relevant generic filter numberOfFriends: { lt: ... }\\")
              numberOfFriends_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter numberOfFriends: { lte: ... }\\")
              rating: FloatScalarFilters
              rating_EQ: Float @deprecated(reason: \\"Please use the relevant generic filter rating: { eq: ... }\\")
              rating_GT: Float @deprecated(reason: \\"Please use the relevant generic filter rating: { gt: ... }\\")
              rating_GTE: Float @deprecated(reason: \\"Please use the relevant generic filter rating: { gte: ... }\\")
              rating_IN: [Float!] @deprecated(reason: \\"Please use the relevant generic filter rating: { in: ... }\\")
              rating_LT: Float @deprecated(reason: \\"Please use the relevant generic filter rating: { lt: ... }\\")
              rating_LTE: Float @deprecated(reason: \\"Please use the relevant generic filter rating: { lte: ... }\\")
              toBeOverridden: StringScalarFilters
              toBeOverridden_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter toBeOverridden: { contains: ... }\\")
              toBeOverridden_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter toBeOverridden: { endsWith: ... }\\")
              toBeOverridden_EQ: String @deprecated(reason: \\"Please use the relevant generic filter toBeOverridden: { eq: ... }\\")
              toBeOverridden_IN: [String!] @deprecated(reason: \\"Please use the relevant generic filter toBeOverridden: { in: ... }\\")
              toBeOverridden_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter toBeOverridden: { startsWith: ... }\\")
              verified: BooleanScalarFilters
              verifiedDate: DateTimeScalarFilters
              verifiedDate_EQ: DateTime @deprecated(reason: \\"Please use the relevant generic filter verifiedDate: { eq: ... }\\")
              verifiedDate_GT: DateTime @deprecated(reason: \\"Please use the relevant generic filter verifiedDate: { gt: ... }\\")
              verifiedDate_GTE: DateTime @deprecated(reason: \\"Please use the relevant generic filter verifiedDate: { gte: ... }\\")
              verifiedDate_IN: [DateTime!] @deprecated(reason: \\"Please use the relevant generic filter verifiedDate: { in: ... }\\")
              verifiedDate_LT: DateTime @deprecated(reason: \\"Please use the relevant generic filter verifiedDate: { lt: ... }\\")
              verifiedDate_LTE: DateTime @deprecated(reason: \\"Please use the relevant generic filter verifiedDate: { lte: ... }\\")
              verified_EQ: Boolean @deprecated(reason: \\"Please use the relevant generic filter verified: { eq: ... }\\")
            }

            type UsersConnection {
              aggregate: UserAggregate!
              edges: [UserEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }"
        `);
    });
});
