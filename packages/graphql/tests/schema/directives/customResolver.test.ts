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

describe("@customResolver directive", () => {
    test("passes fields directly through with no generation", async () => {
        const typeDefs = gql`
            interface UserInterface {
                customResolver: String
            }

            type User implements UserInterface @node {
                id: ID!
                username: String!
                password: String!
                nickname: String! @customResolver
                customResolver: String @customResolver
            }
        `;

        const resolvers = {
            User: {
                nickname: () => "The user's nickname",
                customResolver: () => "Custom resolver output",
            },
        };

        const neoSchema = new Neo4jGraphQL({ typeDefs, resolvers });
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

            type CreateUsersMutationResponse {
              info: CreateInfo!
              users: [User!]!
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

            \\"\\"\\"ID mutations\\"\\"\\"
            input IDScalarMutations {
              set: ID
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
              customResolver: String
              id: ID!
              nickname: String!
              password: String!
              username: String!
            }

            type UserAggregate {
              count: Count!
              node: UserAggregateNode!
            }

            type UserAggregateNode {
              password: StringAggregateSelection!
              username: StringAggregateSelection!
            }

            input UserCreateInput {
              id: ID!
              password: String!
              username: String!
            }

            type UserEdge {
              cursor: String!
              node: User!
            }

            interface UserInterface {
              customResolver: String
            }

            type UserInterfaceAggregate {
              count: Count!
              node: UserInterfaceAggregateNode!
            }

            type UserInterfaceAggregateNode {
              customResolver: StringAggregateSelection!
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
              customResolver: SortDirection
            }

            input UserInterfaceWhere {
              AND: [UserInterfaceWhere!]
              NOT: UserInterfaceWhere
              OR: [UserInterfaceWhere!]
              customResolver: StringScalarFilters
              customResolver_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter customResolver: { contains: ... }\\")
              customResolver_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter customResolver: { endsWith: ... }\\")
              customResolver_EQ: String @deprecated(reason: \\"Please use the relevant generic filter customResolver: { eq: ... }\\")
              customResolver_IN: [String] @deprecated(reason: \\"Please use the relevant generic filter customResolver: { in: ... }\\")
              customResolver_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter customResolver: { startsWith: ... }\\")
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
              id: SortDirection
              password: SortDirection
              username: SortDirection
            }

            input UserUpdateInput {
              id: IDScalarMutations
              id_SET: ID @deprecated(reason: \\"Please use the generic mutation 'id: { set: ... } }' instead.\\")
              password: StringScalarMutations
              password_SET: String @deprecated(reason: \\"Please use the generic mutation 'password: { set: ... } }' instead.\\")
              username: StringScalarMutations
              username_SET: String @deprecated(reason: \\"Please use the generic mutation 'username: { set: ... } }' instead.\\")
            }

            input UserWhere {
              AND: [UserWhere!]
              NOT: UserWhere
              OR: [UserWhere!]
              id: IDScalarFilters
              id_CONTAINS: ID @deprecated(reason: \\"Please use the relevant generic filter id: { contains: ... }\\")
              id_ENDS_WITH: ID @deprecated(reason: \\"Please use the relevant generic filter id: { endsWith: ... }\\")
              id_EQ: ID @deprecated(reason: \\"Please use the relevant generic filter id: { eq: ... }\\")
              id_IN: [ID!] @deprecated(reason: \\"Please use the relevant generic filter id: { in: ... }\\")
              id_STARTS_WITH: ID @deprecated(reason: \\"Please use the relevant generic filter id: { startsWith: ... }\\")
              password: StringScalarFilters
              password_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter password: { contains: ... }\\")
              password_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter password: { endsWith: ... }\\")
              password_EQ: String @deprecated(reason: \\"Please use the relevant generic filter password: { eq: ... }\\")
              password_IN: [String!] @deprecated(reason: \\"Please use the relevant generic filter password: { in: ... }\\")
              password_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter password: { startsWith: ... }\\")
              username: StringScalarFilters
              username_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter username: { contains: ... }\\")
              username_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter username: { endsWith: ... }\\")
              username_EQ: String @deprecated(reason: \\"Please use the relevant generic filter username: { eq: ... }\\")
              username_IN: [String!] @deprecated(reason: \\"Please use the relevant generic filter username: { in: ... }\\")
              username_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter username: { startsWith: ... }\\")
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
