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
import { Neo4jGraphQL } from "../../src";

describe("Pluralize consistency", () => {
    test("Schema with underscore types", async () => {
        const typeDefs = gql`
            type super_user {
                name: String!
                my_friend: [super_friend!]! @relationship(type: "FRIEND", direction: OUT)
            }

            type super_friend {
                name: String!
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
              bookmark: String
              nodesCreated: Int!
              relationshipsCreated: Int!
            }

            type CreateSuperFriendsMutationResponse {
              info: CreateInfo!
              superFriends: [super_friend!]!
            }

            type CreateSuperUsersMutationResponse {
              info: CreateInfo!
              superUsers: [super_user!]!
            }

            type DeleteInfo {
              bookmark: String
              nodesDeleted: Int!
              relationshipsDeleted: Int!
            }

            type Mutation {
              createSuperFriends(input: [super_friendCreateInput!]!): CreateSuperFriendsMutationResponse!
              createSuperUsers(input: [super_userCreateInput!]!): CreateSuperUsersMutationResponse!
              deleteSuperFriends(where: super_friendWhere): DeleteInfo!
              deleteSuperUsers(delete: super_userDeleteInput, where: super_userWhere): DeleteInfo!
              updateSuperFriends(update: super_friendUpdateInput, where: super_friendWhere): UpdateSuperFriendsMutationResponse!
              updateSuperUsers(connect: super_userConnectInput, create: super_userRelationInput, delete: super_userDeleteInput, disconnect: super_userDisconnectInput, update: super_userUpdateInput, where: super_userWhere): UpdateSuperUsersMutationResponse!
            }

            \\"\\"\\"Pagination information (Relay)\\"\\"\\"
            type PageInfo {
              endCursor: String
              hasNextPage: Boolean!
              hasPreviousPage: Boolean!
              startCursor: String
            }

            type Query {
              superFriends(options: super_friendOptions, where: super_friendWhere): [super_friend!]!
              superFriendsAggregate(where: super_friendWhere): super_friendAggregateSelection!
              superFriendsConnection(after: String, first: Int, sort: [super_friendSort], where: super_friendWhere): SuperFriendsConnection!
              superUsers(options: super_userOptions, where: super_userWhere): [super_user!]!
              superUsersAggregate(where: super_userWhere): super_userAggregateSelection!
              superUsersConnection(after: String, first: Int, sort: [super_userSort], where: super_userWhere): SuperUsersConnection!
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

            type SuperFriendsConnection {
              edges: [super_friendEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            type SuperUsersConnection {
              edges: [super_userEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            type UpdateInfo {
              bookmark: String
              nodesCreated: Int!
              nodesDeleted: Int!
              relationshipsCreated: Int!
              relationshipsDeleted: Int!
            }

            type UpdateSuperFriendsMutationResponse {
              info: UpdateInfo!
              superFriends: [super_friend!]!
            }

            type UpdateSuperUsersMutationResponse {
              info: UpdateInfo!
              superUsers: [super_user!]!
            }

            type super_friend {
              name: String!
            }

            type super_friendAggregateSelection {
              count: Int!
              name: StringAggregateSelectionNonNullable!
            }

            input super_friendConnectWhere {
              node: super_friendWhere!
            }

            input super_friendCreateInput {
              name: String!
            }

            type super_friendEdge {
              cursor: String!
              node: super_friend!
            }

            input super_friendOptions {
              limit: Int
              offset: Int
              \\"\\"\\"
              Specify one or more super_friendSort objects to sort SuperFriends by. The sorts will be applied in the order in which they are arranged in the array.
              \\"\\"\\"
              sort: [super_friendSort!]
            }

            \\"\\"\\"
            Fields to sort SuperFriends by. The order in which sorts are applied is not guaranteed when specifying many fields in one super_friendSort object.
            \\"\\"\\"
            input super_friendSort {
              name: SortDirection
            }

            input super_friendUpdateInput {
              name: String
            }

            input super_friendWhere {
              AND: [super_friendWhere!]
              NOT: super_friendWhere
              OR: [super_friendWhere!]
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

            type super_user {
              my_friend(directed: Boolean = true, options: super_friendOptions, where: super_friendWhere): [super_friend!]!
              my_friendAggregate(directed: Boolean = true, where: super_friendWhere): super_usersuper_friendMy_friendAggregationSelection
              my_friendConnection(after: String, directed: Boolean = true, first: Int, sort: [super_userMy_friendConnectionSort!], where: super_userMy_friendConnectionWhere): super_userMy_friendConnection!
              name: String!
            }

            type super_userAggregateSelection {
              count: Int!
              name: StringAggregateSelectionNonNullable!
            }

            input super_userConnectInput {
              my_friend: [super_userMy_friendConnectFieldInput!]
            }

            input super_userCreateInput {
              my_friend: super_userMy_friendFieldInput
              name: String!
            }

            input super_userDeleteInput {
              my_friend: [super_userMy_friendDeleteFieldInput!]
            }

            input super_userDisconnectInput {
              my_friend: [super_userMy_friendDisconnectFieldInput!]
            }

            type super_userEdge {
              cursor: String!
              node: super_user!
            }

            input super_userMy_friendAggregateInput {
              AND: [super_userMy_friendAggregateInput!]
              NOT: super_userMy_friendAggregateInput
              OR: [super_userMy_friendAggregateInput!]
              count: Int
              count_GT: Int
              count_GTE: Int
              count_LT: Int
              count_LTE: Int
              node: super_userMy_friendNodeAggregationWhereInput
            }

            input super_userMy_friendConnectFieldInput {
              \\"\\"\\"
              Whether or not to overwrite any matching relationship with the new properties. Will default to \`false\` in 4.0.0.
              \\"\\"\\"
              overwrite: Boolean! = true
              where: super_friendConnectWhere
            }

            type super_userMy_friendConnection {
              edges: [super_userMy_friendRelationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input super_userMy_friendConnectionSort {
              node: super_friendSort
            }

            input super_userMy_friendConnectionWhere {
              AND: [super_userMy_friendConnectionWhere!]
              NOT: super_userMy_friendConnectionWhere
              OR: [super_userMy_friendConnectionWhere!]
              node: super_friendWhere
              node_NOT: super_friendWhere @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
            }

            input super_userMy_friendCreateFieldInput {
              node: super_friendCreateInput!
            }

            input super_userMy_friendDeleteFieldInput {
              where: super_userMy_friendConnectionWhere
            }

            input super_userMy_friendDisconnectFieldInput {
              where: super_userMy_friendConnectionWhere
            }

            input super_userMy_friendFieldInput {
              connect: [super_userMy_friendConnectFieldInput!]
              create: [super_userMy_friendCreateFieldInput!]
            }

            input super_userMy_friendNodeAggregationWhereInput {
              AND: [super_userMy_friendNodeAggregationWhereInput!]
              NOT: super_userMy_friendNodeAggregationWhereInput
              OR: [super_userMy_friendNodeAggregationWhereInput!]
              name_AVERAGE_EQUAL: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              name_AVERAGE_GT: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              name_AVERAGE_GTE: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              name_AVERAGE_LENGTH_EQUAL: Float
              name_AVERAGE_LENGTH_GT: Float
              name_AVERAGE_LENGTH_GTE: Float
              name_AVERAGE_LENGTH_LT: Float
              name_AVERAGE_LENGTH_LTE: Float
              name_AVERAGE_LT: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              name_AVERAGE_LTE: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              name_EQUAL: String @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              name_GT: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              name_GTE: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              name_LONGEST_EQUAL: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              name_LONGEST_GT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              name_LONGEST_GTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              name_LONGEST_LENGTH_EQUAL: Int
              name_LONGEST_LENGTH_GT: Int
              name_LONGEST_LENGTH_GTE: Int
              name_LONGEST_LENGTH_LT: Int
              name_LONGEST_LENGTH_LTE: Int
              name_LONGEST_LT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              name_LONGEST_LTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              name_LT: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              name_LTE: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              name_SHORTEST_EQUAL: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              name_SHORTEST_GT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              name_SHORTEST_GTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              name_SHORTEST_LENGTH_EQUAL: Int
              name_SHORTEST_LENGTH_GT: Int
              name_SHORTEST_LENGTH_GTE: Int
              name_SHORTEST_LENGTH_LT: Int
              name_SHORTEST_LENGTH_LTE: Int
              name_SHORTEST_LT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              name_SHORTEST_LTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
            }

            type super_userMy_friendRelationship {
              cursor: String!
              node: super_friend!
            }

            input super_userMy_friendUpdateConnectionInput {
              node: super_friendUpdateInput
            }

            input super_userMy_friendUpdateFieldInput {
              connect: [super_userMy_friendConnectFieldInput!]
              create: [super_userMy_friendCreateFieldInput!]
              delete: [super_userMy_friendDeleteFieldInput!]
              disconnect: [super_userMy_friendDisconnectFieldInput!]
              update: super_userMy_friendUpdateConnectionInput
              where: super_userMy_friendConnectionWhere
            }

            input super_userOptions {
              limit: Int
              offset: Int
              \\"\\"\\"
              Specify one or more super_userSort objects to sort SuperUsers by. The sorts will be applied in the order in which they are arranged in the array.
              \\"\\"\\"
              sort: [super_userSort!]
            }

            input super_userRelationInput {
              my_friend: [super_userMy_friendCreateFieldInput!]
            }

            \\"\\"\\"
            Fields to sort SuperUsers by. The order in which sorts are applied is not guaranteed when specifying many fields in one super_userSort object.
            \\"\\"\\"
            input super_userSort {
              name: SortDirection
            }

            input super_userUpdateInput {
              my_friend: [super_userMy_friendUpdateFieldInput!]
              name: String
            }

            input super_userWhere {
              AND: [super_userWhere!]
              NOT: super_userWhere
              OR: [super_userWhere!]
              my_friend: super_friendWhere @deprecated(reason: \\"Use \`my_friend_SOME\` instead.\\")
              my_friendAggregate: super_userMy_friendAggregateInput
              my_friendConnection: super_userMy_friendConnectionWhere @deprecated(reason: \\"Use \`my_friendConnection_SOME\` instead.\\")
              \\"\\"\\"
              Return super_users where all of the related super_userMy_friendConnections match this filter
              \\"\\"\\"
              my_friendConnection_ALL: super_userMy_friendConnectionWhere
              \\"\\"\\"
              Return super_users where none of the related super_userMy_friendConnections match this filter
              \\"\\"\\"
              my_friendConnection_NONE: super_userMy_friendConnectionWhere
              my_friendConnection_NOT: super_userMy_friendConnectionWhere @deprecated(reason: \\"Use \`my_friendConnection_NONE\` instead.\\")
              \\"\\"\\"
              Return super_users where one of the related super_userMy_friendConnections match this filter
              \\"\\"\\"
              my_friendConnection_SINGLE: super_userMy_friendConnectionWhere
              \\"\\"\\"
              Return super_users where some of the related super_userMy_friendConnections match this filter
              \\"\\"\\"
              my_friendConnection_SOME: super_userMy_friendConnectionWhere
              \\"\\"\\"
              Return super_users where all of the related super_friends match this filter
              \\"\\"\\"
              my_friend_ALL: super_friendWhere
              \\"\\"\\"
              Return super_users where none of the related super_friends match this filter
              \\"\\"\\"
              my_friend_NONE: super_friendWhere
              my_friend_NOT: super_friendWhere @deprecated(reason: \\"Use \`my_friend_NONE\` instead.\\")
              \\"\\"\\"
              Return super_users where one of the related super_friends match this filter
              \\"\\"\\"
              my_friend_SINGLE: super_friendWhere
              \\"\\"\\"
              Return super_users where some of the related super_friends match this filter
              \\"\\"\\"
              my_friend_SOME: super_friendWhere
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

            type super_usersuper_friendMy_friendAggregationSelection {
              count: Int!
              node: super_usersuper_friendMy_friendNodeAggregateSelection
            }

            type super_usersuper_friendMy_friendNodeAggregateSelection {
              name: StringAggregateSelectionNonNullable!
            }"
        `);
    });
});
