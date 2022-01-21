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
    test("Schema with underscore types", () => {
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

            type CreateSuper_friendsMutationResponse {
              info: CreateInfo!
              super_friends: [super_friend!]!
            }

            type CreateSuper_usersMutationResponse {
              info: CreateInfo!
              super_users: [super_user!]!
            }

            type DeleteInfo {
              bookmark: String
              nodesDeleted: Int!
              relationshipsDeleted: Int!
            }

            type Mutation {
              createSuper_friends(input: [super_friendCreateInput!]!): CreateSuper_friendsMutationResponse!
              createSuper_users(input: [super_userCreateInput!]!): CreateSuper_usersMutationResponse!
              deleteSuper_friends(where: super_friendWhere): DeleteInfo!
              deleteSuper_users(delete: super_userDeleteInput, where: super_userWhere): DeleteInfo!
              updateSuper_friends(update: super_friendUpdateInput, where: super_friendWhere): UpdateSuper_friendsMutationResponse!
              updateSuper_users(connect: super_userConnectInput, create: super_userRelationInput, delete: super_userDeleteInput, disconnect: super_userDisconnectInput, update: super_userUpdateInput, where: super_userWhere): UpdateSuper_usersMutationResponse!
            }

            \\"\\"\\"Pagination information (Relay)\\"\\"\\"
            type PageInfo {
              endCursor: String
              hasNextPage: Boolean!
              hasPreviousPage: Boolean!
              startCursor: String
            }

            type Query {
              super_friends(options: super_friendOptions, where: super_friendWhere): [super_friend!]!
              super_friendsAggregate(where: super_friendWhere): super_friendAggregateSelection!
              super_users(options: super_userOptions, where: super_userWhere): [super_user!]!
              super_usersAggregate(where: super_userWhere): super_userAggregateSelection!
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
              bookmark: String
              nodesCreated: Int!
              nodesDeleted: Int!
              relationshipsCreated: Int!
              relationshipsDeleted: Int!
            }

            type UpdateSuper_friendsMutationResponse {
              info: UpdateInfo!
              super_friends: [super_friend!]!
            }

            type UpdateSuper_usersMutationResponse {
              info: UpdateInfo!
              super_users: [super_user!]!
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

            input super_friendOptions {
              limit: Int
              offset: Int
              \\"\\"\\"
              Specify one or more super_friendSort objects to sort Super_friends by. The sorts will be applied in the order in which they are arranged in the array.
              \\"\\"\\"
              sort: [super_friendSort]
            }

            \\"\\"\\"
            Fields to sort Super_friends by. The order in which sorts are applied is not guaranteed when specifying many fields in one super_friendSort object.
            \\"\\"\\"
            input super_friendSort {
              name: SortDirection
            }

            input super_friendUpdateInput {
              name: String
            }

            input super_friendWhere {
              AND: [super_friendWhere!]
              OR: [super_friendWhere!]
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
            }

            type super_user {
              my_friend(options: super_friendOptions, where: super_friendWhere): [super_friend!]!
              my_friendAggregate(where: super_friendWhere): super_usersuper_friendMy_friendAggregationSelection
              my_friendConnection(after: String, first: Int, sort: [super_userMy_friendConnectionSort!], where: super_userMy_friendConnectionWhere): super_userMy_friendConnection!
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

            input super_userMy_friendAggregateInput {
              AND: [super_userMy_friendAggregateInput!]
              OR: [super_userMy_friendAggregateInput!]
              count: Int
              count_GT: Int
              count_GTE: Int
              count_LT: Int
              count_LTE: Int
              node: super_userMy_friendNodeAggregationWhereInput
            }

            input super_userMy_friendConnectFieldInput {
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
              OR: [super_userMy_friendConnectionWhere!]
              node: super_friendWhere
              node_NOT: super_friendWhere
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
              OR: [super_userMy_friendNodeAggregationWhereInput!]
              name_AVERAGE_EQUAL: Float
              name_AVERAGE_GT: Float
              name_AVERAGE_GTE: Float
              name_AVERAGE_LT: Float
              name_AVERAGE_LTE: Float
              name_EQUAL: String
              name_GT: Int
              name_GTE: Int
              name_LONGEST_EQUAL: Int
              name_LONGEST_GT: Int
              name_LONGEST_GTE: Int
              name_LONGEST_LT: Int
              name_LONGEST_LTE: Int
              name_LT: Int
              name_LTE: Int
              name_SHORTEST_EQUAL: Int
              name_SHORTEST_GT: Int
              name_SHORTEST_GTE: Int
              name_SHORTEST_LT: Int
              name_SHORTEST_LTE: Int
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
              Specify one or more super_userSort objects to sort Super_users by. The sorts will be applied in the order in which they are arranged in the array.
              \\"\\"\\"
              sort: [super_userSort]
            }

            input super_userRelationInput {
              my_friend: [super_userMy_friendCreateFieldInput!]
            }

            \\"\\"\\"
            Fields to sort Super_users by. The order in which sorts are applied is not guaranteed when specifying many fields in one super_userSort object.
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
              OR: [super_userWhere!]
              my_friend: super_friendWhere
              my_friendAggregate: super_userMy_friendAggregateInput
              my_friendConnection: super_userMy_friendConnectionWhere
              my_friendConnection_NOT: super_userMy_friendConnectionWhere
              my_friend_NOT: super_friendWhere
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
