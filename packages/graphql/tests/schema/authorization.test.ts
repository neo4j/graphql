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
import { Neo4jGraphQL } from "../../src";

describe("Authorization", () => {
    test("Authorization", async () => {
        const typeDefs = gql`
            type User @authorization(filter: [{ where: { node: { id: "$jwt.sub" } } }]) {
                id: ID!
                name: String!
                posts: [User!]! @relationship(type: "HAS_AUTHOR", direction: OUT)
            }

            type Post @authorization(filter: [{ where: { node: { id: "$jwt.sub" } } }]) {
                id: ID!
                name: String!
                author: User! @relationship(type: "HAS_AUTHOR", direction: IN)
            }
        `;

        const neoSchema = new Neo4jGraphQL({ typeDefs, features: { authorization: { key: "secret" } } });
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

            type CreatePostsMutationResponse {
              info: CreateInfo!
              posts: [Post!]!
            }

            type CreateUsersMutationResponse {
              info: CreateInfo!
              users: [User!]!
            }

            type DeleteInfo {
              bookmark: String @deprecated(reason: \\"This field has been deprecated because bookmarks are now handled by the driver.\\")
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
              author(directed: Boolean = true, options: UserOptions, where: UserWhere): User!
              authorConnection(after: String, directed: Boolean = true, first: Int, sort: [PostAuthorConnectionSort!], where: PostAuthorConnectionWhere): PostAuthorConnection!
              id: ID!
              name: String!
            }

            input PostAuthorConnectFieldInput {
              connect: UserConnectInput
              \\"\\"\\"
              Whether or not to overwrite any matching relationship with the new properties. Will default to \`false\` in 4.0.0.
              \\"\\"\\"
              overwrite: Boolean! = true
              where: UserConnectWhere
            }

            type PostAuthorConnection {
              edges: [PostAuthorRelationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input PostAuthorConnectionSort {
              node: UserSort
            }

            input PostAuthorConnectionWhere {
              AND: [PostAuthorConnectionWhere!]
              NOT: PostAuthorConnectionWhere
              OR: [PostAuthorConnectionWhere!]
              node: UserWhere
              node_NOT: UserWhere @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
            }

            input PostAuthorCreateFieldInput {
              node: UserCreateInput!
            }

            input PostAuthorDeleteFieldInput {
              delete: UserDeleteInput
              where: PostAuthorConnectionWhere
            }

            input PostAuthorDisconnectFieldInput {
              disconnect: UserDisconnectInput
              where: PostAuthorConnectionWhere
            }

            input PostAuthorFieldInput {
              connect: PostAuthorConnectFieldInput
              create: PostAuthorCreateFieldInput
            }

            type PostAuthorRelationship {
              cursor: String!
              node: User!
            }

            input PostAuthorUpdateConnectionInput {
              node: UserUpdateInput
            }

            input PostAuthorUpdateFieldInput {
              connect: PostAuthorConnectFieldInput
              create: PostAuthorCreateFieldInput
              delete: PostAuthorDeleteFieldInput
              disconnect: PostAuthorDisconnectFieldInput
              update: PostAuthorUpdateConnectionInput
              where: PostAuthorConnectionWhere
            }

            input PostConnectInput {
              author: PostAuthorConnectFieldInput
            }

            input PostCreateInput {
              author: PostAuthorFieldInput
              id: ID!
              name: String!
            }

            input PostDeleteInput {
              author: PostAuthorDeleteFieldInput
            }

            input PostDisconnectInput {
              author: PostAuthorDisconnectFieldInput
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
              author: PostAuthorCreateFieldInput
            }

            \\"\\"\\"
            Fields to sort Posts by. The order in which sorts are applied is not guaranteed when specifying many fields in one PostSort object.
            \\"\\"\\"
            input PostSort {
              id: SortDirection
              name: SortDirection
            }

            input PostUpdateInput {
              author: PostAuthorUpdateFieldInput
              id: ID
              name: String
            }

            input PostWhere {
              AND: [PostWhere!]
              NOT: PostWhere
              OR: [PostWhere!]
              author: UserWhere
              authorConnection: PostAuthorConnectionWhere
              authorConnection_NOT: PostAuthorConnectionWhere
              author_NOT: UserWhere
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

            type PostsConnection {
              edges: [PostEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            type Query {
              posts(options: PostOptions, where: PostWhere): [Post!]!
              postsConnection(after: String, first: Int, sort: [PostSort], where: PostWhere): PostsConnection!
              users(options: UserOptions, where: UserWhere): [User!]!
              usersConnection(after: String, first: Int, sort: [UserSort], where: UserWhere): UsersConnection!
            }

            enum SortDirection {
              \\"\\"\\"Sort by field values in ascending order.\\"\\"\\"
              ASC
              \\"\\"\\"Sort by field values in descending order.\\"\\"\\"
              DESC
            }

            type UpdateInfo {
              bookmark: String @deprecated(reason: \\"This field has been deprecated because bookmarks are now handled by the driver.\\")
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
              id: ID!
              name: String!
              posts(directed: Boolean = true, options: UserOptions, where: UserWhere): [User!]!
              postsConnection(after: String, directed: Boolean = true, first: Int, sort: [UserPostsConnectionSort!], where: UserPostsConnectionWhere): UserPostsConnection!
            }

            input UserConnectInput {
              posts: [UserPostsConnectFieldInput!]
            }

            input UserConnectWhere {
              node: UserWhere!
            }

            input UserCreateInput {
              id: ID!
              name: String!
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

            input UserPostsConnectFieldInput {
              connect: [UserConnectInput!]
              \\"\\"\\"
              Whether or not to overwrite any matching relationship with the new properties. Will default to \`false\` in 4.0.0.
              \\"\\"\\"
              overwrite: Boolean! = true
              where: UserConnectWhere
            }

            type UserPostsConnection {
              edges: [UserPostsRelationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input UserPostsConnectionSort {
              node: UserSort
            }

            input UserPostsConnectionWhere {
              AND: [UserPostsConnectionWhere!]
              NOT: UserPostsConnectionWhere
              OR: [UserPostsConnectionWhere!]
              node: UserWhere
              node_NOT: UserWhere @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
            }

            input UserPostsCreateFieldInput {
              node: UserCreateInput!
            }

            input UserPostsDeleteFieldInput {
              delete: UserDeleteInput
              where: UserPostsConnectionWhere
            }

            input UserPostsDisconnectFieldInput {
              disconnect: UserDisconnectInput
              where: UserPostsConnectionWhere
            }

            input UserPostsFieldInput {
              connect: [UserPostsConnectFieldInput!]
              create: [UserPostsCreateFieldInput!]
            }

            type UserPostsRelationship {
              cursor: String!
              node: User!
            }

            input UserPostsUpdateConnectionInput {
              node: UserUpdateInput
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
              id: SortDirection
              name: SortDirection
            }

            input UserUpdateInput {
              id: ID
              name: String
              posts: [UserPostsUpdateFieldInput!]
            }

            input UserWhere {
              AND: [UserWhere!]
              NOT: UserWhere
              OR: [UserWhere!]
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
              posts: UserWhere @deprecated(reason: \\"Use \`posts_SOME\` instead.\\")
              postsConnection: UserPostsConnectionWhere @deprecated(reason: \\"Use \`postsConnection_SOME\` instead.\\")
              \\"\\"\\"
              Return Users where all of the related UserPostsConnections match this filter
              \\"\\"\\"
              postsConnection_ALL: UserPostsConnectionWhere
              \\"\\"\\"
              Return Users where none of the related UserPostsConnections match this filter
              \\"\\"\\"
              postsConnection_NONE: UserPostsConnectionWhere
              postsConnection_NOT: UserPostsConnectionWhere @deprecated(reason: \\"Use \`postsConnection_NONE\` instead.\\")
              \\"\\"\\"
              Return Users where one of the related UserPostsConnections match this filter
              \\"\\"\\"
              postsConnection_SINGLE: UserPostsConnectionWhere
              \\"\\"\\"
              Return Users where some of the related UserPostsConnections match this filter
              \\"\\"\\"
              postsConnection_SOME: UserPostsConnectionWhere
              \\"\\"\\"Return Users where all of the related Users match this filter\\"\\"\\"
              posts_ALL: UserWhere
              \\"\\"\\"Return Users where none of the related Users match this filter\\"\\"\\"
              posts_NONE: UserWhere
              posts_NOT: UserWhere @deprecated(reason: \\"Use \`posts_NONE\` instead.\\")
              \\"\\"\\"Return Users where one of the related Users match this filter\\"\\"\\"
              posts_SINGLE: UserWhere
              \\"\\"\\"Return Users where some of the related Users match this filter\\"\\"\\"
              posts_SOME: UserWhere
            }

            type UsersConnection {
              edges: [UserEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }"
        `);
    });
});
