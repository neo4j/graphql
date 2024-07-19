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
import { Neo4jGraphQL } from "../../../../src";

describe("Apollo Federation", () => {
    test("@shareable", async () => {
        const typeDefs = gql`
            extend schema @link(url: "https://specs.apollo.dev/federation/v2.0", import: ["@shareable"])

            type User @node @shareable {
                name: String!
                posts: [Post!]! @relationship(type: "HAS_AUTHOR", direction: IN)
            }

            type Post @node {
                content: String!
                author: [User!]! @relationship(type: "HAS_AUTHOR", direction: OUT)
            }
        `;

        const neoSchema = new Neo4jGraphQL({ typeDefs, driver: jest.fn() as any });

        const printedSchema = printSchemaWithDirectives(
            lexicographicSortSchema(await neoSchema.getAuraSubgraphSchema())
        );
        // const printedSchema = printSchemaWithDirectives(lexicographicSortSchema(await neoSchema.getSubgraphSchema()));

        expect(printedSchema).toMatchInlineSnapshot(`
            "schema @link(url: \\"https://specs.apollo.dev/link/v1.0\\") @link(url: \\"https://specs.apollo.dev/federation/v2.0\\", import: [\\"@shareable\\"]) {
              query: Query
            }

            directive @federation__extends on INTERFACE | OBJECT

            directive @federation__external(reason: String) on FIELD_DEFINITION | OBJECT

            directive @federation__inaccessible on ARGUMENT_DEFINITION | ENUM | ENUM_VALUE | FIELD_DEFINITION | INPUT_FIELD_DEFINITION | INPUT_OBJECT | INTERFACE | OBJECT | SCALAR | UNION

            directive @federation__key(fields: federation__FieldSet!, resolvable: Boolean = true) repeatable on INTERFACE | OBJECT

            directive @federation__override(from: String!) on FIELD_DEFINITION

            directive @federation__provides(fields: federation__FieldSet!) on FIELD_DEFINITION

            directive @federation__requires(fields: federation__FieldSet!) on FIELD_DEFINITION

            directive @federation__tag(name: String!) repeatable on ARGUMENT_DEFINITION | ENUM | ENUM_VALUE | FIELD_DEFINITION | INPUT_FIELD_DEFINITION | INPUT_OBJECT | INTERFACE | OBJECT | SCALAR | UNION

            directive @link(as: String, for: link__Purpose, import: [link__Import], url: String) repeatable on SCHEMA

            directive @shareable on FIELD_DEFINITION | OBJECT

            type PageInfo @shareable {
              endCursor: String
              hasNextPage: Boolean
              hasPreviousPage: Boolean
              startCursor: String
            }

            type Post {
              author(where: PostAuthorOperationWhere): PostAuthorOperation
              content: String!
            }

            type PostAuthorConnection {
              edges: [PostAuthorEdge]
              pageInfo: PageInfo
            }

            input PostAuthorConnectionSort {
              edges: PostAuthorEdgeSort
            }

            type PostAuthorEdge {
              cursor: String
              node: User
            }

            input PostAuthorEdgeListWhere {
              AND: [PostAuthorEdgeListWhere!]
              NOT: PostAuthorEdgeListWhere
              OR: [PostAuthorEdgeListWhere!]
              all: PostAuthorEdgeWhere
              none: PostAuthorEdgeWhere
              single: PostAuthorEdgeWhere
              some: PostAuthorEdgeWhere
            }

            input PostAuthorEdgeSort {
              node: UserSort
            }

            input PostAuthorEdgeWhere {
              AND: [PostAuthorEdgeWhere!]
              NOT: PostAuthorEdgeWhere
              OR: [PostAuthorEdgeWhere!]
              node: UserWhere
            }

            input PostAuthorNestedOperationWhere {
              AND: [PostAuthorNestedOperationWhere!]
              NOT: PostAuthorNestedOperationWhere
              OR: [PostAuthorNestedOperationWhere!]
              edges: PostAuthorEdgeListWhere
            }

            type PostAuthorOperation {
              connection(after: String, first: Int, sort: [PostAuthorConnectionSort!]): PostAuthorConnection
            }

            input PostAuthorOperationWhere {
              AND: [PostAuthorOperationWhere!]
              NOT: PostAuthorOperationWhere
              OR: [PostAuthorOperationWhere!]
              edges: PostAuthorEdgeWhere
            }

            type PostConnection {
              edges: [PostEdge]
              pageInfo: PageInfo
            }

            input PostConnectionSort {
              node: PostSort
            }

            type PostEdge {
              cursor: String
              node: Post
            }

            type PostOperation {
              connection(after: String, first: Int, sort: [PostConnectionSort!]): PostConnection
            }

            input PostOperationWhere {
              AND: [PostOperationWhere!]
              NOT: PostOperationWhere
              OR: [PostOperationWhere!]
              node: PostWhere
            }

            input PostSort {
              content: SortDirection
            }

            input PostWhere {
              AND: [PostWhere!]
              NOT: PostWhere
              OR: [PostWhere!]
              author: PostAuthorNestedOperationWhere
              content: StringWhere
            }

            type Query {
              _service: _Service!
              posts(where: PostOperationWhere): PostOperation
              users(where: UserOperationWhere): UserOperation
            }

            enum SortDirection {
              ASC
              DESC
            }

            input StringWhere {
              AND: [StringWhere!]
              NOT: StringWhere
              OR: [StringWhere!]
              contains: String
              endsWith: String
              equals: String
              in: [String!]
              startsWith: String
            }

            type User @shareable {
              name: String!
              posts(where: UserPostsOperationWhere): UserPostsOperation
            }

            type UserConnection @shareable {
              edges: [UserEdge]
              pageInfo: PageInfo
            }

            input UserConnectionSort {
              node: UserSort
            }

            type UserEdge @shareable {
              cursor: String
              node: User
            }

            type UserOperation @shareable {
              connection(after: String, first: Int, sort: [UserConnectionSort!]): UserConnection
            }

            input UserOperationWhere {
              AND: [UserOperationWhere!]
              NOT: UserOperationWhere
              OR: [UserOperationWhere!]
              node: UserWhere
            }

            type UserPostsConnection {
              edges: [UserPostsEdge]
              pageInfo: PageInfo
            }

            input UserPostsConnectionSort {
              edges: UserPostsEdgeSort
            }

            type UserPostsEdge {
              cursor: String
              node: Post
            }

            input UserPostsEdgeListWhere {
              AND: [UserPostsEdgeListWhere!]
              NOT: UserPostsEdgeListWhere
              OR: [UserPostsEdgeListWhere!]
              all: UserPostsEdgeWhere
              none: UserPostsEdgeWhere
              single: UserPostsEdgeWhere
              some: UserPostsEdgeWhere
            }

            input UserPostsEdgeSort {
              node: PostSort
            }

            input UserPostsEdgeWhere {
              AND: [UserPostsEdgeWhere!]
              NOT: UserPostsEdgeWhere
              OR: [UserPostsEdgeWhere!]
              node: PostWhere
            }

            input UserPostsNestedOperationWhere {
              AND: [UserPostsNestedOperationWhere!]
              NOT: UserPostsNestedOperationWhere
              OR: [UserPostsNestedOperationWhere!]
              edges: UserPostsEdgeListWhere
            }

            type UserPostsOperation {
              connection(after: String, first: Int, sort: [UserPostsConnectionSort!]): UserPostsConnection
            }

            input UserPostsOperationWhere {
              AND: [UserPostsOperationWhere!]
              NOT: UserPostsOperationWhere
              OR: [UserPostsOperationWhere!]
              edges: UserPostsEdgeWhere
            }

            input UserSort {
              name: SortDirection
            }

            input UserWhere {
              AND: [UserWhere!]
              NOT: UserWhere
              OR: [UserWhere!]
              name: StringWhere
              posts: UserPostsNestedOperationWhere
            }

            scalar _Any

            type _Service {
              sdl: String
            }

            scalar federation__FieldSet

            scalar link__Import

            enum link__Purpose {
              \\"\\"\\"
              \`EXECUTION\` features provide metadata necessary for operation execution.
              \\"\\"\\"
              EXECUTION
              \\"\\"\\"
              \`SECURITY\` features provide metadata necessary to securely resolve fields.
              \\"\\"\\"
              SECURITY
            }"
        `);
    });

    test("@key(resolvable: false)", async () => {
        const typeDefs = gql`
            extend schema @link(url: "https://specs.apollo.dev/federation/v2.0", import: ["@key"])

            type User @key(fields: "name", resolvable: false) {
                name: String!
            }

            type Post {
                content: String!
                author: User! @relationship(type: "HAS_AUTHOR", direction: OUT)
            }
        `;

        // @ts-ignore
        const neoSchema = new Neo4jGraphQL({ typeDefs, driver: jest.fn() });

        const printedSchema = printSchemaWithDirectives(lexicographicSortSchema(await neoSchema.getSubgraphSchema()));

        expect(printedSchema).toMatchInlineSnapshot(`
            "schema @link(url: \\"https://specs.apollo.dev/link/v1.0\\") @link(url: \\"https://specs.apollo.dev/federation/v2.0\\", import: [\\"@key\\"]) {
              query: Query
              mutation: Mutation
            }

            directive @federation__extends on INTERFACE | OBJECT

            directive @federation__external(reason: String) on FIELD_DEFINITION | OBJECT

            directive @federation__inaccessible on ARGUMENT_DEFINITION | ENUM | ENUM_VALUE | FIELD_DEFINITION | INPUT_FIELD_DEFINITION | INPUT_OBJECT | INTERFACE | OBJECT | SCALAR | UNION

            directive @federation__override(from: String!) on FIELD_DEFINITION

            directive @federation__provides(fields: federation__FieldSet!) on FIELD_DEFINITION

            directive @federation__requires(fields: federation__FieldSet!) on FIELD_DEFINITION

            directive @federation__shareable on FIELD_DEFINITION | OBJECT

            directive @federation__tag(name: String!) repeatable on ARGUMENT_DEFINITION | ENUM | ENUM_VALUE | FIELD_DEFINITION | INPUT_FIELD_DEFINITION | INPUT_OBJECT | INTERFACE | OBJECT | SCALAR | UNION

            directive @key(fields: federation__FieldSet!, resolvable: Boolean = true) repeatable on INTERFACE | OBJECT

            directive @link(as: String, for: link__Purpose, import: [link__Import], url: String) repeatable on SCHEMA

            \\"\\"\\"
            Information about the number of nodes and relationships created during a create mutation
            \\"\\"\\"
            type CreateInfo @federation__shareable {
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

            \\"\\"\\"
            Information about the number of nodes and relationships deleted during a delete mutation
            \\"\\"\\"
            type DeleteInfo @federation__shareable {
              bookmark: String @deprecated(reason: \\"This field has been deprecated because bookmarks are now handled by the driver.\\")
              nodesDeleted: Int!
              relationshipsDeleted: Int!
            }

            type Mutation {
              createPosts(input: [PostCreateInput!]!): CreatePostsMutationResponse!
              createUsers(input: [UserCreateInput!]!): CreateUsersMutationResponse!
              deletePosts(delete: PostDeleteInput, where: PostWhere): DeleteInfo!
              deleteUsers(where: UserWhere): DeleteInfo!
              updatePosts(connect: PostConnectInput, create: PostRelationInput, delete: PostDeleteInput, disconnect: PostDisconnectInput, update: PostUpdateInput, where: PostWhere): UpdatePostsMutationResponse!
              updateUsers(update: UserUpdateInput, where: UserWhere): UpdateUsersMutationResponse!
            }

            \\"\\"\\"Pagination information (Relay)\\"\\"\\"
            type PageInfo @federation__shareable {
              endCursor: String
              hasNextPage: Boolean!
              hasPreviousPage: Boolean!
              startCursor: String
            }

            type Post {
              author: User!
              authorAggregate(directed: Boolean = true, where: UserWhere): PostUserAuthorAggregationSelection
              authorConnection(after: String, directed: Boolean = true, first: Int, sort: [PostAuthorConnectionSort!], where: PostAuthorConnectionWhere): PostAuthorConnection!
              content: String!
            }

            type PostAggregateSelection {
              content: StringAggregateSelection!
              count: Int!
            }

            input PostAuthorAggregateInput {
              AND: [PostAuthorAggregateInput!]
              NOT: PostAuthorAggregateInput
              OR: [PostAuthorAggregateInput!]
              count: Int
              count_GT: Int
              count_GTE: Int
              count_LT: Int
              count_LTE: Int
              node: PostAuthorNodeAggregationWhereInput
            }

            input PostAuthorConnectFieldInput {
              \\"\\"\\"
              Whether or not to overwrite any matching relationship with the new properties.
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
              where: PostAuthorConnectionWhere
            }

            input PostAuthorDisconnectFieldInput {
              where: PostAuthorConnectionWhere
            }

            input PostAuthorFieldInput {
              connect: PostAuthorConnectFieldInput
              create: PostAuthorCreateFieldInput
            }

            input PostAuthorNodeAggregationWhereInput {
              AND: [PostAuthorNodeAggregationWhereInput!]
              NOT: PostAuthorNodeAggregationWhereInput
              OR: [PostAuthorNodeAggregationWhereInput!]
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
              content: String!
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
              content: SortDirection
            }

            input PostUpdateInput {
              author: PostAuthorUpdateFieldInput
              content: String
            }

            type PostUserAuthorAggregationSelection {
              count: Int!
              node: PostUserAuthorNodeAggregateSelection
            }

            type PostUserAuthorNodeAggregateSelection {
              name: StringAggregateSelection!
            }

            input PostWhere {
              AND: [PostWhere!]
              NOT: PostWhere
              OR: [PostWhere!]
              author: UserWhere
              authorAggregate: PostAuthorAggregateInput
              authorConnection: PostAuthorConnectionWhere
              authorConnection_NOT: PostAuthorConnectionWhere
              author_NOT: UserWhere
              content: String
              content_CONTAINS: String
              content_ENDS_WITH: String
              content_IN: [String!]
              content_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              content_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              content_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              content_NOT_IN: [String!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              content_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              content_STARTS_WITH: String
            }

            type PostsConnection {
              edges: [PostEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            type Query {
              _entities(representations: [_Any!]!): [_Entity]!
              _service: _Service!
              posts(options: PostOptions, where: PostWhere): [Post!]!
              postsAggregate(where: PostWhere): PostAggregateSelection!
              postsConnection(after: String, first: Int, sort: [PostSort], where: PostWhere): PostsConnection!
              users(options: UserOptions, where: UserWhere): [User!]!
              usersAggregate(where: UserWhere): UserAggregateSelection!
              usersConnection(after: String, first: Int, sort: [UserSort], where: UserWhere): UsersConnection!
            }

            \\"\\"\\"An enum for sorting in either ascending or descending order.\\"\\"\\"
            enum SortDirection {
              \\"\\"\\"Sort by field values in ascending order.\\"\\"\\"
              ASC
              \\"\\"\\"Sort by field values in descending order.\\"\\"\\"
              DESC
            }

            type StringAggregateSelection @federation__shareable {
              longest: String
              shortest: String
            }

            \\"\\"\\"
            Information about the number of nodes and relationships created and deleted during an update mutation
            \\"\\"\\"
            type UpdateInfo @federation__shareable {
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

            type User @key(fields: \\"name\\", resolvable: false) {
              name: String!
            }

            type UserAggregateSelection {
              count: Int!
              name: StringAggregateSelection!
            }

            input UserConnectWhere {
              node: UserWhere!
            }

            input UserCreateInput {
              name: String!
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

            \\"\\"\\"
            Fields to sort Users by. The order in which sorts are applied is not guaranteed when specifying many fields in one UserSort object.
            \\"\\"\\"
            input UserSort {
              name: SortDirection
            }

            input UserUpdateInput {
              name: String
            }

            input UserWhere {
              AND: [UserWhere!]
              NOT: UserWhere
              OR: [UserWhere!]
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

            type UsersConnection {
              edges: [UserEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            scalar _Any

            union _Entity = User

            type _Service {
              sdl: String
            }

            scalar federation__FieldSet

            scalar link__Import

            enum link__Purpose {
              \\"\\"\\"
              \`EXECUTION\` features provide metadata necessary for operation execution.
              \\"\\"\\"
              EXECUTION
              \\"\\"\\"
              \`SECURITY\` features provide metadata necessary to securely resolve fields.
              \\"\\"\\"
              SECURITY
            }"
        `);
    });
});
