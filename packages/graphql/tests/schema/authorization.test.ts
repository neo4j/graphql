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

describe("Authorization", () => {
    test("Authorization", async () => {
        const typeDefs = gql`
            type User @authorization(filter: [{ where: { node: { id_EQ: "$jwt.sub" } } }]) @node {
                id: ID!
                name: String!
                posts: [User!]! @relationship(type: "HAS_AUTHOR", direction: OUT)
            }

            type Post @authorization(filter: [{ where: { node: { id_EQ: "$jwt.sub" } } }]) @node {
                id: ID!
                name: String!
                author: [User!]! @relationship(type: "HAS_AUTHOR", direction: IN)
            }
        `;

        const neoSchema = new Neo4jGraphQL({ typeDefs, features: { authorization: { key: "secret" } } });
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

            type CreatePostsMutationResponse {
              info: CreateInfo!
              posts: [Post!]!
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

            type IDAggregateSelection {
              longest: ID
              shortest: ID
            }

            \\"\\"\\"ID filters\\"\\"\\"
            input IDScalarFilters {
              contains: ID
              endsWith: ID
              equals: ID
              greaterThan: ID
              greaterThanEquals: ID
              in: [ID!]
              lessThan: ID
              lessThanEquals: ID
              matches: ID
              startsWith: ID
            }

            \\"\\"\\"ID mutations\\"\\"\\"
            input IDScalarMutations {
              set: ID
            }

            type Mutation {
              createPosts(input: [PostCreateInput!]!): CreatePostsMutationResponse!
              createUsers(input: [UserCreateInput!]!): CreateUsersMutationResponse!
              deletePosts(delete: PostDeleteInput, where: PostWhere): DeleteInfo!
              deleteUsers(delete: UserDeleteInput, where: UserWhere): DeleteInfo!
              updatePosts(update: PostUpdateInput, where: PostWhere): UpdatePostsMutationResponse!
              updateUsers(update: UserUpdateInput, where: UserWhere): UpdateUsersMutationResponse!
            }

            \\"\\"\\"Pagination information (Relay)\\"\\"\\"
            type PageInfo {
              endCursor: String
              hasNextPage: Boolean!
              hasPreviousPage: Boolean!
              startCursor: String
            }

            type Post {
              author(limit: Int, offset: Int, sort: [UserSort!], where: UserWhere): [User!]!
              authorAggregate(where: UserWhere): PostUserAuthorAggregationSelection
              authorConnection(after: String, first: Int, sort: [PostAuthorConnectionSort!], where: PostAuthorConnectionWhere): PostAuthorConnection!
              id: ID!
              name: String!
            }

            type PostAggregateSelection {
              count: Int!
              id: IDAggregateSelection!
              name: StringAggregateSelection!
            }

            input PostAuthorAggregateInput {
              AND: [PostAuthorAggregateInput!]
              NOT: PostAuthorAggregateInput
              OR: [PostAuthorAggregateInput!]
              count_EQ: Int
              count_GT: Int
              count_GTE: Int
              count_LT: Int
              count_LTE: Int
              node: PostAuthorNodeAggregationWhereInput
            }

            input PostAuthorConnectFieldInput {
              connect: [UserConnectInput!]
              where: UserConnectWhere
            }

            type PostAuthorConnection {
              edges: [PostAuthorRelationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input PostAuthorConnectionFilters {
              \\"\\"\\"
              Return Posts where all of the related PostAuthorConnections match this filter
              \\"\\"\\"
              all: PostAuthorConnectionWhere
              \\"\\"\\"
              Return Posts where none of the related PostAuthorConnections match this filter
              \\"\\"\\"
              none: PostAuthorConnectionWhere
              \\"\\"\\"
              Return Posts where one of the related PostAuthorConnections match this filter
              \\"\\"\\"
              single: PostAuthorConnectionWhere
              \\"\\"\\"
              Return Posts where some of the related PostAuthorConnections match this filter
              \\"\\"\\"
              some: PostAuthorConnectionWhere
            }

            input PostAuthorConnectionSort {
              node: UserSort
            }

            input PostAuthorConnectionWhere {
              AND: [PostAuthorConnectionWhere!]
              NOT: PostAuthorConnectionWhere
              OR: [PostAuthorConnectionWhere!]
              node: UserWhere
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
              connect: [PostAuthorConnectFieldInput!]
              create: [PostAuthorCreateFieldInput!]
            }

            input PostAuthorNodeAggregationWhereInput {
              AND: [PostAuthorNodeAggregationWhereInput!]
              NOT: PostAuthorNodeAggregationWhereInput
              OR: [PostAuthorNodeAggregationWhereInput!]
              id_MAX_EQUAL: ID
              id_MAX_GT: ID
              id_MAX_GTE: ID
              id_MAX_LT: ID
              id_MAX_LTE: ID
              id_MIN_EQUAL: ID
              id_MIN_GT: ID
              id_MIN_GTE: ID
              id_MIN_LT: ID
              id_MIN_LTE: ID
              name_AVERAGE_LENGTH_EQUAL: Float
              name_AVERAGE_LENGTH_GT: Float
              name_AVERAGE_LENGTH_GTE: Float
              name_AVERAGE_LENGTH_LT: Float
              name_AVERAGE_LENGTH_LTE: Float
              name_LONGEST_LENGTH_EQUAL: Int
              name_LONGEST_LENGTH_GT: Int
              name_LONGEST_LENGTH_GTE: Int
              name_LONGEST_LENGTH_LT: Int
              name_LONGEST_LENGTH_LTE: Int
              name_SHORTEST_LENGTH_EQUAL: Int
              name_SHORTEST_LENGTH_GT: Int
              name_SHORTEST_LENGTH_GTE: Int
              name_SHORTEST_LENGTH_LT: Int
              name_SHORTEST_LENGTH_LTE: Int
            }

            type PostAuthorRelationship {
              cursor: String!
              node: User!
            }

            input PostAuthorRelationshipFilters {
              \\"\\"\\"Return Posts where all of the related Users match this filter\\"\\"\\"
              all: UserWhere
              \\"\\"\\"Return Posts where none of the related Users match this filter\\"\\"\\"
              none: UserWhere
              \\"\\"\\"Return Posts where one of the related Users match this filter\\"\\"\\"
              single: UserWhere
              \\"\\"\\"Return Posts where some of the related Users match this filter\\"\\"\\"
              some: UserWhere
            }

            input PostAuthorUpdateConnectionInput {
              node: UserUpdateInput
            }

            input PostAuthorUpdateFieldInput {
              connect: [PostAuthorConnectFieldInput!]
              create: [PostAuthorCreateFieldInput!]
              delete: [PostAuthorDeleteFieldInput!]
              disconnect: [PostAuthorDisconnectFieldInput!]
              update: PostAuthorUpdateConnectionInput
              where: PostAuthorConnectionWhere
            }

            input PostCreateInput {
              author: PostAuthorFieldInput
              id: ID!
              name: String!
            }

            input PostDeleteInput {
              author: [PostAuthorDeleteFieldInput!]
            }

            type PostEdge {
              cursor: String!
              node: Post!
            }

            \\"\\"\\"
            Fields to sort Posts by. The order in which sorts are applied is not guaranteed when specifying many fields in one PostSort object.
            \\"\\"\\"
            input PostSort {
              id: SortDirection
              name: SortDirection
            }

            input PostUpdateInput {
              author: [PostAuthorUpdateFieldInput!]
              id: IDScalarMutations
              id_SET: ID
              name: StringScalarMutations
              name_SET: String
            }

            type PostUserAuthorAggregationSelection {
              count: Int!
              node: PostUserAuthorNodeAggregateSelection
            }

            type PostUserAuthorNodeAggregateSelection {
              id: IDAggregateSelection!
              name: StringAggregateSelection!
            }

            input PostWhere {
              AND: [PostWhere!]
              NOT: PostWhere
              OR: [PostWhere!]
              author: PostAuthorRelationshipFilters
              authorAggregate: PostAuthorAggregateInput
              authorConnection: PostAuthorConnectionFilters
              \\"\\"\\"
              Return Posts where all of the related PostAuthorConnections match this filter
              \\"\\"\\"
              authorConnection_ALL: PostAuthorConnectionWhere
              \\"\\"\\"
              Return Posts where none of the related PostAuthorConnections match this filter
              \\"\\"\\"
              authorConnection_NONE: PostAuthorConnectionWhere
              \\"\\"\\"
              Return Posts where one of the related PostAuthorConnections match this filter
              \\"\\"\\"
              authorConnection_SINGLE: PostAuthorConnectionWhere
              \\"\\"\\"
              Return Posts where some of the related PostAuthorConnections match this filter
              \\"\\"\\"
              authorConnection_SOME: PostAuthorConnectionWhere
              \\"\\"\\"Return Posts where all of the related Users match this filter\\"\\"\\"
              author_ALL: UserWhere
              \\"\\"\\"Return Posts where none of the related Users match this filter\\"\\"\\"
              author_NONE: UserWhere
              \\"\\"\\"Return Posts where one of the related Users match this filter\\"\\"\\"
              author_SINGLE: UserWhere
              \\"\\"\\"Return Posts where some of the related Users match this filter\\"\\"\\"
              author_SOME: UserWhere
              id: IDScalarFilters
              id_CONTAINS: ID
              id_ENDS_WITH: ID
              id_EQ: ID
              id_IN: [ID!]
              id_STARTS_WITH: ID
              name: StringScalarFilters
              name_CONTAINS: String
              name_ENDS_WITH: String
              name_EQ: String
              name_IN: [String!]
              name_STARTS_WITH: String
            }

            type PostsConnection {
              edges: [PostEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            type Query {
              posts(limit: Int, offset: Int, sort: [PostSort!], where: PostWhere): [Post!]!
              postsAggregate(where: PostWhere): PostAggregateSelection!
              postsConnection(after: String, first: Int, sort: [PostSort!], where: PostWhere): PostsConnection!
              users(limit: Int, offset: Int, sort: [UserSort!], where: UserWhere): [User!]!
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

            \\"\\"\\"String filters\\"\\"\\"
            input StringScalarFilters {
              contains: String
              endsWith: String
              equals: String
              greaterThan: String
              greaterThanEquals: String
              in: [String!]
              lessThan: String
              lessThanEquals: String
              matches: String
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
              posts(limit: Int, offset: Int, sort: [UserSort!], where: UserWhere): [User!]!
              postsAggregate(where: UserWhere): UserUserPostsAggregationSelection
              postsConnection(after: String, first: Int, sort: [UserPostsConnectionSort!], where: UserPostsConnectionWhere): UserPostsConnection!
            }

            type UserAggregateSelection {
              count: Int!
              id: IDAggregateSelection!
              name: StringAggregateSelection!
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

            input UserPostsAggregateInput {
              AND: [UserPostsAggregateInput!]
              NOT: UserPostsAggregateInput
              OR: [UserPostsAggregateInput!]
              count_EQ: Int
              count_GT: Int
              count_GTE: Int
              count_LT: Int
              count_LTE: Int
              node: UserPostsNodeAggregationWhereInput
            }

            input UserPostsConnectFieldInput {
              connect: [UserConnectInput!]
              where: UserConnectWhere
            }

            type UserPostsConnection {
              edges: [UserPostsRelationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input UserPostsConnectionFilters {
              \\"\\"\\"
              Return Users where all of the related UserPostsConnections match this filter
              \\"\\"\\"
              all: UserPostsConnectionWhere
              \\"\\"\\"
              Return Users where none of the related UserPostsConnections match this filter
              \\"\\"\\"
              none: UserPostsConnectionWhere
              \\"\\"\\"
              Return Users where one of the related UserPostsConnections match this filter
              \\"\\"\\"
              single: UserPostsConnectionWhere
              \\"\\"\\"
              Return Users where some of the related UserPostsConnections match this filter
              \\"\\"\\"
              some: UserPostsConnectionWhere
            }

            input UserPostsConnectionSort {
              node: UserSort
            }

            input UserPostsConnectionWhere {
              AND: [UserPostsConnectionWhere!]
              NOT: UserPostsConnectionWhere
              OR: [UserPostsConnectionWhere!]
              node: UserWhere
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

            input UserPostsNodeAggregationWhereInput {
              AND: [UserPostsNodeAggregationWhereInput!]
              NOT: UserPostsNodeAggregationWhereInput
              OR: [UserPostsNodeAggregationWhereInput!]
              id_MAX_EQUAL: ID
              id_MAX_GT: ID
              id_MAX_GTE: ID
              id_MAX_LT: ID
              id_MAX_LTE: ID
              id_MIN_EQUAL: ID
              id_MIN_GT: ID
              id_MIN_GTE: ID
              id_MIN_LT: ID
              id_MIN_LTE: ID
              name_AVERAGE_LENGTH_EQUAL: Float
              name_AVERAGE_LENGTH_GT: Float
              name_AVERAGE_LENGTH_GTE: Float
              name_AVERAGE_LENGTH_LT: Float
              name_AVERAGE_LENGTH_LTE: Float
              name_LONGEST_LENGTH_EQUAL: Int
              name_LONGEST_LENGTH_GT: Int
              name_LONGEST_LENGTH_GTE: Int
              name_LONGEST_LENGTH_LT: Int
              name_LONGEST_LENGTH_LTE: Int
              name_SHORTEST_LENGTH_EQUAL: Int
              name_SHORTEST_LENGTH_GT: Int
              name_SHORTEST_LENGTH_GTE: Int
              name_SHORTEST_LENGTH_LT: Int
              name_SHORTEST_LENGTH_LTE: Int
            }

            type UserPostsRelationship {
              cursor: String!
              node: User!
            }

            input UserPostsRelationshipFilters {
              \\"\\"\\"Return Users where all of the related Users match this filter\\"\\"\\"
              all: UserWhere
              \\"\\"\\"Return Users where none of the related Users match this filter\\"\\"\\"
              none: UserWhere
              \\"\\"\\"Return Users where one of the related Users match this filter\\"\\"\\"
              single: UserWhere
              \\"\\"\\"Return Users where some of the related Users match this filter\\"\\"\\"
              some: UserWhere
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

            \\"\\"\\"
            Fields to sort Users by. The order in which sorts are applied is not guaranteed when specifying many fields in one UserSort object.
            \\"\\"\\"
            input UserSort {
              id: SortDirection
              name: SortDirection
            }

            input UserUpdateInput {
              id: IDScalarMutations
              id_SET: ID
              name: StringScalarMutations
              name_SET: String
              posts: [UserPostsUpdateFieldInput!]
            }

            type UserUserPostsAggregationSelection {
              count: Int!
              node: UserUserPostsNodeAggregateSelection
            }

            type UserUserPostsNodeAggregateSelection {
              id: IDAggregateSelection!
              name: StringAggregateSelection!
            }

            input UserWhere {
              AND: [UserWhere!]
              NOT: UserWhere
              OR: [UserWhere!]
              id: IDScalarFilters
              id_CONTAINS: ID
              id_ENDS_WITH: ID
              id_EQ: ID
              id_IN: [ID!]
              id_STARTS_WITH: ID
              name: StringScalarFilters
              name_CONTAINS: String
              name_ENDS_WITH: String
              name_EQ: String
              name_IN: [String!]
              name_STARTS_WITH: String
              posts: UserPostsRelationshipFilters
              postsAggregate: UserPostsAggregateInput
              postsConnection: UserPostsConnectionFilters
              \\"\\"\\"
              Return Users where all of the related UserPostsConnections match this filter
              \\"\\"\\"
              postsConnection_ALL: UserPostsConnectionWhere
              \\"\\"\\"
              Return Users where none of the related UserPostsConnections match this filter
              \\"\\"\\"
              postsConnection_NONE: UserPostsConnectionWhere
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
