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

            input ConnectionAggregationCountFilterInput {
              edges: IntScalarFilters
              nodes: IntScalarFilters
            }

            type Count {
              nodes: Int!
            }

            type CountConnection {
              edges: Int!
              nodes: Int!
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

            \\"\\"\\"Float filters\\"\\"\\"
            input FloatScalarFilters {
              eq: Float
              gt: Float
              gte: Float
              in: [Float!]
              lt: Float
              lte: Float
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

            \\"\\"\\"Int filters\\"\\"\\"
            input IntScalarFilters {
              eq: Int
              gt: Int
              gte: Int
              in: [Int!]
              lt: Int
              lte: Int
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
              authorConnection(after: String, first: Int, sort: [PostAuthorConnectionSort!], where: PostAuthorConnectionWhere): PostAuthorConnection!
              id: ID!
              name: String!
            }

            type PostAggregate {
              count: Count!
              node: PostAggregateNode!
            }

            type PostAggregateNode {
              name: StringAggregateSelection!
            }

            input PostAuthorAggregateInput {
              AND: [PostAuthorAggregateInput!]
              NOT: PostAuthorAggregateInput
              OR: [PostAuthorAggregateInput!]
              count: IntScalarFilters
              count_EQ: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { eq: ... } } }' instead.\\")
              count_GT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gt: ... } } }' instead.\\")
              count_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gte: ... } } }' instead.\\")
              count_LT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lt: ... } } }' instead.\\")
              count_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lte: ... } } }' instead.\\")
              node: PostAuthorNodeAggregationWhereInput
            }

            input PostAuthorConnectFieldInput {
              connect: [UserConnectInput!]
              where: UserConnectWhere
            }

            type PostAuthorConnection {
              aggregate: PostUserAuthorAggregateSelection!
              edges: [PostAuthorRelationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input PostAuthorConnectionAggregateInput {
              AND: [PostAuthorConnectionAggregateInput!]
              NOT: PostAuthorConnectionAggregateInput
              OR: [PostAuthorConnectionAggregateInput!]
              count: ConnectionAggregationCountFilterInput
              node: PostAuthorNodeAggregationWhereInput
            }

            input PostAuthorConnectionFilters {
              \\"\\"\\"Filter Posts by aggregating results on related PostAuthorConnections\\"\\"\\"
              aggregate: PostAuthorConnectionAggregateInput
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
              name: StringScalarAggregationFilters
              name_AVERAGE_LENGTH_EQUAL: Float @deprecated(reason: \\"Please use the relevant generic filter 'name: { averageLength: { eq: ... } } }' instead.\\")
              name_AVERAGE_LENGTH_GT: Float @deprecated(reason: \\"Please use the relevant generic filter 'name: { averageLength: { gt: ... } } }' instead.\\")
              name_AVERAGE_LENGTH_GTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'name: { averageLength: { gte: ... } } }' instead.\\")
              name_AVERAGE_LENGTH_LT: Float @deprecated(reason: \\"Please use the relevant generic filter 'name: { averageLength: { lt: ... } } }' instead.\\")
              name_AVERAGE_LENGTH_LTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'name: { averageLength: { lte: ... } } }' instead.\\")
              name_LONGEST_LENGTH_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'name: { longestLength: { eq: ... } } }' instead.\\")
              name_LONGEST_LENGTH_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'name: { longestLength: { gt: ... } } }' instead.\\")
              name_LONGEST_LENGTH_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'name: { longestLength: { gte: ... } } }' instead.\\")
              name_LONGEST_LENGTH_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'name: { longestLength: { lt: ... } } }' instead.\\")
              name_LONGEST_LENGTH_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'name: { longestLength: { lte: ... } } }' instead.\\")
              name_SHORTEST_LENGTH_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'name: { shortestLength: { eq: ... } } }' instead.\\")
              name_SHORTEST_LENGTH_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'name: { shortestLength: { gt: ... } } }' instead.\\")
              name_SHORTEST_LENGTH_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'name: { shortestLength: { gte: ... } } }' instead.\\")
              name_SHORTEST_LENGTH_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'name: { shortestLength: { lt: ... } } }' instead.\\")
              name_SHORTEST_LENGTH_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'name: { shortestLength: { lte: ... } } }' instead.\\")
            }

            type PostAuthorRelationship {
              cursor: String!
              node: User!
            }

            input PostAuthorUpdateConnectionInput {
              node: UserUpdateInput
              where: PostAuthorConnectionWhere
            }

            input PostAuthorUpdateFieldInput {
              connect: [PostAuthorConnectFieldInput!]
              create: [PostAuthorCreateFieldInput!]
              delete: [PostAuthorDeleteFieldInput!]
              disconnect: [PostAuthorDisconnectFieldInput!]
              update: PostAuthorUpdateConnectionInput
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
              id_SET: ID @deprecated(reason: \\"Please use the generic mutation 'id: { set: ... } }' instead.\\")
              name: StringScalarMutations
              name_SET: String @deprecated(reason: \\"Please use the generic mutation 'name: { set: ... } }' instead.\\")
            }

            type PostUserAuthorAggregateSelection {
              count: CountConnection!
              node: PostUserAuthorNodeAggregateSelection
            }

            type PostUserAuthorNodeAggregateSelection {
              name: StringAggregateSelection!
            }

            input PostWhere {
              AND: [PostWhere!]
              NOT: PostWhere
              OR: [PostWhere!]
              author: UserRelationshipFilters
              authorAggregate: PostAuthorAggregateInput @deprecated(reason: \\"Aggregate filters are moved inside the authorConnection filter, please use { authorConnection: { aggregate: {...} } } instead\\")
              authorConnection: PostAuthorConnectionFilters
              \\"\\"\\"
              Return Posts where all of the related PostAuthorConnections match this filter
              \\"\\"\\"
              authorConnection_ALL: PostAuthorConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'authorConnection: { all: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Posts where none of the related PostAuthorConnections match this filter
              \\"\\"\\"
              authorConnection_NONE: PostAuthorConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'authorConnection: { none: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Posts where one of the related PostAuthorConnections match this filter
              \\"\\"\\"
              authorConnection_SINGLE: PostAuthorConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'authorConnection: { single: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Posts where some of the related PostAuthorConnections match this filter
              \\"\\"\\"
              authorConnection_SOME: PostAuthorConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'authorConnection: { some: { node: ... } } }' instead.\\")
              \\"\\"\\"Return Posts where all of the related Users match this filter\\"\\"\\"
              author_ALL: UserWhere @deprecated(reason: \\"Please use the relevant generic filter 'author: { all: ... }' instead.\\")
              \\"\\"\\"Return Posts where none of the related Users match this filter\\"\\"\\"
              author_NONE: UserWhere @deprecated(reason: \\"Please use the relevant generic filter 'author: { none: ... }' instead.\\")
              \\"\\"\\"Return Posts where one of the related Users match this filter\\"\\"\\"
              author_SINGLE: UserWhere @deprecated(reason: \\"Please use the relevant generic filter 'author: {  single: ... }' instead.\\")
              \\"\\"\\"Return Posts where some of the related Users match this filter\\"\\"\\"
              author_SOME: UserWhere @deprecated(reason: \\"Please use the relevant generic filter 'author: {  some: ... }' instead.\\")
              id: IDScalarFilters
              id_CONTAINS: ID @deprecated(reason: \\"Please use the relevant generic filter id: { contains: ... }\\")
              id_ENDS_WITH: ID @deprecated(reason: \\"Please use the relevant generic filter id: { endsWith: ... }\\")
              id_EQ: ID @deprecated(reason: \\"Please use the relevant generic filter id: { eq: ... }\\")
              id_IN: [ID!] @deprecated(reason: \\"Please use the relevant generic filter id: { in: ... }\\")
              id_STARTS_WITH: ID @deprecated(reason: \\"Please use the relevant generic filter id: { startsWith: ... }\\")
              name: StringScalarFilters
              name_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter name: { contains: ... }\\")
              name_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter name: { endsWith: ... }\\")
              name_EQ: String @deprecated(reason: \\"Please use the relevant generic filter name: { eq: ... }\\")
              name_IN: [String!] @deprecated(reason: \\"Please use the relevant generic filter name: { in: ... }\\")
              name_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter name: { startsWith: ... }\\")
            }

            type PostsConnection {
              aggregate: PostAggregate!
              edges: [PostEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            type Query {
              posts(limit: Int, offset: Int, sort: [PostSort!], where: PostWhere): [Post!]!
              postsConnection(after: String, first: Int, sort: [PostSort!], where: PostWhere): PostsConnection!
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

            \\"\\"\\"Filters for an aggregation of a string field\\"\\"\\"
            input StringScalarAggregationFilters {
              averageLength: FloatScalarFilters
              longestLength: IntScalarFilters
              shortestLength: IntScalarFilters
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
              postsConnection(after: String, first: Int, sort: [UserPostsConnectionSort!], where: UserPostsConnectionWhere): UserPostsConnection!
            }

            type UserAggregate {
              count: Count!
              node: UserAggregateNode!
            }

            type UserAggregateNode {
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
              count: IntScalarFilters
              count_EQ: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { eq: ... } } }' instead.\\")
              count_GT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gt: ... } } }' instead.\\")
              count_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gte: ... } } }' instead.\\")
              count_LT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lt: ... } } }' instead.\\")
              count_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lte: ... } } }' instead.\\")
              node: UserPostsNodeAggregationWhereInput
            }

            input UserPostsConnectFieldInput {
              connect: [UserConnectInput!]
              where: UserConnectWhere
            }

            type UserPostsConnection {
              aggregate: UserUserPostsAggregateSelection!
              edges: [UserPostsRelationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input UserPostsConnectionAggregateInput {
              AND: [UserPostsConnectionAggregateInput!]
              NOT: UserPostsConnectionAggregateInput
              OR: [UserPostsConnectionAggregateInput!]
              count: ConnectionAggregationCountFilterInput
              node: UserPostsNodeAggregationWhereInput
            }

            input UserPostsConnectionFilters {
              \\"\\"\\"Filter Users by aggregating results on related UserPostsConnections\\"\\"\\"
              aggregate: UserPostsConnectionAggregateInput
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
              name: StringScalarAggregationFilters
              name_AVERAGE_LENGTH_EQUAL: Float @deprecated(reason: \\"Please use the relevant generic filter 'name: { averageLength: { eq: ... } } }' instead.\\")
              name_AVERAGE_LENGTH_GT: Float @deprecated(reason: \\"Please use the relevant generic filter 'name: { averageLength: { gt: ... } } }' instead.\\")
              name_AVERAGE_LENGTH_GTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'name: { averageLength: { gte: ... } } }' instead.\\")
              name_AVERAGE_LENGTH_LT: Float @deprecated(reason: \\"Please use the relevant generic filter 'name: { averageLength: { lt: ... } } }' instead.\\")
              name_AVERAGE_LENGTH_LTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'name: { averageLength: { lte: ... } } }' instead.\\")
              name_LONGEST_LENGTH_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'name: { longestLength: { eq: ... } } }' instead.\\")
              name_LONGEST_LENGTH_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'name: { longestLength: { gt: ... } } }' instead.\\")
              name_LONGEST_LENGTH_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'name: { longestLength: { gte: ... } } }' instead.\\")
              name_LONGEST_LENGTH_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'name: { longestLength: { lt: ... } } }' instead.\\")
              name_LONGEST_LENGTH_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'name: { longestLength: { lte: ... } } }' instead.\\")
              name_SHORTEST_LENGTH_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'name: { shortestLength: { eq: ... } } }' instead.\\")
              name_SHORTEST_LENGTH_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'name: { shortestLength: { gt: ... } } }' instead.\\")
              name_SHORTEST_LENGTH_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'name: { shortestLength: { gte: ... } } }' instead.\\")
              name_SHORTEST_LENGTH_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'name: { shortestLength: { lt: ... } } }' instead.\\")
              name_SHORTEST_LENGTH_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'name: { shortestLength: { lte: ... } } }' instead.\\")
            }

            type UserPostsRelationship {
              cursor: String!
              node: User!
            }

            input UserPostsUpdateConnectionInput {
              node: UserUpdateInput
              where: UserPostsConnectionWhere
            }

            input UserPostsUpdateFieldInput {
              connect: [UserPostsConnectFieldInput!]
              create: [UserPostsCreateFieldInput!]
              delete: [UserPostsDeleteFieldInput!]
              disconnect: [UserPostsDisconnectFieldInput!]
              update: UserPostsUpdateConnectionInput
            }

            input UserRelationshipFilters {
              \\"\\"\\"Filter type where all of the related Users match this filter\\"\\"\\"
              all: UserWhere
              \\"\\"\\"Filter type where none of the related Users match this filter\\"\\"\\"
              none: UserWhere
              \\"\\"\\"Filter type where one of the related Users match this filter\\"\\"\\"
              single: UserWhere
              \\"\\"\\"Filter type where some of the related Users match this filter\\"\\"\\"
              some: UserWhere
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
              id_SET: ID @deprecated(reason: \\"Please use the generic mutation 'id: { set: ... } }' instead.\\")
              name: StringScalarMutations
              name_SET: String @deprecated(reason: \\"Please use the generic mutation 'name: { set: ... } }' instead.\\")
              posts: [UserPostsUpdateFieldInput!]
            }

            type UserUserPostsAggregateSelection {
              count: CountConnection!
              node: UserUserPostsNodeAggregateSelection
            }

            type UserUserPostsNodeAggregateSelection {
              name: StringAggregateSelection!
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
              name: StringScalarFilters
              name_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter name: { contains: ... }\\")
              name_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter name: { endsWith: ... }\\")
              name_EQ: String @deprecated(reason: \\"Please use the relevant generic filter name: { eq: ... }\\")
              name_IN: [String!] @deprecated(reason: \\"Please use the relevant generic filter name: { in: ... }\\")
              name_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter name: { startsWith: ... }\\")
              posts: UserRelationshipFilters
              postsAggregate: UserPostsAggregateInput @deprecated(reason: \\"Aggregate filters are moved inside the postsConnection filter, please use { postsConnection: { aggregate: {...} } } instead\\")
              postsConnection: UserPostsConnectionFilters
              \\"\\"\\"
              Return Users where all of the related UserPostsConnections match this filter
              \\"\\"\\"
              postsConnection_ALL: UserPostsConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'postsConnection: { all: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Users where none of the related UserPostsConnections match this filter
              \\"\\"\\"
              postsConnection_NONE: UserPostsConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'postsConnection: { none: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Users where one of the related UserPostsConnections match this filter
              \\"\\"\\"
              postsConnection_SINGLE: UserPostsConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'postsConnection: { single: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Users where some of the related UserPostsConnections match this filter
              \\"\\"\\"
              postsConnection_SOME: UserPostsConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'postsConnection: { some: { node: ... } } }' instead.\\")
              \\"\\"\\"Return Users where all of the related Users match this filter\\"\\"\\"
              posts_ALL: UserWhere @deprecated(reason: \\"Please use the relevant generic filter 'posts: { all: ... }' instead.\\")
              \\"\\"\\"Return Users where none of the related Users match this filter\\"\\"\\"
              posts_NONE: UserWhere @deprecated(reason: \\"Please use the relevant generic filter 'posts: { none: ... }' instead.\\")
              \\"\\"\\"Return Users where one of the related Users match this filter\\"\\"\\"
              posts_SINGLE: UserWhere @deprecated(reason: \\"Please use the relevant generic filter 'posts: {  single: ... }' instead.\\")
              \\"\\"\\"Return Users where some of the related Users match this filter\\"\\"\\"
              posts_SOME: UserWhere @deprecated(reason: \\"Please use the relevant generic filter 'posts: {  some: ... }' instead.\\")
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
