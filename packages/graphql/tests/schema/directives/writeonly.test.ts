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

describe("@writeonly directive", () => {
    test("makes a field writeonly", () => {
        const typeDefs = gql`
            type User {
                username: String!
                password: String! @writeonly
            }
        `;
        const neoSchema = new Neo4jGraphQL({ typeDefs });
        const printedSchema = printSchemaWithDirectives(lexicographicSortSchema(neoSchema.schema));

        expect(printedSchema).toMatchInlineSnapshot(`
            "schema {
              query: Query
              mutation: Mutation
              subscription: Subscription
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

            type DeleteInfo {
              bookmark: String
              nodesDeleted: Int!
              relationshipsDeleted: Int!
            }

            type Mutation {
              createUsers(input: [UserCreateInput!]!): CreateUsersMutationResponse!
              deleteUsers(where: UserWhere): DeleteInfo!
              updateUsers(update: UserUpdateInput, where: UserWhere): UpdateUsersMutationResponse!
            }

            enum NodeUpdatedType {
              Connected
              Created
              Deleted
              Disconnected
              Updated
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

            type StringAggregateSelectionNonNullable {
              longest: String!
              shortest: String!
            }

            type Subscription {
              \\"\\"\\"Subscribe to updates from User\\"\\"\\"
              subscribeToUser(filter: SubscriptionFilter, where: UserWhere): UserSubscriptionResponse!
            }

            input SubscriptionFilter {
              handle: String
              handle_IN: [String!]
              handle_NOT: String
              handle_NOT_IN: [String!]
              handle_UNDEFINED: Boolean
              id: Int
              id_IN: [Int!]
              id_NOT: Int
              id_NOT_IN: [Int!]
              id_UNDEFINED: Boolean
              propsUpdated: [String!]
              relationshipID: Int
              relationshipID_IN: [Int!]
              relationshipID_NOT: Int
              relationshipID_NOT_IN: [Int!]
              relationshipID_UNDEFINED: Boolean
              relationshipName: String
              relationshipName_IN: [String!]
              relationshipName_NOT: String
              relationshipName_NOT_IN: [String!]
              relationshipName_UNDEFINED: Boolean
              toID: Int
              toID_IN: [Int!]
              toID_NOT: Int
              toID_NOT_IN: [Int!]
              toID_UNDEFINED: Boolean
              toName: String
              toName_IN: [String!]
              toName_NOT: String
              toName_NOT_IN: [String!]
              toName_UNDEFINED: Boolean
              type: NodeUpdatedType
              type_IN: [NodeUpdatedType!]
              type_NOT: NodeUpdatedType
              type_NOT_IN: [NodeUpdatedType!]
              type_UNDEFINED: Boolean
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

            type User {
              username: String!
            }

            type UserAggregateSelection {
              count: Int!
              password: StringAggregateSelectionNonNullable!
              username: StringAggregateSelectionNonNullable!
            }

            input UserCreateInput {
              password: String!
              username: String!
            }

            input UserOptions {
              limit: Int
              offset: Int
              \\"\\"\\"Specify one or more UserSort objects to sort Users by. The sorts will be applied in the order in which they are arranged in the array.\\"\\"\\"
              sort: [UserSort]
            }

            \\"\\"\\"Fields to sort Users by. The order in which sorts are applied is not guaranteed when specifying many fields in one UserSort object.\\"\\"\\"
            input UserSort {
              password: SortDirection
              username: SortDirection
            }

            type UserSubscriptionResponse {
              id: Int!
              name: String!
              propsUpdated: [String!]
              relationshipID: String
              relationshipName: String
              toID: String
              toName: String
              type: String!
              user: User
            }

            input UserUpdateInput {
              password: String
              username: String
            }

            input UserWhere {
              AND: [UserWhere!]
              OR: [UserWhere!]
              password: String
              password_CONTAINS: String
              password_ENDS_WITH: String
              password_IN: [String]
              password_NOT: String
              password_NOT_CONTAINS: String
              password_NOT_ENDS_WITH: String
              password_NOT_IN: [String]
              password_NOT_STARTS_WITH: String
              password_STARTS_WITH: String
              username: String
              username_CONTAINS: String
              username_ENDS_WITH: String
              username_IN: [String]
              username_NOT: String
              username_NOT_CONTAINS: String
              username_NOT_ENDS_WITH: String
              username_NOT_IN: [String]
              username_NOT_STARTS_WITH: String
              username_STARTS_WITH: String
            }
            "
        `);
    });

    test("makes an inherited field writeonly", () => {
        const typeDefs = gql`
            interface UserInterface {
                username: String!
                password: String! @writeonly
            }

            type User implements UserInterface {
                username: String!
                password: String!
            }
        `;
        const neoSchema = new Neo4jGraphQL({ typeDefs });
        const printedSchema = printSchemaWithDirectives(lexicographicSortSchema(neoSchema.schema));

        expect(printedSchema).toMatchInlineSnapshot(`
            "schema {
              query: Query
              mutation: Mutation
              subscription: Subscription
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

            type DeleteInfo {
              bookmark: String
              nodesDeleted: Int!
              relationshipsDeleted: Int!
            }

            type Mutation {
              createUsers(input: [UserCreateInput!]!): CreateUsersMutationResponse!
              deleteUsers(where: UserWhere): DeleteInfo!
              updateUsers(update: UserUpdateInput, where: UserWhere): UpdateUsersMutationResponse!
            }

            enum NodeUpdatedType {
              Connected
              Created
              Deleted
              Disconnected
              Updated
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

            type StringAggregateSelectionNonNullable {
              longest: String!
              shortest: String!
            }

            type Subscription {
              \\"\\"\\"Subscribe to updates from User\\"\\"\\"
              subscribeToUser(filter: SubscriptionFilter, where: UserWhere): UserSubscriptionResponse!
            }

            input SubscriptionFilter {
              handle: String
              handle_IN: [String!]
              handle_NOT: String
              handle_NOT_IN: [String!]
              handle_UNDEFINED: Boolean
              id: Int
              id_IN: [Int!]
              id_NOT: Int
              id_NOT_IN: [Int!]
              id_UNDEFINED: Boolean
              propsUpdated: [String!]
              relationshipID: Int
              relationshipID_IN: [Int!]
              relationshipID_NOT: Int
              relationshipID_NOT_IN: [Int!]
              relationshipID_UNDEFINED: Boolean
              relationshipName: String
              relationshipName_IN: [String!]
              relationshipName_NOT: String
              relationshipName_NOT_IN: [String!]
              relationshipName_UNDEFINED: Boolean
              toID: Int
              toID_IN: [Int!]
              toID_NOT: Int
              toID_NOT_IN: [Int!]
              toID_UNDEFINED: Boolean
              toName: String
              toName_IN: [String!]
              toName_NOT: String
              toName_NOT_IN: [String!]
              toName_UNDEFINED: Boolean
              type: NodeUpdatedType
              type_IN: [NodeUpdatedType!]
              type_NOT: NodeUpdatedType
              type_NOT_IN: [NodeUpdatedType!]
              type_UNDEFINED: Boolean
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
              username: String!
            }

            type UserAggregateSelection {
              count: Int!
              password: StringAggregateSelectionNonNullable!
              username: StringAggregateSelectionNonNullable!
            }

            input UserCreateInput {
              password: String!
              username: String!
            }

            interface UserInterface {
              username: String!
            }

            input UserOptions {
              limit: Int
              offset: Int
              \\"\\"\\"Specify one or more UserSort objects to sort Users by. The sorts will be applied in the order in which they are arranged in the array.\\"\\"\\"
              sort: [UserSort]
            }

            \\"\\"\\"Fields to sort Users by. The order in which sorts are applied is not guaranteed when specifying many fields in one UserSort object.\\"\\"\\"
            input UserSort {
              password: SortDirection
              username: SortDirection
            }

            type UserSubscriptionResponse {
              id: Int!
              name: String!
              propsUpdated: [String!]
              relationshipID: String
              relationshipName: String
              toID: String
              toName: String
              type: String!
              user: User
            }

            input UserUpdateInput {
              password: String
              username: String
            }

            input UserWhere {
              AND: [UserWhere!]
              OR: [UserWhere!]
              password: String
              password_CONTAINS: String
              password_ENDS_WITH: String
              password_IN: [String]
              password_NOT: String
              password_NOT_CONTAINS: String
              password_NOT_ENDS_WITH: String
              password_NOT_IN: [String]
              password_NOT_STARTS_WITH: String
              password_STARTS_WITH: String
              username: String
              username_CONTAINS: String
              username_ENDS_WITH: String
              username_IN: [String]
              username_NOT: String
              username_NOT_CONTAINS: String
              username_NOT_ENDS_WITH: String
              username_NOT_IN: [String]
              username_NOT_STARTS_WITH: String
              username_STARTS_WITH: String
            }
            "
        `);
    });
});
