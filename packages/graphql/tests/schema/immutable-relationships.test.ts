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

describe("Immutable relationship", () => {
    test("One to many relationship", async () => {
        const typeDefs = gql`
            type Post {
                title: String
                createdBy: User! @relationship(type: "POST_CREATED_BY", direction: OUT) @readonly
            }
            type User {
                name: String
                posts: [Post!]! @relationship(type: "POST_CREATED_BY", direction: IN) @readonly
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

            type CreatePostsMutationResponse {
              info: CreateInfo!
              posts: [Post!]!
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
              createPosts(input: [PostCreateInput!]!): CreatePostsMutationResponse!
              createUsers(input: [UserCreateInput!]!): CreateUsersMutationResponse!
              deletePosts(delete: PostDeleteInput, where: PostWhere): DeleteInfo!
              deleteUsers(delete: UserDeleteInput, where: UserWhere): DeleteInfo!
              updatePosts(connect: PostConnectInput, create: PostRelationInput, delete: PostDeleteInput, disconnect: PostDisconnectInput, update: PostUpdateInput, where: PostWhere): UpdatePostsMutationResponse!
              updateUsers(connect: UserConnectInput, create: UserRelationInput, delete: UserDeleteInput, disconnect: UserDisconnectInput, update: UserUpdateInput, where: UserWhere): UpdateUsersMutationResponse!
            }

            \\"\\"\\"Pagination information (Relay)\\"\\"\\"
            type PageInfo {
              endCursor: String
              hasNextPage: Boolean!
              hasPreviousPage: Boolean!
              startCursor: String
            }

            type Post {
              createdBy(directed: Boolean = true, options: UserOptions, where: UserWhere): User!
              createdByAggregate(directed: Boolean = true, where: UserWhere): PostUserCreatedByAggregationSelection
              createdByConnection(after: String, directed: Boolean = true, first: Int, sort: [PostCreatedByConnectionSort!], where: PostCreatedByConnectionWhere): PostCreatedByConnection!
              title: String
            }

            type PostAggregateSelection {
              count: Int!
              title: StringAggregateSelectionNullable!
            }

            input PostConnectInput {
              createdBy: PostCreatedByConnectFieldInput
            }

            input PostConnectWhere {
              node: PostWhere!
            }

            input PostCreateInput {
              createdBy: PostCreatedByFieldInput
              title: String
            }

            input PostCreatedByAggregateInput {
              AND: [PostCreatedByAggregateInput!]
              OR: [PostCreatedByAggregateInput!]
              count: Int
              count_GT: Int
              count_GTE: Int
              count_LT: Int
              count_LTE: Int
              node: PostCreatedByNodeAggregationWhereInput
            }

            input PostCreatedByConnectFieldInput {
              connect: UserConnectInput
              where: UserConnectWhere
            }

            type PostCreatedByConnection {
              edges: [PostCreatedByRelationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input PostCreatedByConnectionSort {
              node: UserSort
            }

            input PostCreatedByConnectionWhere {
              AND: [PostCreatedByConnectionWhere!]
              OR: [PostCreatedByConnectionWhere!]
              node: UserWhere
              node_NOT: UserWhere
            }

            input PostCreatedByCreateFieldInput {
              node: UserCreateInput!
            }

            input PostCreatedByDeleteFieldInput {
              delete: UserDeleteInput
              where: PostCreatedByConnectionWhere
            }

            input PostCreatedByDisconnectFieldInput {
              disconnect: UserDisconnectInput
              where: PostCreatedByConnectionWhere
            }

            input PostCreatedByFieldInput {
              connect: PostCreatedByConnectFieldInput
              create: PostCreatedByCreateFieldInput
            }

            input PostCreatedByNodeAggregationWhereInput {
              AND: [PostCreatedByNodeAggregationWhereInput!]
              OR: [PostCreatedByNodeAggregationWhereInput!]
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

            type PostCreatedByRelationship {
              cursor: String!
              node: User!
            }

            input PostCreatedByUpdateConnectionInput {
              node: UserUpdateInput
            }

            input PostCreatedByUpdateFieldInput {
              connect: PostCreatedByConnectFieldInput
              create: PostCreatedByCreateFieldInput
              delete: PostCreatedByDeleteFieldInput
              disconnect: PostCreatedByDisconnectFieldInput
              update: PostCreatedByUpdateConnectionInput
              where: PostCreatedByConnectionWhere
            }

            input PostDeleteInput {
              createdBy: PostCreatedByDeleteFieldInput
            }

            input PostDisconnectInput {
              createdBy: PostCreatedByDisconnectFieldInput
            }

            type PostEdge {
              cursor: String!
              node: Post!
            }

            input PostOptions {
              limit: Int
              offset: Int
              \\"\\"\\"
              Specify one or more PostSort objects to sort Posts by. The sorts will be applied in the order in which they are arranged in the array.
              \\"\\"\\"
              sort: [PostSort!]
            }

            input PostRelationInput {
              createdBy: PostCreatedByCreateFieldInput
            }

            \\"\\"\\"
            Fields to sort Posts by. The order in which sorts are applied is not guaranteed when specifying many fields in one PostSort object.
            \\"\\"\\"
            input PostSort {
              title: SortDirection
            }

            input PostUpdateInput {
              createdBy: PostCreatedByUpdateFieldInput
              title: String
            }

            type PostUserCreatedByAggregationSelection {
              count: Int!
              node: PostUserCreatedByNodeAggregateSelection
            }

            type PostUserCreatedByNodeAggregateSelection {
              name: StringAggregateSelectionNullable!
            }

            input PostWhere {
              AND: [PostWhere!]
              OR: [PostWhere!]
              createdBy: UserWhere
              createdByAggregate: PostCreatedByAggregateInput
              createdByConnection: PostCreatedByConnectionWhere
              createdByConnection_NOT: PostCreatedByConnectionWhere
              createdBy_NOT: UserWhere
              title: String
              title_CONTAINS: String
              title_ENDS_WITH: String
              title_IN: [String]
              title_NOT: String
              title_NOT_CONTAINS: String
              title_NOT_ENDS_WITH: String
              title_NOT_IN: [String]
              title_NOT_STARTS_WITH: String
              title_STARTS_WITH: String
            }

            type PostsConnection {
              edges: [PostEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            type Query {
              posts(options: PostOptions, where: PostWhere): [Post!]!
              postsAggregate(where: PostWhere): PostAggregateSelection!
              postsConnection(after: String, first: Int, sort: [PostSort], where: PostWhere): PostsConnection!
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

            type StringAggregateSelectionNullable {
              longest: String
              shortest: String
            }

            type UpdateInfo {
              bookmark: String
              nodesCreated: Int!
              nodesDeleted: Int!
              relationshipsCreated: Int!
              relationshipsDeleted: Int!
            }

            type UpdatePostsMutationResponse {
              info: UpdateInfo!
              posts: [Post!]!
            }

            type UpdateUsersMutationResponse {
              info: UpdateInfo!
              users: [User!]!
            }

            type User {
              name: String
              posts(directed: Boolean = true, options: PostOptions, where: PostWhere): [Post!]!
              postsAggregate(directed: Boolean = true, where: PostWhere): UserPostPostsAggregationSelection
              postsConnection(after: String, directed: Boolean = true, first: Int, sort: [UserPostsConnectionSort!], where: UserPostsConnectionWhere): UserPostsConnection!
            }

            type UserAggregateSelection {
              count: Int!
              name: StringAggregateSelectionNullable!
            }

            input UserConnectInput {
              posts: [UserPostsConnectFieldInput!]
            }

            input UserConnectWhere {
              node: UserWhere!
            }

            input UserCreateInput {
              name: String
              posts: UserPostsFieldInput
            }

            input UserDeleteInput {
              posts: [UserPostsDeleteFieldInput!]
            }

            input UserDisconnectInput {
              posts: [UserPostsDisconnectFieldInput!]
            }

            type UserEdge {
              cursor: String!
              node: User!
            }

            input UserOptions {
              limit: Int
              offset: Int
              \\"\\"\\"
              Specify one or more UserSort objects to sort Users by. The sorts will be applied in the order in which they are arranged in the array.
              \\"\\"\\"
              sort: [UserSort!]
            }

            type UserPostPostsAggregationSelection {
              count: Int!
              node: UserPostPostsNodeAggregateSelection
            }

            type UserPostPostsNodeAggregateSelection {
              title: StringAggregateSelectionNullable!
            }

            input UserPostsAggregateInput {
              AND: [UserPostsAggregateInput!]
              OR: [UserPostsAggregateInput!]
              count: Int
              count_GT: Int
              count_GTE: Int
              count_LT: Int
              count_LTE: Int
              node: UserPostsNodeAggregationWhereInput
            }

            input UserPostsConnectFieldInput {
              connect: [PostConnectInput!]
              where: PostConnectWhere
            }

            type UserPostsConnection {
              edges: [UserPostsRelationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input UserPostsConnectionSort {
              node: PostSort
            }

            input UserPostsConnectionWhere {
              AND: [UserPostsConnectionWhere!]
              OR: [UserPostsConnectionWhere!]
              node: PostWhere
              node_NOT: PostWhere
            }

            input UserPostsCreateFieldInput {
              node: PostCreateInput!
            }

            input UserPostsDeleteFieldInput {
              delete: PostDeleteInput
              where: UserPostsConnectionWhere
            }

            input UserPostsDisconnectFieldInput {
              disconnect: PostDisconnectInput
              where: UserPostsConnectionWhere
            }

            input UserPostsFieldInput {
              connect: [UserPostsConnectFieldInput!]
              create: [UserPostsCreateFieldInput!]
            }

            input UserPostsNodeAggregationWhereInput {
              AND: [UserPostsNodeAggregationWhereInput!]
              OR: [UserPostsNodeAggregationWhereInput!]
              title_AVERAGE_EQUAL: Float
              title_AVERAGE_GT: Float
              title_AVERAGE_GTE: Float
              title_AVERAGE_LT: Float
              title_AVERAGE_LTE: Float
              title_EQUAL: String
              title_GT: Int
              title_GTE: Int
              title_LONGEST_EQUAL: Int
              title_LONGEST_GT: Int
              title_LONGEST_GTE: Int
              title_LONGEST_LT: Int
              title_LONGEST_LTE: Int
              title_LT: Int
              title_LTE: Int
              title_SHORTEST_EQUAL: Int
              title_SHORTEST_GT: Int
              title_SHORTEST_GTE: Int
              title_SHORTEST_LT: Int
              title_SHORTEST_LTE: Int
            }

            type UserPostsRelationship {
              cursor: String!
              node: Post!
            }

            input UserPostsUpdateConnectionInput {
              node: PostUpdateInput
            }

            input UserPostsUpdateFieldInput {
              connect: [UserPostsConnectFieldInput!]
              create: [UserPostsCreateFieldInput!]
              delete: [UserPostsDeleteFieldInput!]
              disconnect: [UserPostsDisconnectFieldInput!]
              update: UserPostsUpdateConnectionInput
              where: UserPostsConnectionWhere
            }

            input UserRelationInput {
              posts: [UserPostsCreateFieldInput!]
            }

            \\"\\"\\"
            Fields to sort Users by. The order in which sorts are applied is not guaranteed when specifying many fields in one UserSort object.
            \\"\\"\\"
            input UserSort {
              name: SortDirection
            }

            input UserUpdateInput {
              name: String
              posts: [UserPostsUpdateFieldInput!]
            }

            input UserWhere {
              AND: [UserWhere!]
              OR: [UserWhere!]
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
              posts: PostWhere @deprecated(reason: \\"Use \`posts_SOME\` instead.\\")
              postsAggregate: UserPostsAggregateInput
              postsConnection: UserPostsConnectionWhere @deprecated(reason: \\"Use \`postsConnection_SOME\` instead.\\")
              postsConnection_ALL: UserPostsConnectionWhere
              postsConnection_NONE: UserPostsConnectionWhere
              postsConnection_NOT: UserPostsConnectionWhere @deprecated(reason: \\"Use \`postsConnection_NONE\` instead.\\")
              postsConnection_SINGLE: UserPostsConnectionWhere
              postsConnection_SOME: UserPostsConnectionWhere
              \\"\\"\\"Return Users where all of the related Posts match this filter\\"\\"\\"
              posts_ALL: PostWhere
              \\"\\"\\"Return Users where none of the related Posts match this filter\\"\\"\\"
              posts_NONE: PostWhere
              posts_NOT: PostWhere @deprecated(reason: \\"Use \`posts_NONE\` instead.\\")
              \\"\\"\\"Return Users where one of the related Posts match this filter\\"\\"\\"
              posts_SINGLE: PostWhere
              \\"\\"\\"Return Users where some of the related Posts match this filter\\"\\"\\"
              posts_SOME: PostWhere
            }

            type UsersConnection {
              edges: [UserEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }"
        `);
    });

    test("Many to many relationship", async () => {
        const typeDefs = gql`
            type Post {
                title: String
                commentedBy: [User!]! @relationship(type: "POST_COMMENTED_BY", direction: OUT) @readonly
            }
            type User {
                name: String
                postsCommented: [Post!]! @relationship(type: "POST_COMMENTED_BY", direction: IN) @readonly
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

            type CreatePostsMutationResponse {
              info: CreateInfo!
              posts: [Post!]!
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
              createPosts(input: [PostCreateInput!]!): CreatePostsMutationResponse!
              createUsers(input: [UserCreateInput!]!): CreateUsersMutationResponse!
              deletePosts(delete: PostDeleteInput, where: PostWhere): DeleteInfo!
              deleteUsers(delete: UserDeleteInput, where: UserWhere): DeleteInfo!
              updatePosts(connect: PostConnectInput, create: PostRelationInput, delete: PostDeleteInput, disconnect: PostDisconnectInput, update: PostUpdateInput, where: PostWhere): UpdatePostsMutationResponse!
              updateUsers(connect: UserConnectInput, create: UserRelationInput, delete: UserDeleteInput, disconnect: UserDisconnectInput, update: UserUpdateInput, where: UserWhere): UpdateUsersMutationResponse!
            }

            \\"\\"\\"Pagination information (Relay)\\"\\"\\"
            type PageInfo {
              endCursor: String
              hasNextPage: Boolean!
              hasPreviousPage: Boolean!
              startCursor: String
            }

            type Post {
              commentedBy(directed: Boolean = true, options: UserOptions, where: UserWhere): [User!]!
              commentedByAggregate(directed: Boolean = true, where: UserWhere): PostUserCommentedByAggregationSelection
              commentedByConnection(after: String, directed: Boolean = true, first: Int, sort: [PostCommentedByConnectionSort!], where: PostCommentedByConnectionWhere): PostCommentedByConnection!
              title: String
            }

            type PostAggregateSelection {
              count: Int!
              title: StringAggregateSelectionNullable!
            }

            input PostCommentedByAggregateInput {
              AND: [PostCommentedByAggregateInput!]
              OR: [PostCommentedByAggregateInput!]
              count: Int
              count_GT: Int
              count_GTE: Int
              count_LT: Int
              count_LTE: Int
              node: PostCommentedByNodeAggregationWhereInput
            }

            input PostCommentedByConnectFieldInput {
              connect: [UserConnectInput!]
              where: UserConnectWhere
            }

            type PostCommentedByConnection {
              edges: [PostCommentedByRelationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input PostCommentedByConnectionSort {
              node: UserSort
            }

            input PostCommentedByConnectionWhere {
              AND: [PostCommentedByConnectionWhere!]
              OR: [PostCommentedByConnectionWhere!]
              node: UserWhere
              node_NOT: UserWhere
            }

            input PostCommentedByCreateFieldInput {
              node: UserCreateInput!
            }

            input PostCommentedByDeleteFieldInput {
              delete: UserDeleteInput
              where: PostCommentedByConnectionWhere
            }

            input PostCommentedByDisconnectFieldInput {
              disconnect: UserDisconnectInput
              where: PostCommentedByConnectionWhere
            }

            input PostCommentedByFieldInput {
              connect: [PostCommentedByConnectFieldInput!]
              create: [PostCommentedByCreateFieldInput!]
            }

            input PostCommentedByNodeAggregationWhereInput {
              AND: [PostCommentedByNodeAggregationWhereInput!]
              OR: [PostCommentedByNodeAggregationWhereInput!]
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

            type PostCommentedByRelationship {
              cursor: String!
              node: User!
            }

            input PostCommentedByUpdateConnectionInput {
              node: UserUpdateInput
            }

            input PostCommentedByUpdateFieldInput {
              connect: [PostCommentedByConnectFieldInput!]
              create: [PostCommentedByCreateFieldInput!]
              delete: [PostCommentedByDeleteFieldInput!]
              disconnect: [PostCommentedByDisconnectFieldInput!]
              update: PostCommentedByUpdateConnectionInput
              where: PostCommentedByConnectionWhere
            }

            input PostConnectInput {
              commentedBy: [PostCommentedByConnectFieldInput!]
            }

            input PostConnectWhere {
              node: PostWhere!
            }

            input PostCreateInput {
              commentedBy: PostCommentedByFieldInput
              title: String
            }

            input PostDeleteInput {
              commentedBy: [PostCommentedByDeleteFieldInput!]
            }

            input PostDisconnectInput {
              commentedBy: [PostCommentedByDisconnectFieldInput!]
            }

            type PostEdge {
              cursor: String!
              node: Post!
            }

            input PostOptions {
              limit: Int
              offset: Int
              \\"\\"\\"
              Specify one or more PostSort objects to sort Posts by. The sorts will be applied in the order in which they are arranged in the array.
              \\"\\"\\"
              sort: [PostSort!]
            }

            input PostRelationInput {
              commentedBy: [PostCommentedByCreateFieldInput!]
            }

            \\"\\"\\"
            Fields to sort Posts by. The order in which sorts are applied is not guaranteed when specifying many fields in one PostSort object.
            \\"\\"\\"
            input PostSort {
              title: SortDirection
            }

            input PostUpdateInput {
              commentedBy: [PostCommentedByUpdateFieldInput!]
              title: String
            }

            type PostUserCommentedByAggregationSelection {
              count: Int!
              node: PostUserCommentedByNodeAggregateSelection
            }

            type PostUserCommentedByNodeAggregateSelection {
              name: StringAggregateSelectionNullable!
            }

            input PostWhere {
              AND: [PostWhere!]
              OR: [PostWhere!]
              commentedBy: UserWhere @deprecated(reason: \\"Use \`commentedBy_SOME\` instead.\\")
              commentedByAggregate: PostCommentedByAggregateInput
              commentedByConnection: PostCommentedByConnectionWhere @deprecated(reason: \\"Use \`commentedByConnection_SOME\` instead.\\")
              commentedByConnection_ALL: PostCommentedByConnectionWhere
              commentedByConnection_NONE: PostCommentedByConnectionWhere
              commentedByConnection_NOT: PostCommentedByConnectionWhere @deprecated(reason: \\"Use \`commentedByConnection_NONE\` instead.\\")
              commentedByConnection_SINGLE: PostCommentedByConnectionWhere
              commentedByConnection_SOME: PostCommentedByConnectionWhere
              \\"\\"\\"Return Posts where all of the related Users match this filter\\"\\"\\"
              commentedBy_ALL: UserWhere
              \\"\\"\\"Return Posts where none of the related Users match this filter\\"\\"\\"
              commentedBy_NONE: UserWhere
              commentedBy_NOT: UserWhere @deprecated(reason: \\"Use \`commentedBy_NONE\` instead.\\")
              \\"\\"\\"Return Posts where one of the related Users match this filter\\"\\"\\"
              commentedBy_SINGLE: UserWhere
              \\"\\"\\"Return Posts where some of the related Users match this filter\\"\\"\\"
              commentedBy_SOME: UserWhere
              title: String
              title_CONTAINS: String
              title_ENDS_WITH: String
              title_IN: [String]
              title_NOT: String
              title_NOT_CONTAINS: String
              title_NOT_ENDS_WITH: String
              title_NOT_IN: [String]
              title_NOT_STARTS_WITH: String
              title_STARTS_WITH: String
            }

            type PostsConnection {
              edges: [PostEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            type Query {
              posts(options: PostOptions, where: PostWhere): [Post!]!
              postsAggregate(where: PostWhere): PostAggregateSelection!
              postsConnection(after: String, first: Int, sort: [PostSort], where: PostWhere): PostsConnection!
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

            type StringAggregateSelectionNullable {
              longest: String
              shortest: String
            }

            type UpdateInfo {
              bookmark: String
              nodesCreated: Int!
              nodesDeleted: Int!
              relationshipsCreated: Int!
              relationshipsDeleted: Int!
            }

            type UpdatePostsMutationResponse {
              info: UpdateInfo!
              posts: [Post!]!
            }

            type UpdateUsersMutationResponse {
              info: UpdateInfo!
              users: [User!]!
            }

            type User {
              name: String
              postsCommented(directed: Boolean = true, options: PostOptions, where: PostWhere): [Post!]!
              postsCommentedAggregate(directed: Boolean = true, where: PostWhere): UserPostPostsCommentedAggregationSelection
              postsCommentedConnection(after: String, directed: Boolean = true, first: Int, sort: [UserPostsCommentedConnectionSort!], where: UserPostsCommentedConnectionWhere): UserPostsCommentedConnection!
            }

            type UserAggregateSelection {
              count: Int!
              name: StringAggregateSelectionNullable!
            }

            input UserConnectInput {
              postsCommented: [UserPostsCommentedConnectFieldInput!]
            }

            input UserConnectWhere {
              node: UserWhere!
            }

            input UserCreateInput {
              name: String
              postsCommented: UserPostsCommentedFieldInput
            }

            input UserDeleteInput {
              postsCommented: [UserPostsCommentedDeleteFieldInput!]
            }

            input UserDisconnectInput {
              postsCommented: [UserPostsCommentedDisconnectFieldInput!]
            }

            type UserEdge {
              cursor: String!
              node: User!
            }

            input UserOptions {
              limit: Int
              offset: Int
              \\"\\"\\"
              Specify one or more UserSort objects to sort Users by. The sorts will be applied in the order in which they are arranged in the array.
              \\"\\"\\"
              sort: [UserSort!]
            }

            type UserPostPostsCommentedAggregationSelection {
              count: Int!
              node: UserPostPostsCommentedNodeAggregateSelection
            }

            type UserPostPostsCommentedNodeAggregateSelection {
              title: StringAggregateSelectionNullable!
            }

            input UserPostsCommentedAggregateInput {
              AND: [UserPostsCommentedAggregateInput!]
              OR: [UserPostsCommentedAggregateInput!]
              count: Int
              count_GT: Int
              count_GTE: Int
              count_LT: Int
              count_LTE: Int
              node: UserPostsCommentedNodeAggregationWhereInput
            }

            input UserPostsCommentedConnectFieldInput {
              connect: [PostConnectInput!]
              where: PostConnectWhere
            }

            type UserPostsCommentedConnection {
              edges: [UserPostsCommentedRelationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input UserPostsCommentedConnectionSort {
              node: PostSort
            }

            input UserPostsCommentedConnectionWhere {
              AND: [UserPostsCommentedConnectionWhere!]
              OR: [UserPostsCommentedConnectionWhere!]
              node: PostWhere
              node_NOT: PostWhere
            }

            input UserPostsCommentedCreateFieldInput {
              node: PostCreateInput!
            }

            input UserPostsCommentedDeleteFieldInput {
              delete: PostDeleteInput
              where: UserPostsCommentedConnectionWhere
            }

            input UserPostsCommentedDisconnectFieldInput {
              disconnect: PostDisconnectInput
              where: UserPostsCommentedConnectionWhere
            }

            input UserPostsCommentedFieldInput {
              connect: [UserPostsCommentedConnectFieldInput!]
              create: [UserPostsCommentedCreateFieldInput!]
            }

            input UserPostsCommentedNodeAggregationWhereInput {
              AND: [UserPostsCommentedNodeAggregationWhereInput!]
              OR: [UserPostsCommentedNodeAggregationWhereInput!]
              title_AVERAGE_EQUAL: Float
              title_AVERAGE_GT: Float
              title_AVERAGE_GTE: Float
              title_AVERAGE_LT: Float
              title_AVERAGE_LTE: Float
              title_EQUAL: String
              title_GT: Int
              title_GTE: Int
              title_LONGEST_EQUAL: Int
              title_LONGEST_GT: Int
              title_LONGEST_GTE: Int
              title_LONGEST_LT: Int
              title_LONGEST_LTE: Int
              title_LT: Int
              title_LTE: Int
              title_SHORTEST_EQUAL: Int
              title_SHORTEST_GT: Int
              title_SHORTEST_GTE: Int
              title_SHORTEST_LT: Int
              title_SHORTEST_LTE: Int
            }

            type UserPostsCommentedRelationship {
              cursor: String!
              node: Post!
            }

            input UserPostsCommentedUpdateConnectionInput {
              node: PostUpdateInput
            }

            input UserPostsCommentedUpdateFieldInput {
              connect: [UserPostsCommentedConnectFieldInput!]
              create: [UserPostsCommentedCreateFieldInput!]
              delete: [UserPostsCommentedDeleteFieldInput!]
              disconnect: [UserPostsCommentedDisconnectFieldInput!]
              update: UserPostsCommentedUpdateConnectionInput
              where: UserPostsCommentedConnectionWhere
            }

            input UserRelationInput {
              postsCommented: [UserPostsCommentedCreateFieldInput!]
            }

            \\"\\"\\"
            Fields to sort Users by. The order in which sorts are applied is not guaranteed when specifying many fields in one UserSort object.
            \\"\\"\\"
            input UserSort {
              name: SortDirection
            }

            input UserUpdateInput {
              name: String
              postsCommented: [UserPostsCommentedUpdateFieldInput!]
            }

            input UserWhere {
              AND: [UserWhere!]
              OR: [UserWhere!]
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
              postsCommented: PostWhere @deprecated(reason: \\"Use \`postsCommented_SOME\` instead.\\")
              postsCommentedAggregate: UserPostsCommentedAggregateInput
              postsCommentedConnection: UserPostsCommentedConnectionWhere @deprecated(reason: \\"Use \`postsCommentedConnection_SOME\` instead.\\")
              postsCommentedConnection_ALL: UserPostsCommentedConnectionWhere
              postsCommentedConnection_NONE: UserPostsCommentedConnectionWhere
              postsCommentedConnection_NOT: UserPostsCommentedConnectionWhere @deprecated(reason: \\"Use \`postsCommentedConnection_NONE\` instead.\\")
              postsCommentedConnection_SINGLE: UserPostsCommentedConnectionWhere
              postsCommentedConnection_SOME: UserPostsCommentedConnectionWhere
              \\"\\"\\"Return Users where all of the related Posts match this filter\\"\\"\\"
              postsCommented_ALL: PostWhere
              \\"\\"\\"Return Users where none of the related Posts match this filter\\"\\"\\"
              postsCommented_NONE: PostWhere
              postsCommented_NOT: PostWhere @deprecated(reason: \\"Use \`postsCommented_NONE\` instead.\\")
              \\"\\"\\"Return Users where one of the related Posts match this filter\\"\\"\\"
              postsCommented_SINGLE: PostWhere
              \\"\\"\\"Return Users where some of the related Posts match this filter\\"\\"\\"
              postsCommented_SOME: PostWhere
            }

            type UsersConnection {
              edges: [UserEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }"
        `);
    });

    test("Interface relationships", async () => {
        const typeDefs = gql`
            interface Feed {
                commentedBy: [User!]!
            }
            type Post implements Feed {
                title: String
                commentedBy: [User!]! @relationship(type: "POST_COMMENTED_BY", direction: OUT) @readonly
            }
            type User {
                name: String
                postsCommented: [Feed!]! @relationship(type: "POST_COMMENTED_BY", direction: IN) @readonly
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

            type CreatePostsMutationResponse {
              info: CreateInfo!
              posts: [Post!]!
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

            interface Feed {
              commentedBy: [User!]!
            }

            input FeedCommentedByConnectFieldInput {
              connect: [UserConnectInput!]
              where: UserConnectWhere
            }

            type FeedCommentedByConnection {
              edges: [FeedCommentedByRelationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input FeedCommentedByConnectionSort {
              node: UserSort
            }

            input FeedCommentedByConnectionWhere {
              AND: [FeedCommentedByConnectionWhere!]
              OR: [FeedCommentedByConnectionWhere!]
              node: UserWhere
              node_NOT: UserWhere
            }

            input FeedCommentedByCreateFieldInput {
              node: UserCreateInput!
            }

            input FeedCommentedByDeleteFieldInput {
              delete: UserDeleteInput
              where: FeedCommentedByConnectionWhere
            }

            input FeedCommentedByDisconnectFieldInput {
              disconnect: UserDisconnectInput
              where: FeedCommentedByConnectionWhere
            }

            input FeedCommentedByFieldInput {
              connect: [FeedCommentedByConnectFieldInput!]
              create: [FeedCommentedByCreateFieldInput!]
            }

            type FeedCommentedByRelationship {
              cursor: String!
              node: User!
            }

            input FeedCommentedByUpdateConnectionInput {
              node: UserUpdateInput
            }

            input FeedCommentedByUpdateFieldInput {
              connect: [FeedCommentedByConnectFieldInput!]
              create: [FeedCommentedByCreateFieldInput!]
              delete: [FeedCommentedByDeleteFieldInput!]
              disconnect: [FeedCommentedByDisconnectFieldInput!]
              update: FeedCommentedByUpdateConnectionInput
              where: FeedCommentedByConnectionWhere
            }

            input FeedConnectInput {
              _on: FeedImplementationsConnectInput
            }

            input FeedConnectWhere {
              node: FeedWhere!
            }

            input FeedCreateInput {
              Post: PostCreateInput
            }

            input FeedDeleteInput {
              _on: FeedImplementationsDeleteInput
            }

            input FeedDisconnectInput {
              _on: FeedImplementationsDisconnectInput
            }

            input FeedImplementationsConnectInput {
              Post: [PostConnectInput!]
            }

            input FeedImplementationsDeleteInput {
              Post: [PostDeleteInput!]
            }

            input FeedImplementationsDisconnectInput {
              Post: [PostDisconnectInput!]
            }

            input FeedImplementationsUpdateInput {
              Post: PostUpdateInput
            }

            input FeedImplementationsWhere {
              Post: PostWhere
            }

            input FeedOptions {
              limit: Int
              offset: Int
            }

            input FeedUpdateInput {
              _on: FeedImplementationsUpdateInput
            }

            input FeedWhere {
              _on: FeedImplementationsWhere
            }

            type Mutation {
              createPosts(input: [PostCreateInput!]!): CreatePostsMutationResponse!
              createUsers(input: [UserCreateInput!]!): CreateUsersMutationResponse!
              deletePosts(delete: PostDeleteInput, where: PostWhere): DeleteInfo!
              deleteUsers(delete: UserDeleteInput, where: UserWhere): DeleteInfo!
              updatePosts(connect: PostConnectInput, create: PostRelationInput, delete: PostDeleteInput, disconnect: PostDisconnectInput, update: PostUpdateInput, where: PostWhere): UpdatePostsMutationResponse!
              updateUsers(connect: UserConnectInput, create: UserRelationInput, delete: UserDeleteInput, disconnect: UserDisconnectInput, update: UserUpdateInput, where: UserWhere): UpdateUsersMutationResponse!
            }

            \\"\\"\\"Pagination information (Relay)\\"\\"\\"
            type PageInfo {
              endCursor: String
              hasNextPage: Boolean!
              hasPreviousPage: Boolean!
              startCursor: String
            }

            type Post implements Feed {
              commentedBy(directed: Boolean = true, options: UserOptions, where: UserWhere): [User!]!
              commentedByAggregate(directed: Boolean = true, where: UserWhere): PostUserCommentedByAggregationSelection
              commentedByConnection(after: String, directed: Boolean = true, first: Int, sort: [FeedCommentedByConnectionSort!], where: FeedCommentedByConnectionWhere): FeedCommentedByConnection!
              title: String
            }

            type PostAggregateSelection {
              count: Int!
              title: StringAggregateSelectionNullable!
            }

            input PostCommentedByAggregateInput {
              AND: [PostCommentedByAggregateInput!]
              OR: [PostCommentedByAggregateInput!]
              count: Int
              count_GT: Int
              count_GTE: Int
              count_LT: Int
              count_LTE: Int
              node: PostCommentedByNodeAggregationWhereInput
            }

            input PostCommentedByNodeAggregationWhereInput {
              AND: [PostCommentedByNodeAggregationWhereInput!]
              OR: [PostCommentedByNodeAggregationWhereInput!]
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

            input PostConnectInput {
              commentedBy: [FeedCommentedByConnectFieldInput!]
            }

            input PostCreateInput {
              commentedBy: FeedCommentedByFieldInput
              title: String
            }

            input PostDeleteInput {
              commentedBy: [FeedCommentedByDeleteFieldInput!]
            }

            input PostDisconnectInput {
              commentedBy: [FeedCommentedByDisconnectFieldInput!]
            }

            type PostEdge {
              cursor: String!
              node: Post!
            }

            input PostOptions {
              limit: Int
              offset: Int
              \\"\\"\\"
              Specify one or more PostSort objects to sort Posts by. The sorts will be applied in the order in which they are arranged in the array.
              \\"\\"\\"
              sort: [PostSort!]
            }

            input PostRelationInput {
              commentedBy: [FeedCommentedByCreateFieldInput!]
            }

            \\"\\"\\"
            Fields to sort Posts by. The order in which sorts are applied is not guaranteed when specifying many fields in one PostSort object.
            \\"\\"\\"
            input PostSort {
              title: SortDirection
            }

            input PostUpdateInput {
              commentedBy: [FeedCommentedByUpdateFieldInput!]
              title: String
            }

            type PostUserCommentedByAggregationSelection {
              count: Int!
              node: PostUserCommentedByNodeAggregateSelection
            }

            type PostUserCommentedByNodeAggregateSelection {
              name: StringAggregateSelectionNullable!
            }

            input PostWhere {
              AND: [PostWhere!]
              OR: [PostWhere!]
              commentedBy: UserWhere @deprecated(reason: \\"Use \`commentedBy_SOME\` instead.\\")
              commentedByAggregate: PostCommentedByAggregateInput
              commentedByConnection: FeedCommentedByConnectionWhere @deprecated(reason: \\"Use \`commentedByConnection_SOME\` instead.\\")
              commentedByConnection_ALL: FeedCommentedByConnectionWhere
              commentedByConnection_NONE: FeedCommentedByConnectionWhere
              commentedByConnection_NOT: FeedCommentedByConnectionWhere @deprecated(reason: \\"Use \`commentedByConnection_NONE\` instead.\\")
              commentedByConnection_SINGLE: FeedCommentedByConnectionWhere
              commentedByConnection_SOME: FeedCommentedByConnectionWhere
              \\"\\"\\"Return Posts where all of the related Users match this filter\\"\\"\\"
              commentedBy_ALL: UserWhere
              \\"\\"\\"Return Posts where none of the related Users match this filter\\"\\"\\"
              commentedBy_NONE: UserWhere
              commentedBy_NOT: UserWhere @deprecated(reason: \\"Use \`commentedBy_NONE\` instead.\\")
              \\"\\"\\"Return Posts where one of the related Users match this filter\\"\\"\\"
              commentedBy_SINGLE: UserWhere
              \\"\\"\\"Return Posts where some of the related Users match this filter\\"\\"\\"
              commentedBy_SOME: UserWhere
              title: String
              title_CONTAINS: String
              title_ENDS_WITH: String
              title_IN: [String]
              title_NOT: String
              title_NOT_CONTAINS: String
              title_NOT_ENDS_WITH: String
              title_NOT_IN: [String]
              title_NOT_STARTS_WITH: String
              title_STARTS_WITH: String
            }

            type PostsConnection {
              edges: [PostEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            type Query {
              posts(options: PostOptions, where: PostWhere): [Post!]!
              postsAggregate(where: PostWhere): PostAggregateSelection!
              postsConnection(after: String, first: Int, sort: [PostSort], where: PostWhere): PostsConnection!
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

            type StringAggregateSelectionNullable {
              longest: String
              shortest: String
            }

            type UpdateInfo {
              bookmark: String
              nodesCreated: Int!
              nodesDeleted: Int!
              relationshipsCreated: Int!
              relationshipsDeleted: Int!
            }

            type UpdatePostsMutationResponse {
              info: UpdateInfo!
              posts: [Post!]!
            }

            type UpdateUsersMutationResponse {
              info: UpdateInfo!
              users: [User!]!
            }

            type User {
              name: String
              postsCommented(directed: Boolean = true, options: FeedOptions, where: FeedWhere): [Feed!]!
              postsCommentedConnection(after: String, directed: Boolean = true, first: Int, where: UserPostsCommentedConnectionWhere): UserPostsCommentedConnection!
            }

            type UserAggregateSelection {
              count: Int!
              name: StringAggregateSelectionNullable!
            }

            input UserConnectInput {
              postsCommented: [UserPostsCommentedConnectFieldInput!]
            }

            input UserConnectWhere {
              node: UserWhere!
            }

            input UserCreateInput {
              name: String
              postsCommented: UserPostsCommentedFieldInput
            }

            input UserDeleteInput {
              postsCommented: [UserPostsCommentedDeleteFieldInput!]
            }

            input UserDisconnectInput {
              postsCommented: [UserPostsCommentedDisconnectFieldInput!]
            }

            type UserEdge {
              cursor: String!
              node: User!
            }

            input UserOptions {
              limit: Int
              offset: Int
              \\"\\"\\"
              Specify one or more UserSort objects to sort Users by. The sorts will be applied in the order in which they are arranged in the array.
              \\"\\"\\"
              sort: [UserSort!]
            }

            input UserPostsCommentedConnectFieldInput {
              connect: FeedConnectInput
              where: FeedConnectWhere
            }

            type UserPostsCommentedConnection {
              edges: [UserPostsCommentedRelationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input UserPostsCommentedConnectionWhere {
              AND: [UserPostsCommentedConnectionWhere!]
              OR: [UserPostsCommentedConnectionWhere!]
              node: FeedWhere
              node_NOT: FeedWhere
            }

            input UserPostsCommentedCreateFieldInput {
              node: FeedCreateInput!
            }

            input UserPostsCommentedDeleteFieldInput {
              delete: FeedDeleteInput
              where: UserPostsCommentedConnectionWhere
            }

            input UserPostsCommentedDisconnectFieldInput {
              disconnect: FeedDisconnectInput
              where: UserPostsCommentedConnectionWhere
            }

            input UserPostsCommentedFieldInput {
              connect: [UserPostsCommentedConnectFieldInput!]
              create: [UserPostsCommentedCreateFieldInput!]
            }

            type UserPostsCommentedRelationship {
              cursor: String!
              node: Feed!
            }

            input UserPostsCommentedUpdateConnectionInput {
              node: FeedUpdateInput
            }

            input UserPostsCommentedUpdateFieldInput {
              connect: [UserPostsCommentedConnectFieldInput!]
              create: [UserPostsCommentedCreateFieldInput!]
              delete: [UserPostsCommentedDeleteFieldInput!]
              disconnect: [UserPostsCommentedDisconnectFieldInput!]
              update: UserPostsCommentedUpdateConnectionInput
              where: UserPostsCommentedConnectionWhere
            }

            input UserRelationInput {
              postsCommented: [UserPostsCommentedCreateFieldInput!]
            }

            \\"\\"\\"
            Fields to sort Users by. The order in which sorts are applied is not guaranteed when specifying many fields in one UserSort object.
            \\"\\"\\"
            input UserSort {
              name: SortDirection
            }

            input UserUpdateInput {
              name: String
              postsCommented: [UserPostsCommentedUpdateFieldInput!]
            }

            input UserWhere {
              AND: [UserWhere!]
              OR: [UserWhere!]
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
              postsCommentedConnection: UserPostsCommentedConnectionWhere @deprecated(reason: \\"Use \`postsCommentedConnection_SOME\` instead.\\")
              postsCommentedConnection_ALL: UserPostsCommentedConnectionWhere
              postsCommentedConnection_NONE: UserPostsCommentedConnectionWhere
              postsCommentedConnection_NOT: UserPostsCommentedConnectionWhere @deprecated(reason: \\"Use \`postsCommentedConnection_NONE\` instead.\\")
              postsCommentedConnection_SINGLE: UserPostsCommentedConnectionWhere
              postsCommentedConnection_SOME: UserPostsCommentedConnectionWhere
            }

            type UsersConnection {
              edges: [UserEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }"
        `);
    });

    test("Relationships properties", async () => {
        const typeDefs = gql`
            type Post {
                title: String
                commentedBy: [User!]!
                    @relationship(type: "POST_COMMENTED_BY", properties: "postCommentedBy", direction: OUT)
                    @readonly
            }
            type User {
                name: String
                postsCommented: [Post!]!
                    @relationship(type: "POST_COMMENTED_BY", properties: "postCommentedBy", direction: IN)
                    @readonly
            }
            interface postCommentedBy @relationshipProperties {
                timestamp: Int
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

            type CreatePostsMutationResponse {
              info: CreateInfo!
              posts: [Post!]!
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

            type IntAggregateSelectionNullable {
              average: Float
              max: Int
              min: Int
              sum: Int
            }

            type Mutation {
              createPosts(input: [PostCreateInput!]!): CreatePostsMutationResponse!
              createUsers(input: [UserCreateInput!]!): CreateUsersMutationResponse!
              deletePosts(delete: PostDeleteInput, where: PostWhere): DeleteInfo!
              deleteUsers(delete: UserDeleteInput, where: UserWhere): DeleteInfo!
              updatePosts(connect: PostConnectInput, create: PostRelationInput, delete: PostDeleteInput, disconnect: PostDisconnectInput, update: PostUpdateInput, where: PostWhere): UpdatePostsMutationResponse!
              updateUsers(connect: UserConnectInput, create: UserRelationInput, delete: UserDeleteInput, disconnect: UserDisconnectInput, update: UserUpdateInput, where: UserWhere): UpdateUsersMutationResponse!
            }

            \\"\\"\\"Pagination information (Relay)\\"\\"\\"
            type PageInfo {
              endCursor: String
              hasNextPage: Boolean!
              hasPreviousPage: Boolean!
              startCursor: String
            }

            type Post {
              commentedBy(directed: Boolean = true, options: UserOptions, where: UserWhere): [User!]!
              commentedByAggregate(directed: Boolean = true, where: UserWhere): PostUserCommentedByAggregationSelection
              commentedByConnection(after: String, directed: Boolean = true, first: Int, sort: [PostCommentedByConnectionSort!], where: PostCommentedByConnectionWhere): PostCommentedByConnection!
              title: String
            }

            type PostAggregateSelection {
              count: Int!
              title: StringAggregateSelectionNullable!
            }

            input PostCommentedByAggregateInput {
              AND: [PostCommentedByAggregateInput!]
              OR: [PostCommentedByAggregateInput!]
              count: Int
              count_GT: Int
              count_GTE: Int
              count_LT: Int
              count_LTE: Int
              edge: PostCommentedByEdgeAggregationWhereInput
              node: PostCommentedByNodeAggregationWhereInput
            }

            input PostCommentedByConnectFieldInput {
              connect: [UserConnectInput!]
              edge: postCommentedByCreateInput
              where: UserConnectWhere
            }

            type PostCommentedByConnection {
              edges: [PostCommentedByRelationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input PostCommentedByConnectionSort {
              edge: postCommentedBySort
              node: UserSort
            }

            input PostCommentedByConnectionWhere {
              AND: [PostCommentedByConnectionWhere!]
              OR: [PostCommentedByConnectionWhere!]
              edge: postCommentedByWhere
              edge_NOT: postCommentedByWhere
              node: UserWhere
              node_NOT: UserWhere
            }

            input PostCommentedByCreateFieldInput {
              edge: postCommentedByCreateInput
              node: UserCreateInput!
            }

            input PostCommentedByDeleteFieldInput {
              delete: UserDeleteInput
              where: PostCommentedByConnectionWhere
            }

            input PostCommentedByDisconnectFieldInput {
              disconnect: UserDisconnectInput
              where: PostCommentedByConnectionWhere
            }

            input PostCommentedByEdgeAggregationWhereInput {
              AND: [PostCommentedByEdgeAggregationWhereInput!]
              OR: [PostCommentedByEdgeAggregationWhereInput!]
              timestamp_AVERAGE_EQUAL: Float
              timestamp_AVERAGE_GT: Float
              timestamp_AVERAGE_GTE: Float
              timestamp_AVERAGE_LT: Float
              timestamp_AVERAGE_LTE: Float
              timestamp_EQUAL: Int
              timestamp_GT: Int
              timestamp_GTE: Int
              timestamp_LT: Int
              timestamp_LTE: Int
              timestamp_MAX_EQUAL: Int
              timestamp_MAX_GT: Int
              timestamp_MAX_GTE: Int
              timestamp_MAX_LT: Int
              timestamp_MAX_LTE: Int
              timestamp_MIN_EQUAL: Int
              timestamp_MIN_GT: Int
              timestamp_MIN_GTE: Int
              timestamp_MIN_LT: Int
              timestamp_MIN_LTE: Int
              timestamp_SUM_EQUAL: Int
              timestamp_SUM_GT: Int
              timestamp_SUM_GTE: Int
              timestamp_SUM_LT: Int
              timestamp_SUM_LTE: Int
            }

            input PostCommentedByFieldInput {
              connect: [PostCommentedByConnectFieldInput!]
              create: [PostCommentedByCreateFieldInput!]
            }

            input PostCommentedByNodeAggregationWhereInput {
              AND: [PostCommentedByNodeAggregationWhereInput!]
              OR: [PostCommentedByNodeAggregationWhereInput!]
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

            type PostCommentedByRelationship implements postCommentedBy {
              cursor: String!
              node: User!
              timestamp: Int
            }

            input PostCommentedByUpdateConnectionInput {
              edge: postCommentedByUpdateInput
              node: UserUpdateInput
            }

            input PostCommentedByUpdateFieldInput {
              connect: [PostCommentedByConnectFieldInput!]
              create: [PostCommentedByCreateFieldInput!]
              delete: [PostCommentedByDeleteFieldInput!]
              disconnect: [PostCommentedByDisconnectFieldInput!]
              update: PostCommentedByUpdateConnectionInput
              where: PostCommentedByConnectionWhere
            }

            input PostConnectInput {
              commentedBy: [PostCommentedByConnectFieldInput!]
            }

            input PostConnectWhere {
              node: PostWhere!
            }

            input PostCreateInput {
              commentedBy: PostCommentedByFieldInput
              title: String
            }

            input PostDeleteInput {
              commentedBy: [PostCommentedByDeleteFieldInput!]
            }

            input PostDisconnectInput {
              commentedBy: [PostCommentedByDisconnectFieldInput!]
            }

            type PostEdge {
              cursor: String!
              node: Post!
            }

            input PostOptions {
              limit: Int
              offset: Int
              \\"\\"\\"
              Specify one or more PostSort objects to sort Posts by. The sorts will be applied in the order in which they are arranged in the array.
              \\"\\"\\"
              sort: [PostSort!]
            }

            input PostRelationInput {
              commentedBy: [PostCommentedByCreateFieldInput!]
            }

            \\"\\"\\"
            Fields to sort Posts by. The order in which sorts are applied is not guaranteed when specifying many fields in one PostSort object.
            \\"\\"\\"
            input PostSort {
              title: SortDirection
            }

            input PostUpdateInput {
              commentedBy: [PostCommentedByUpdateFieldInput!]
              title: String
            }

            type PostUserCommentedByAggregationSelection {
              count: Int!
              edge: PostUserCommentedByEdgeAggregateSelection
              node: PostUserCommentedByNodeAggregateSelection
            }

            type PostUserCommentedByEdgeAggregateSelection {
              timestamp: IntAggregateSelectionNullable!
            }

            type PostUserCommentedByNodeAggregateSelection {
              name: StringAggregateSelectionNullable!
            }

            input PostWhere {
              AND: [PostWhere!]
              OR: [PostWhere!]
              commentedBy: UserWhere @deprecated(reason: \\"Use \`commentedBy_SOME\` instead.\\")
              commentedByAggregate: PostCommentedByAggregateInput
              commentedByConnection: PostCommentedByConnectionWhere @deprecated(reason: \\"Use \`commentedByConnection_SOME\` instead.\\")
              commentedByConnection_ALL: PostCommentedByConnectionWhere
              commentedByConnection_NONE: PostCommentedByConnectionWhere
              commentedByConnection_NOT: PostCommentedByConnectionWhere @deprecated(reason: \\"Use \`commentedByConnection_NONE\` instead.\\")
              commentedByConnection_SINGLE: PostCommentedByConnectionWhere
              commentedByConnection_SOME: PostCommentedByConnectionWhere
              \\"\\"\\"Return Posts where all of the related Users match this filter\\"\\"\\"
              commentedBy_ALL: UserWhere
              \\"\\"\\"Return Posts where none of the related Users match this filter\\"\\"\\"
              commentedBy_NONE: UserWhere
              commentedBy_NOT: UserWhere @deprecated(reason: \\"Use \`commentedBy_NONE\` instead.\\")
              \\"\\"\\"Return Posts where one of the related Users match this filter\\"\\"\\"
              commentedBy_SINGLE: UserWhere
              \\"\\"\\"Return Posts where some of the related Users match this filter\\"\\"\\"
              commentedBy_SOME: UserWhere
              title: String
              title_CONTAINS: String
              title_ENDS_WITH: String
              title_IN: [String]
              title_NOT: String
              title_NOT_CONTAINS: String
              title_NOT_ENDS_WITH: String
              title_NOT_IN: [String]
              title_NOT_STARTS_WITH: String
              title_STARTS_WITH: String
            }

            type PostsConnection {
              edges: [PostEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            type Query {
              posts(options: PostOptions, where: PostWhere): [Post!]!
              postsAggregate(where: PostWhere): PostAggregateSelection!
              postsConnection(after: String, first: Int, sort: [PostSort], where: PostWhere): PostsConnection!
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

            type StringAggregateSelectionNullable {
              longest: String
              shortest: String
            }

            type UpdateInfo {
              bookmark: String
              nodesCreated: Int!
              nodesDeleted: Int!
              relationshipsCreated: Int!
              relationshipsDeleted: Int!
            }

            type UpdatePostsMutationResponse {
              info: UpdateInfo!
              posts: [Post!]!
            }

            type UpdateUsersMutationResponse {
              info: UpdateInfo!
              users: [User!]!
            }

            type User {
              name: String
              postsCommented(directed: Boolean = true, options: PostOptions, where: PostWhere): [Post!]!
              postsCommentedAggregate(directed: Boolean = true, where: PostWhere): UserPostPostsCommentedAggregationSelection
              postsCommentedConnection(after: String, directed: Boolean = true, first: Int, sort: [UserPostsCommentedConnectionSort!], where: UserPostsCommentedConnectionWhere): UserPostsCommentedConnection!
            }

            type UserAggregateSelection {
              count: Int!
              name: StringAggregateSelectionNullable!
            }

            input UserConnectInput {
              postsCommented: [UserPostsCommentedConnectFieldInput!]
            }

            input UserConnectWhere {
              node: UserWhere!
            }

            input UserCreateInput {
              name: String
              postsCommented: UserPostsCommentedFieldInput
            }

            input UserDeleteInput {
              postsCommented: [UserPostsCommentedDeleteFieldInput!]
            }

            input UserDisconnectInput {
              postsCommented: [UserPostsCommentedDisconnectFieldInput!]
            }

            type UserEdge {
              cursor: String!
              node: User!
            }

            input UserOptions {
              limit: Int
              offset: Int
              \\"\\"\\"
              Specify one or more UserSort objects to sort Users by. The sorts will be applied in the order in which they are arranged in the array.
              \\"\\"\\"
              sort: [UserSort!]
            }

            type UserPostPostsCommentedAggregationSelection {
              count: Int!
              edge: UserPostPostsCommentedEdgeAggregateSelection
              node: UserPostPostsCommentedNodeAggregateSelection
            }

            type UserPostPostsCommentedEdgeAggregateSelection {
              timestamp: IntAggregateSelectionNullable!
            }

            type UserPostPostsCommentedNodeAggregateSelection {
              title: StringAggregateSelectionNullable!
            }

            input UserPostsCommentedAggregateInput {
              AND: [UserPostsCommentedAggregateInput!]
              OR: [UserPostsCommentedAggregateInput!]
              count: Int
              count_GT: Int
              count_GTE: Int
              count_LT: Int
              count_LTE: Int
              edge: UserPostsCommentedEdgeAggregationWhereInput
              node: UserPostsCommentedNodeAggregationWhereInput
            }

            input UserPostsCommentedConnectFieldInput {
              connect: [PostConnectInput!]
              edge: postCommentedByCreateInput
              where: PostConnectWhere
            }

            type UserPostsCommentedConnection {
              edges: [UserPostsCommentedRelationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input UserPostsCommentedConnectionSort {
              edge: postCommentedBySort
              node: PostSort
            }

            input UserPostsCommentedConnectionWhere {
              AND: [UserPostsCommentedConnectionWhere!]
              OR: [UserPostsCommentedConnectionWhere!]
              edge: postCommentedByWhere
              edge_NOT: postCommentedByWhere
              node: PostWhere
              node_NOT: PostWhere
            }

            input UserPostsCommentedCreateFieldInput {
              edge: postCommentedByCreateInput
              node: PostCreateInput!
            }

            input UserPostsCommentedDeleteFieldInput {
              delete: PostDeleteInput
              where: UserPostsCommentedConnectionWhere
            }

            input UserPostsCommentedDisconnectFieldInput {
              disconnect: PostDisconnectInput
              where: UserPostsCommentedConnectionWhere
            }

            input UserPostsCommentedEdgeAggregationWhereInput {
              AND: [UserPostsCommentedEdgeAggregationWhereInput!]
              OR: [UserPostsCommentedEdgeAggregationWhereInput!]
              timestamp_AVERAGE_EQUAL: Float
              timestamp_AVERAGE_GT: Float
              timestamp_AVERAGE_GTE: Float
              timestamp_AVERAGE_LT: Float
              timestamp_AVERAGE_LTE: Float
              timestamp_EQUAL: Int
              timestamp_GT: Int
              timestamp_GTE: Int
              timestamp_LT: Int
              timestamp_LTE: Int
              timestamp_MAX_EQUAL: Int
              timestamp_MAX_GT: Int
              timestamp_MAX_GTE: Int
              timestamp_MAX_LT: Int
              timestamp_MAX_LTE: Int
              timestamp_MIN_EQUAL: Int
              timestamp_MIN_GT: Int
              timestamp_MIN_GTE: Int
              timestamp_MIN_LT: Int
              timestamp_MIN_LTE: Int
              timestamp_SUM_EQUAL: Int
              timestamp_SUM_GT: Int
              timestamp_SUM_GTE: Int
              timestamp_SUM_LT: Int
              timestamp_SUM_LTE: Int
            }

            input UserPostsCommentedFieldInput {
              connect: [UserPostsCommentedConnectFieldInput!]
              create: [UserPostsCommentedCreateFieldInput!]
            }

            input UserPostsCommentedNodeAggregationWhereInput {
              AND: [UserPostsCommentedNodeAggregationWhereInput!]
              OR: [UserPostsCommentedNodeAggregationWhereInput!]
              title_AVERAGE_EQUAL: Float
              title_AVERAGE_GT: Float
              title_AVERAGE_GTE: Float
              title_AVERAGE_LT: Float
              title_AVERAGE_LTE: Float
              title_EQUAL: String
              title_GT: Int
              title_GTE: Int
              title_LONGEST_EQUAL: Int
              title_LONGEST_GT: Int
              title_LONGEST_GTE: Int
              title_LONGEST_LT: Int
              title_LONGEST_LTE: Int
              title_LT: Int
              title_LTE: Int
              title_SHORTEST_EQUAL: Int
              title_SHORTEST_GT: Int
              title_SHORTEST_GTE: Int
              title_SHORTEST_LT: Int
              title_SHORTEST_LTE: Int
            }

            type UserPostsCommentedRelationship implements postCommentedBy {
              cursor: String!
              node: Post!
              timestamp: Int
            }

            input UserPostsCommentedUpdateConnectionInput {
              edge: postCommentedByUpdateInput
              node: PostUpdateInput
            }

            input UserPostsCommentedUpdateFieldInput {
              connect: [UserPostsCommentedConnectFieldInput!]
              create: [UserPostsCommentedCreateFieldInput!]
              delete: [UserPostsCommentedDeleteFieldInput!]
              disconnect: [UserPostsCommentedDisconnectFieldInput!]
              update: UserPostsCommentedUpdateConnectionInput
              where: UserPostsCommentedConnectionWhere
            }

            input UserRelationInput {
              postsCommented: [UserPostsCommentedCreateFieldInput!]
            }

            \\"\\"\\"
            Fields to sort Users by. The order in which sorts are applied is not guaranteed when specifying many fields in one UserSort object.
            \\"\\"\\"
            input UserSort {
              name: SortDirection
            }

            input UserUpdateInput {
              name: String
              postsCommented: [UserPostsCommentedUpdateFieldInput!]
            }

            input UserWhere {
              AND: [UserWhere!]
              OR: [UserWhere!]
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
              postsCommented: PostWhere @deprecated(reason: \\"Use \`postsCommented_SOME\` instead.\\")
              postsCommentedAggregate: UserPostsCommentedAggregateInput
              postsCommentedConnection: UserPostsCommentedConnectionWhere @deprecated(reason: \\"Use \`postsCommentedConnection_SOME\` instead.\\")
              postsCommentedConnection_ALL: UserPostsCommentedConnectionWhere
              postsCommentedConnection_NONE: UserPostsCommentedConnectionWhere
              postsCommentedConnection_NOT: UserPostsCommentedConnectionWhere @deprecated(reason: \\"Use \`postsCommentedConnection_NONE\` instead.\\")
              postsCommentedConnection_SINGLE: UserPostsCommentedConnectionWhere
              postsCommentedConnection_SOME: UserPostsCommentedConnectionWhere
              \\"\\"\\"Return Users where all of the related Posts match this filter\\"\\"\\"
              postsCommented_ALL: PostWhere
              \\"\\"\\"Return Users where none of the related Posts match this filter\\"\\"\\"
              postsCommented_NONE: PostWhere
              postsCommented_NOT: PostWhere @deprecated(reason: \\"Use \`postsCommented_NONE\` instead.\\")
              \\"\\"\\"Return Users where one of the related Posts match this filter\\"\\"\\"
              postsCommented_SINGLE: PostWhere
              \\"\\"\\"Return Users where some of the related Posts match this filter\\"\\"\\"
              postsCommented_SOME: PostWhere
            }

            type UsersConnection {
              edges: [UserEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            interface postCommentedBy {
              timestamp: Int
            }

            input postCommentedByCreateInput {
              timestamp: Int
            }

            input postCommentedBySort {
              timestamp: SortDirection
            }

            input postCommentedByUpdateInput {
              timestamp: Int
            }

            input postCommentedByWhere {
              AND: [postCommentedByWhere!]
              OR: [postCommentedByWhere!]
              timestamp: Int
              timestamp_GT: Int
              timestamp_GTE: Int
              timestamp_IN: [Int]
              timestamp_LT: Int
              timestamp_LTE: Int
              timestamp_NOT: Int
              timestamp_NOT_IN: [Int]
            }"
        `);
    });
});
