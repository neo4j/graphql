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
import { Neo4jGraphQL } from "../../src";

describe("Query Direction", () => {
    test("DEFAULT_UNDIRECTED", async () => {
        const typeDefs = gql`
            type User @node {
                name: String!
                friends: [User!]!
                    @relationship(type: "FRIENDS_WITH", direction: OUT, queryDirection: DEFAULT_UNDIRECTED)
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

            \\"\\"\\"
            Information about the number of nodes and relationships deleted during a delete mutation
            \\"\\"\\"
            type DeleteInfo {
              nodesDeleted: Int!
              relationshipsDeleted: Int!
            }

            type Mutation {
              createUsers(input: [UserCreateInput!]!): CreateUsersMutationResponse!
              deleteUsers(delete: UserDeleteInput, where: UserWhere): DeleteInfo!
              updateUsers(connect: UserConnectInput @deprecated(reason: \\"Top level connect input argument in update is deprecated. Use the nested connect field in the relationship within the update argument\\"), create: UserRelationInput @deprecated(reason: \\"Top level create input argument in update is deprecated. Use the nested create field in the relationship within the update argument\\"), delete: UserDeleteInput @deprecated(reason: \\"Top level delete input argument in update is deprecated. Use the nested delete field in the relationship within the update argument\\"), disconnect: UserDisconnectInput @deprecated(reason: \\"Top level disconnect input argument in update is deprecated. Use the nested disconnect field in the relationship within the update argument\\"), update: UserUpdateInput, where: UserWhere): UpdateUsersMutationResponse!
            }

            \\"\\"\\"Pagination information (Relay)\\"\\"\\"
            type PageInfo {
              endCursor: String
              hasNextPage: Boolean!
              hasPreviousPage: Boolean!
              startCursor: String
            }

            type Query {
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

            type User {
              friends(directed: Boolean = false, limit: Int, offset: Int, options: UserOptions @deprecated(reason: \\"Query options argument is deprecated, please use pagination arguments like limit, offset and sort instead.\\"), sort: [UserSort!], where: UserWhere): [User!]!
              friendsAggregate(directed: Boolean = false, where: UserWhere): UserUserFriendsAggregationSelection
              friendsConnection(after: String, directed: Boolean = false, first: Int, sort: [UserFriendsConnectionSort!], where: UserFriendsConnectionWhere): UserFriendsConnection!
              name: String!
            }

            type UserAggregateSelection {
              count: Int!
              name: StringAggregateSelection!
            }

            input UserConnectInput {
              friends: [UserFriendsConnectFieldInput!]
            }

            input UserConnectWhere {
              node: UserWhere!
            }

            input UserCreateInput {
              friends: UserFriendsFieldInput
              name: String!
            }

            input UserDeleteInput {
              friends: [UserFriendsDeleteFieldInput!]
            }

            input UserDisconnectInput {
              friends: [UserFriendsDisconnectFieldInput!]
            }

            type UserEdge {
              cursor: String!
              node: User!
            }

            input UserFriendsAggregateInput {
              AND: [UserFriendsAggregateInput!]
              NOT: UserFriendsAggregateInput
              OR: [UserFriendsAggregateInput!]
              count: Int @deprecated(reason: \\"Please use the explicit _EQ version\\")
              count_EQ: Int
              count_GT: Int
              count_GTE: Int
              count_LT: Int
              count_LTE: Int
              node: UserFriendsNodeAggregationWhereInput
            }

            input UserFriendsConnectFieldInput {
              connect: [UserConnectInput!]
              \\"\\"\\"
              Whether or not to overwrite any matching relationship with the new properties.
              \\"\\"\\"
              overwrite: Boolean! = true
              where: UserConnectWhere
            }

            type UserFriendsConnection {
              edges: [UserFriendsRelationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input UserFriendsConnectionSort {
              node: UserSort
            }

            input UserFriendsConnectionWhere {
              AND: [UserFriendsConnectionWhere!]
              NOT: UserFriendsConnectionWhere
              OR: [UserFriendsConnectionWhere!]
              node: UserWhere
            }

            input UserFriendsCreateFieldInput {
              node: UserCreateInput!
            }

            input UserFriendsDeleteFieldInput {
              delete: UserDeleteInput
              where: UserFriendsConnectionWhere
            }

            input UserFriendsDisconnectFieldInput {
              disconnect: UserDisconnectInput
              where: UserFriendsConnectionWhere
            }

            input UserFriendsFieldInput {
              connect: [UserFriendsConnectFieldInput!]
              create: [UserFriendsCreateFieldInput!]
            }

            input UserFriendsNodeAggregationWhereInput {
              AND: [UserFriendsNodeAggregationWhereInput!]
              NOT: UserFriendsNodeAggregationWhereInput
              OR: [UserFriendsNodeAggregationWhereInput!]
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

            type UserFriendsRelationship {
              cursor: String!
              node: User!
            }

            input UserFriendsUpdateConnectionInput {
              node: UserUpdateInput
            }

            input UserFriendsUpdateFieldInput {
              connect: [UserFriendsConnectFieldInput!]
              create: [UserFriendsCreateFieldInput!]
              delete: [UserFriendsDeleteFieldInput!]
              disconnect: [UserFriendsDisconnectFieldInput!]
              update: UserFriendsUpdateConnectionInput
              where: UserFriendsConnectionWhere
            }

            input UserOptions {
              limit: Int
              offset: Int
              \\"\\"\\"
              Specify one or more UserSort objects to sort Users by. The sorts will be applied in the order in which they are arranged in the array.
              \\"\\"\\"
              sort: [UserSort!]
            }

            input UserRelationInput {
              friends: [UserFriendsCreateFieldInput!]
            }

            \\"\\"\\"
            Fields to sort Users by. The order in which sorts are applied is not guaranteed when specifying many fields in one UserSort object.
            \\"\\"\\"
            input UserSort {
              name: SortDirection
            }

            input UserUpdateInput {
              friends: [UserFriendsUpdateFieldInput!]
              name: String
            }

            type UserUserFriendsAggregationSelection {
              count: Int!
              node: UserUserFriendsNodeAggregateSelection
            }

            type UserUserFriendsNodeAggregateSelection {
              name: StringAggregateSelection!
            }

            input UserWhere {
              AND: [UserWhere!]
              NOT: UserWhere
              OR: [UserWhere!]
              friends: UserWhere @deprecated(reason: \\"Use \`friends_SOME\` instead.\\")
              friendsAggregate: UserFriendsAggregateInput
              friendsConnection: UserFriendsConnectionWhere @deprecated(reason: \\"Use \`friendsConnection_SOME\` instead.\\")
              \\"\\"\\"
              Return Users where all of the related UserFriendsConnections match this filter
              \\"\\"\\"
              friendsConnection_ALL: UserFriendsConnectionWhere
              \\"\\"\\"
              Return Users where none of the related UserFriendsConnections match this filter
              \\"\\"\\"
              friendsConnection_NONE: UserFriendsConnectionWhere
              \\"\\"\\"
              Return Users where one of the related UserFriendsConnections match this filter
              \\"\\"\\"
              friendsConnection_SINGLE: UserFriendsConnectionWhere
              \\"\\"\\"
              Return Users where some of the related UserFriendsConnections match this filter
              \\"\\"\\"
              friendsConnection_SOME: UserFriendsConnectionWhere
              \\"\\"\\"Return Users where all of the related Users match this filter\\"\\"\\"
              friends_ALL: UserWhere
              \\"\\"\\"Return Users where none of the related Users match this filter\\"\\"\\"
              friends_NONE: UserWhere
              \\"\\"\\"Return Users where one of the related Users match this filter\\"\\"\\"
              friends_SINGLE: UserWhere
              \\"\\"\\"Return Users where some of the related Users match this filter\\"\\"\\"
              friends_SOME: UserWhere
              name: String @deprecated(reason: \\"Please use the explicit _EQ version\\")
              name_CONTAINS: String
              name_ENDS_WITH: String
              name_EQ: String
              name_IN: [String!]
              name_STARTS_WITH: String
            }

            type UsersConnection {
              edges: [UserEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }"
        `);
    });

    test("DIRECTED_ONLY", async () => {
        const typeDefs = gql`
            type User @node {
                name: String!
                friends: [User!]! @relationship(type: "FRIENDS_WITH", direction: OUT, queryDirection: DIRECTED_ONLY)
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

            \\"\\"\\"
            Information about the number of nodes and relationships deleted during a delete mutation
            \\"\\"\\"
            type DeleteInfo {
              nodesDeleted: Int!
              relationshipsDeleted: Int!
            }

            type Mutation {
              createUsers(input: [UserCreateInput!]!): CreateUsersMutationResponse!
              deleteUsers(delete: UserDeleteInput, where: UserWhere): DeleteInfo!
              updateUsers(connect: UserConnectInput @deprecated(reason: \\"Top level connect input argument in update is deprecated. Use the nested connect field in the relationship within the update argument\\"), create: UserRelationInput @deprecated(reason: \\"Top level create input argument in update is deprecated. Use the nested create field in the relationship within the update argument\\"), delete: UserDeleteInput @deprecated(reason: \\"Top level delete input argument in update is deprecated. Use the nested delete field in the relationship within the update argument\\"), disconnect: UserDisconnectInput @deprecated(reason: \\"Top level disconnect input argument in update is deprecated. Use the nested disconnect field in the relationship within the update argument\\"), update: UserUpdateInput, where: UserWhere): UpdateUsersMutationResponse!
            }

            \\"\\"\\"Pagination information (Relay)\\"\\"\\"
            type PageInfo {
              endCursor: String
              hasNextPage: Boolean!
              hasPreviousPage: Boolean!
              startCursor: String
            }

            type Query {
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

            type User {
              friends(limit: Int, offset: Int, options: UserOptions @deprecated(reason: \\"Query options argument is deprecated, please use pagination arguments like limit, offset and sort instead.\\"), sort: [UserSort!], where: UserWhere): [User!]!
              friendsAggregate(where: UserWhere): UserUserFriendsAggregationSelection
              friendsConnection(after: String, first: Int, sort: [UserFriendsConnectionSort!], where: UserFriendsConnectionWhere): UserFriendsConnection!
              name: String!
            }

            type UserAggregateSelection {
              count: Int!
              name: StringAggregateSelection!
            }

            input UserConnectInput {
              friends: [UserFriendsConnectFieldInput!]
            }

            input UserConnectWhere {
              node: UserWhere!
            }

            input UserCreateInput {
              friends: UserFriendsFieldInput
              name: String!
            }

            input UserDeleteInput {
              friends: [UserFriendsDeleteFieldInput!]
            }

            input UserDisconnectInput {
              friends: [UserFriendsDisconnectFieldInput!]
            }

            type UserEdge {
              cursor: String!
              node: User!
            }

            input UserFriendsAggregateInput {
              AND: [UserFriendsAggregateInput!]
              NOT: UserFriendsAggregateInput
              OR: [UserFriendsAggregateInput!]
              count: Int @deprecated(reason: \\"Please use the explicit _EQ version\\")
              count_EQ: Int
              count_GT: Int
              count_GTE: Int
              count_LT: Int
              count_LTE: Int
              node: UserFriendsNodeAggregationWhereInput
            }

            input UserFriendsConnectFieldInput {
              connect: [UserConnectInput!]
              \\"\\"\\"
              Whether or not to overwrite any matching relationship with the new properties.
              \\"\\"\\"
              overwrite: Boolean! = true
              where: UserConnectWhere
            }

            type UserFriendsConnection {
              edges: [UserFriendsRelationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input UserFriendsConnectionSort {
              node: UserSort
            }

            input UserFriendsConnectionWhere {
              AND: [UserFriendsConnectionWhere!]
              NOT: UserFriendsConnectionWhere
              OR: [UserFriendsConnectionWhere!]
              node: UserWhere
            }

            input UserFriendsCreateFieldInput {
              node: UserCreateInput!
            }

            input UserFriendsDeleteFieldInput {
              delete: UserDeleteInput
              where: UserFriendsConnectionWhere
            }

            input UserFriendsDisconnectFieldInput {
              disconnect: UserDisconnectInput
              where: UserFriendsConnectionWhere
            }

            input UserFriendsFieldInput {
              connect: [UserFriendsConnectFieldInput!]
              create: [UserFriendsCreateFieldInput!]
            }

            input UserFriendsNodeAggregationWhereInput {
              AND: [UserFriendsNodeAggregationWhereInput!]
              NOT: UserFriendsNodeAggregationWhereInput
              OR: [UserFriendsNodeAggregationWhereInput!]
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

            type UserFriendsRelationship {
              cursor: String!
              node: User!
            }

            input UserFriendsUpdateConnectionInput {
              node: UserUpdateInput
            }

            input UserFriendsUpdateFieldInput {
              connect: [UserFriendsConnectFieldInput!]
              create: [UserFriendsCreateFieldInput!]
              delete: [UserFriendsDeleteFieldInput!]
              disconnect: [UserFriendsDisconnectFieldInput!]
              update: UserFriendsUpdateConnectionInput
              where: UserFriendsConnectionWhere
            }

            input UserOptions {
              limit: Int
              offset: Int
              \\"\\"\\"
              Specify one or more UserSort objects to sort Users by. The sorts will be applied in the order in which they are arranged in the array.
              \\"\\"\\"
              sort: [UserSort!]
            }

            input UserRelationInput {
              friends: [UserFriendsCreateFieldInput!]
            }

            \\"\\"\\"
            Fields to sort Users by. The order in which sorts are applied is not guaranteed when specifying many fields in one UserSort object.
            \\"\\"\\"
            input UserSort {
              name: SortDirection
            }

            input UserUpdateInput {
              friends: [UserFriendsUpdateFieldInput!]
              name: String
            }

            type UserUserFriendsAggregationSelection {
              count: Int!
              node: UserUserFriendsNodeAggregateSelection
            }

            type UserUserFriendsNodeAggregateSelection {
              name: StringAggregateSelection!
            }

            input UserWhere {
              AND: [UserWhere!]
              NOT: UserWhere
              OR: [UserWhere!]
              friends: UserWhere @deprecated(reason: \\"Use \`friends_SOME\` instead.\\")
              friendsAggregate: UserFriendsAggregateInput
              friendsConnection: UserFriendsConnectionWhere @deprecated(reason: \\"Use \`friendsConnection_SOME\` instead.\\")
              \\"\\"\\"
              Return Users where all of the related UserFriendsConnections match this filter
              \\"\\"\\"
              friendsConnection_ALL: UserFriendsConnectionWhere
              \\"\\"\\"
              Return Users where none of the related UserFriendsConnections match this filter
              \\"\\"\\"
              friendsConnection_NONE: UserFriendsConnectionWhere
              \\"\\"\\"
              Return Users where one of the related UserFriendsConnections match this filter
              \\"\\"\\"
              friendsConnection_SINGLE: UserFriendsConnectionWhere
              \\"\\"\\"
              Return Users where some of the related UserFriendsConnections match this filter
              \\"\\"\\"
              friendsConnection_SOME: UserFriendsConnectionWhere
              \\"\\"\\"Return Users where all of the related Users match this filter\\"\\"\\"
              friends_ALL: UserWhere
              \\"\\"\\"Return Users where none of the related Users match this filter\\"\\"\\"
              friends_NONE: UserWhere
              \\"\\"\\"Return Users where one of the related Users match this filter\\"\\"\\"
              friends_SINGLE: UserWhere
              \\"\\"\\"Return Users where some of the related Users match this filter\\"\\"\\"
              friends_SOME: UserWhere
              name: String @deprecated(reason: \\"Please use the explicit _EQ version\\")
              name_CONTAINS: String
              name_ENDS_WITH: String
              name_EQ: String
              name_IN: [String!]
              name_STARTS_WITH: String
            }

            type UsersConnection {
              edges: [UserEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }"
        `);
    });

    test("UNDIRECTED_ONLY", async () => {
        const typeDefs = gql`
            type User @node {
                name: String!
                friends: [User!]! @relationship(type: "FRIENDS_WITH", direction: OUT, queryDirection: UNDIRECTED_ONLY)
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

            \\"\\"\\"
            Information about the number of nodes and relationships deleted during a delete mutation
            \\"\\"\\"
            type DeleteInfo {
              nodesDeleted: Int!
              relationshipsDeleted: Int!
            }

            type Mutation {
              createUsers(input: [UserCreateInput!]!): CreateUsersMutationResponse!
              deleteUsers(delete: UserDeleteInput, where: UserWhere): DeleteInfo!
              updateUsers(connect: UserConnectInput @deprecated(reason: \\"Top level connect input argument in update is deprecated. Use the nested connect field in the relationship within the update argument\\"), create: UserRelationInput @deprecated(reason: \\"Top level create input argument in update is deprecated. Use the nested create field in the relationship within the update argument\\"), delete: UserDeleteInput @deprecated(reason: \\"Top level delete input argument in update is deprecated. Use the nested delete field in the relationship within the update argument\\"), disconnect: UserDisconnectInput @deprecated(reason: \\"Top level disconnect input argument in update is deprecated. Use the nested disconnect field in the relationship within the update argument\\"), update: UserUpdateInput, where: UserWhere): UpdateUsersMutationResponse!
            }

            \\"\\"\\"Pagination information (Relay)\\"\\"\\"
            type PageInfo {
              endCursor: String
              hasNextPage: Boolean!
              hasPreviousPage: Boolean!
              startCursor: String
            }

            type Query {
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

            type User {
              friends(limit: Int, offset: Int, options: UserOptions @deprecated(reason: \\"Query options argument is deprecated, please use pagination arguments like limit, offset and sort instead.\\"), sort: [UserSort!], where: UserWhere): [User!]!
              friendsAggregate(where: UserWhere): UserUserFriendsAggregationSelection
              friendsConnection(after: String, first: Int, sort: [UserFriendsConnectionSort!], where: UserFriendsConnectionWhere): UserFriendsConnection!
              name: String!
            }

            type UserAggregateSelection {
              count: Int!
              name: StringAggregateSelection!
            }

            input UserConnectInput {
              friends: [UserFriendsConnectFieldInput!]
            }

            input UserConnectWhere {
              node: UserWhere!
            }

            input UserCreateInput {
              friends: UserFriendsFieldInput
              name: String!
            }

            input UserDeleteInput {
              friends: [UserFriendsDeleteFieldInput!]
            }

            input UserDisconnectInput {
              friends: [UserFriendsDisconnectFieldInput!]
            }

            type UserEdge {
              cursor: String!
              node: User!
            }

            input UserFriendsAggregateInput {
              AND: [UserFriendsAggregateInput!]
              NOT: UserFriendsAggregateInput
              OR: [UserFriendsAggregateInput!]
              count: Int @deprecated(reason: \\"Please use the explicit _EQ version\\")
              count_EQ: Int
              count_GT: Int
              count_GTE: Int
              count_LT: Int
              count_LTE: Int
              node: UserFriendsNodeAggregationWhereInput
            }

            input UserFriendsConnectFieldInput {
              connect: [UserConnectInput!]
              \\"\\"\\"
              Whether or not to overwrite any matching relationship with the new properties.
              \\"\\"\\"
              overwrite: Boolean! = true
              where: UserConnectWhere
            }

            type UserFriendsConnection {
              edges: [UserFriendsRelationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input UserFriendsConnectionSort {
              node: UserSort
            }

            input UserFriendsConnectionWhere {
              AND: [UserFriendsConnectionWhere!]
              NOT: UserFriendsConnectionWhere
              OR: [UserFriendsConnectionWhere!]
              node: UserWhere
            }

            input UserFriendsCreateFieldInput {
              node: UserCreateInput!
            }

            input UserFriendsDeleteFieldInput {
              delete: UserDeleteInput
              where: UserFriendsConnectionWhere
            }

            input UserFriendsDisconnectFieldInput {
              disconnect: UserDisconnectInput
              where: UserFriendsConnectionWhere
            }

            input UserFriendsFieldInput {
              connect: [UserFriendsConnectFieldInput!]
              create: [UserFriendsCreateFieldInput!]
            }

            input UserFriendsNodeAggregationWhereInput {
              AND: [UserFriendsNodeAggregationWhereInput!]
              NOT: UserFriendsNodeAggregationWhereInput
              OR: [UserFriendsNodeAggregationWhereInput!]
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

            type UserFriendsRelationship {
              cursor: String!
              node: User!
            }

            input UserFriendsUpdateConnectionInput {
              node: UserUpdateInput
            }

            input UserFriendsUpdateFieldInput {
              connect: [UserFriendsConnectFieldInput!]
              create: [UserFriendsCreateFieldInput!]
              delete: [UserFriendsDeleteFieldInput!]
              disconnect: [UserFriendsDisconnectFieldInput!]
              update: UserFriendsUpdateConnectionInput
              where: UserFriendsConnectionWhere
            }

            input UserOptions {
              limit: Int
              offset: Int
              \\"\\"\\"
              Specify one or more UserSort objects to sort Users by. The sorts will be applied in the order in which they are arranged in the array.
              \\"\\"\\"
              sort: [UserSort!]
            }

            input UserRelationInput {
              friends: [UserFriendsCreateFieldInput!]
            }

            \\"\\"\\"
            Fields to sort Users by. The order in which sorts are applied is not guaranteed when specifying many fields in one UserSort object.
            \\"\\"\\"
            input UserSort {
              name: SortDirection
            }

            input UserUpdateInput {
              friends: [UserFriendsUpdateFieldInput!]
              name: String
            }

            type UserUserFriendsAggregationSelection {
              count: Int!
              node: UserUserFriendsNodeAggregateSelection
            }

            type UserUserFriendsNodeAggregateSelection {
              name: StringAggregateSelection!
            }

            input UserWhere {
              AND: [UserWhere!]
              NOT: UserWhere
              OR: [UserWhere!]
              friends: UserWhere @deprecated(reason: \\"Use \`friends_SOME\` instead.\\")
              friendsAggregate: UserFriendsAggregateInput
              friendsConnection: UserFriendsConnectionWhere @deprecated(reason: \\"Use \`friendsConnection_SOME\` instead.\\")
              \\"\\"\\"
              Return Users where all of the related UserFriendsConnections match this filter
              \\"\\"\\"
              friendsConnection_ALL: UserFriendsConnectionWhere
              \\"\\"\\"
              Return Users where none of the related UserFriendsConnections match this filter
              \\"\\"\\"
              friendsConnection_NONE: UserFriendsConnectionWhere
              \\"\\"\\"
              Return Users where one of the related UserFriendsConnections match this filter
              \\"\\"\\"
              friendsConnection_SINGLE: UserFriendsConnectionWhere
              \\"\\"\\"
              Return Users where some of the related UserFriendsConnections match this filter
              \\"\\"\\"
              friendsConnection_SOME: UserFriendsConnectionWhere
              \\"\\"\\"Return Users where all of the related Users match this filter\\"\\"\\"
              friends_ALL: UserWhere
              \\"\\"\\"Return Users where none of the related Users match this filter\\"\\"\\"
              friends_NONE: UserWhere
              \\"\\"\\"Return Users where one of the related Users match this filter\\"\\"\\"
              friends_SINGLE: UserWhere
              \\"\\"\\"Return Users where some of the related Users match this filter\\"\\"\\"
              friends_SOME: UserWhere
              name: String @deprecated(reason: \\"Please use the explicit _EQ version\\")
              name_CONTAINS: String
              name_ENDS_WITH: String
              name_EQ: String
              name_IN: [String!]
              name_STARTS_WITH: String
            }

            type UsersConnection {
              edges: [UserEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }"
        `);
    });
});
