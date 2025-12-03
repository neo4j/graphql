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

describe("Apollo Federation", () => {
    test("@shareable", async () => {
        const typeDefs = gql`
            extend schema @link(url: "https://specs.apollo.dev/federation/v2.0", import: ["@shareable"])

            type User @shareable @node {
                name: String!
                posts: [Post!]! @relationship(type: "HAS_AUTHOR", direction: IN)
            }

            type Post @node {
                content: String!
                author: [User!]! @relationship(type: "HAS_AUTHOR", direction: OUT)
            }
        `;

        // @ts-ignore
        const neoSchema = new Neo4jGraphQL({ typeDefs, driver: jest.fn() });

        const printedSchema = printSchemaWithDirectives(lexicographicSortSchema(await neoSchema.getSubgraphSchema()));

        expect(printedSchema).toMatchInlineSnapshot(`
            "schema @link(url: \\"https://specs.apollo.dev/link/v1.0\\") @link(url: \\"https://specs.apollo.dev/federation/v2.0\\", import: [\\"@shareable\\"]) {
              query: Query
              mutation: Mutation
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

            input ConnectionAggregationCountFilterInput {
              edges: IntScalarFilters
              nodes: IntScalarFilters
            }

            type Count @shareable {
              nodes: Int!
            }

            type CountConnection @shareable {
              edges: Int!
              nodes: Int!
            }

            \\"\\"\\"
            Information about the number of nodes and relationships created during a create mutation
            \\"\\"\\"
            type CreateInfo @shareable {
              nodesCreated: Int!
              relationshipsCreated: Int!
            }

            type CreatePostsMutationResponse {
              info: CreateInfo!
              posts: [Post!]!
            }

            type CreateUsersMutationResponse @shareable {
              info: CreateInfo!
              users: [User!]!
            }

            \\"\\"\\"
            Information about the number of nodes and relationships deleted during a delete mutation
            \\"\\"\\"
            type DeleteInfo @shareable {
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
              createUsers(input: [UserCreateInput!]!): CreateUsersMutationResponse! @shareable
              deletePosts(delete: PostDeleteInput, where: PostWhere): DeleteInfo!
              deleteUsers(delete: UserDeleteInput, where: UserWhere): DeleteInfo! @shareable
              updatePosts(update: PostUpdateInput, where: PostWhere): UpdatePostsMutationResponse!
              updateUsers(update: UserUpdateInput, where: UserWhere): UpdateUsersMutationResponse! @shareable
            }

            \\"\\"\\"Pagination information (Relay)\\"\\"\\"
            type PageInfo @shareable {
              endCursor: String
              hasNextPage: Boolean!
              hasPreviousPage: Boolean!
              startCursor: String
            }

            type Post {
              author(limit: Int, offset: Int, sort: [UserSort!], where: UserWhere): [User!]!
              authorConnection(after: String, first: Int, sort: [PostAuthorConnectionSort!], where: PostAuthorConnectionWhere): PostAuthorConnection!
              content: String!
            }

            type PostAggregate {
              count: Count!
              node: PostAggregateNode!
            }

            type PostAggregateNode {
              content: StringAggregateSelection!
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

            input PostConnectInput {
              author: [PostAuthorConnectFieldInput!]
            }

            input PostConnectWhere {
              node: PostWhere!
            }

            input PostCreateInput {
              author: PostAuthorFieldInput
              content: String!
            }

            input PostDeleteInput {
              author: [PostAuthorDeleteFieldInput!]
            }

            input PostDisconnectInput {
              author: [PostAuthorDisconnectFieldInput!]
            }

            type PostEdge {
              cursor: String!
              node: Post!
            }

            input PostRelationshipFilters {
              \\"\\"\\"Filter type where all of the related Posts match this filter\\"\\"\\"
              all: PostWhere
              \\"\\"\\"Filter type where none of the related Posts match this filter\\"\\"\\"
              none: PostWhere
              \\"\\"\\"Filter type where one of the related Posts match this filter\\"\\"\\"
              single: PostWhere
              \\"\\"\\"Filter type where some of the related Posts match this filter\\"\\"\\"
              some: PostWhere
            }

            \\"\\"\\"
            Fields to sort Posts by. The order in which sorts are applied is not guaranteed when specifying many fields in one PostSort object.
            \\"\\"\\"
            input PostSort {
              content: SortDirection
            }

            input PostUpdateInput {
              author: [PostAuthorUpdateFieldInput!]
              content: StringScalarMutations
              content_SET: String @deprecated(reason: \\"Please use the generic mutation 'content: { set: ... } }' instead.\\")
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
              content: StringScalarFilters
              content_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter content: { contains: ... }\\")
              content_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter content: { endsWith: ... }\\")
              content_EQ: String @deprecated(reason: \\"Please use the relevant generic filter content: { eq: ... }\\")
              content_IN: [String!] @deprecated(reason: \\"Please use the relevant generic filter content: { in: ... }\\")
              content_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter content: { startsWith: ... }\\")
            }

            type PostsConnection {
              aggregate: PostAggregate!
              edges: [PostEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            type Query {
              _service: _Service!
              posts(limit: Int, offset: Int, sort: [PostSort!], where: PostWhere): [Post!]!
              postsConnection(after: String, first: Int, sort: [PostSort!], where: PostWhere): PostsConnection!
              users(limit: Int, offset: Int, sort: [UserSort!], where: UserWhere): [User!]! @shareable
              usersConnection(after: String, first: Int, sort: [UserSort!], where: UserWhere): UsersConnection! @shareable
            }

            \\"\\"\\"An enum for sorting in either ascending or descending order.\\"\\"\\"
            enum SortDirection {
              \\"\\"\\"Sort by field values in ascending order.\\"\\"\\"
              ASC
              \\"\\"\\"Sort by field values in descending order.\\"\\"\\"
              DESC
            }

            type StringAggregateSelection @shareable {
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
            type UpdateInfo @shareable {
              nodesCreated: Int!
              nodesDeleted: Int!
              relationshipsCreated: Int!
              relationshipsDeleted: Int!
            }

            type UpdatePostsMutationResponse {
              info: UpdateInfo!
              posts: [Post!]!
            }

            type UpdateUsersMutationResponse @shareable {
              info: UpdateInfo!
              users: [User!]!
            }

            type User @shareable {
              name: String!
              posts(limit: Int, offset: Int, sort: [PostSort!], where: PostWhere): [Post!]!
              postsConnection(after: String, first: Int, sort: [UserPostsConnectionSort!], where: UserPostsConnectionWhere): UserPostsConnection!
            }

            type UserAggregate @shareable {
              count: Count!
              node: UserAggregateNode!
            }

            type UserAggregateNode @shareable {
              name: StringAggregateSelection!
            }

            input UserConnectInput {
              posts: [UserPostsConnectFieldInput!]
            }

            input UserConnectWhere {
              node: UserWhere!
            }

            input UserCreateInput {
              name: String!
              posts: UserPostsFieldInput
            }

            input UserDeleteInput {
              posts: [UserPostsDeleteFieldInput!]
            }

            input UserDisconnectInput {
              posts: [UserPostsDisconnectFieldInput!]
            }

            type UserEdge @shareable {
              cursor: String!
              node: User!
            }

            type UserPostPostsAggregateSelection {
              count: CountConnection!
              node: UserPostPostsNodeAggregateSelection
            }

            type UserPostPostsNodeAggregateSelection {
              content: StringAggregateSelection!
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
              connect: [PostConnectInput!]
              where: PostConnectWhere
            }

            type UserPostsConnection {
              aggregate: UserPostPostsAggregateSelection!
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
              node: PostSort
            }

            input UserPostsConnectionWhere {
              AND: [UserPostsConnectionWhere!]
              NOT: UserPostsConnectionWhere
              OR: [UserPostsConnectionWhere!]
              node: PostWhere
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
              NOT: UserPostsNodeAggregationWhereInput
              OR: [UserPostsNodeAggregationWhereInput!]
              content: StringScalarAggregationFilters
              content_AVERAGE_LENGTH_EQUAL: Float @deprecated(reason: \\"Please use the relevant generic filter 'content: { averageLength: { eq: ... } } }' instead.\\")
              content_AVERAGE_LENGTH_GT: Float @deprecated(reason: \\"Please use the relevant generic filter 'content: { averageLength: { gt: ... } } }' instead.\\")
              content_AVERAGE_LENGTH_GTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'content: { averageLength: { gte: ... } } }' instead.\\")
              content_AVERAGE_LENGTH_LT: Float @deprecated(reason: \\"Please use the relevant generic filter 'content: { averageLength: { lt: ... } } }' instead.\\")
              content_AVERAGE_LENGTH_LTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'content: { averageLength: { lte: ... } } }' instead.\\")
              content_LONGEST_LENGTH_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'content: { longestLength: { eq: ... } } }' instead.\\")
              content_LONGEST_LENGTH_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'content: { longestLength: { gt: ... } } }' instead.\\")
              content_LONGEST_LENGTH_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'content: { longestLength: { gte: ... } } }' instead.\\")
              content_LONGEST_LENGTH_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'content: { longestLength: { lt: ... } } }' instead.\\")
              content_LONGEST_LENGTH_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'content: { longestLength: { lte: ... } } }' instead.\\")
              content_SHORTEST_LENGTH_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'content: { shortestLength: { eq: ... } } }' instead.\\")
              content_SHORTEST_LENGTH_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'content: { shortestLength: { gt: ... } } }' instead.\\")
              content_SHORTEST_LENGTH_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'content: { shortestLength: { gte: ... } } }' instead.\\")
              content_SHORTEST_LENGTH_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'content: { shortestLength: { lt: ... } } }' instead.\\")
              content_SHORTEST_LENGTH_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'content: { shortestLength: { lte: ... } } }' instead.\\")
            }

            type UserPostsRelationship {
              cursor: String!
              node: Post!
            }

            input UserPostsUpdateConnectionInput {
              node: PostUpdateInput
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
              name: SortDirection
            }

            input UserUpdateInput {
              name: StringScalarMutations
              name_SET: String @deprecated(reason: \\"Please use the generic mutation 'name: { set: ... } }' instead.\\")
              posts: [UserPostsUpdateFieldInput!]
            }

            input UserWhere {
              AND: [UserWhere!]
              NOT: UserWhere
              OR: [UserWhere!]
              name: StringScalarFilters
              name_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter name: { contains: ... }\\")
              name_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter name: { endsWith: ... }\\")
              name_EQ: String @deprecated(reason: \\"Please use the relevant generic filter name: { eq: ... }\\")
              name_IN: [String!] @deprecated(reason: \\"Please use the relevant generic filter name: { in: ... }\\")
              name_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter name: { startsWith: ... }\\")
              posts: PostRelationshipFilters
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
              \\"\\"\\"Return Users where all of the related Posts match this filter\\"\\"\\"
              posts_ALL: PostWhere @deprecated(reason: \\"Please use the relevant generic filter 'posts: { all: ... }' instead.\\")
              \\"\\"\\"Return Users where none of the related Posts match this filter\\"\\"\\"
              posts_NONE: PostWhere @deprecated(reason: \\"Please use the relevant generic filter 'posts: { none: ... }' instead.\\")
              \\"\\"\\"Return Users where one of the related Posts match this filter\\"\\"\\"
              posts_SINGLE: PostWhere @deprecated(reason: \\"Please use the relevant generic filter 'posts: {  single: ... }' instead.\\")
              \\"\\"\\"Return Users where some of the related Posts match this filter\\"\\"\\"
              posts_SOME: PostWhere @deprecated(reason: \\"Please use the relevant generic filter 'posts: {  some: ... }' instead.\\")
            }

            type UsersConnection @shareable {
              aggregate: UserAggregate!
              edges: [UserEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
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

            type User @key(fields: "name", resolvable: false) @node {
                name: String!
            }

            type Post @node {
                content: String!
                author: [User!]! @relationship(type: "HAS_AUTHOR", direction: OUT)
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

            input ConnectionAggregationCountFilterInput {
              edges: IntScalarFilters
              nodes: IntScalarFilters
            }

            type Count @federation__shareable {
              nodes: Int!
            }

            type CountConnection @federation__shareable {
              edges: Int!
              nodes: Int!
            }

            \\"\\"\\"
            Information about the number of nodes and relationships created during a create mutation
            \\"\\"\\"
            type CreateInfo @federation__shareable {
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
              deleteUsers(where: UserWhere): DeleteInfo!
              updatePosts(update: PostUpdateInput, where: PostWhere): UpdatePostsMutationResponse!
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
              author(limit: Int, offset: Int, sort: [UserSort!], where: UserWhere): [User!]!
              authorConnection(after: String, first: Int, sort: [PostAuthorConnectionSort!], where: PostAuthorConnectionWhere): PostAuthorConnection!
              content: String!
            }

            type PostAggregate {
              count: Count!
              node: PostAggregateNode!
            }

            type PostAggregateNode {
              content: StringAggregateSelection!
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
              where: PostAuthorConnectionWhere
            }

            input PostAuthorDisconnectFieldInput {
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
              content: String!
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
              content: SortDirection
            }

            input PostUpdateInput {
              author: [PostAuthorUpdateFieldInput!]
              content: StringScalarMutations
              content_SET: String @deprecated(reason: \\"Please use the generic mutation 'content: { set: ... } }' instead.\\")
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
              content: StringScalarFilters
              content_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter content: { contains: ... }\\")
              content_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter content: { endsWith: ... }\\")
              content_EQ: String @deprecated(reason: \\"Please use the relevant generic filter content: { eq: ... }\\")
              content_IN: [String!] @deprecated(reason: \\"Please use the relevant generic filter content: { in: ... }\\")
              content_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter content: { startsWith: ... }\\")
            }

            type PostsConnection {
              aggregate: PostAggregate!
              edges: [PostEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            type Query {
              _entities(representations: [_Any!]!): [_Entity]!
              _service: _Service!
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

            type StringAggregateSelection @federation__shareable {
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
            type UpdateInfo @federation__shareable {
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

            type UserAggregate {
              count: Count!
              node: UserAggregateNode!
            }

            type UserAggregateNode {
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
              name: SortDirection
            }

            input UserUpdateInput {
              name: StringScalarMutations
              name_SET: String @deprecated(reason: \\"Please use the generic mutation 'name: { set: ... } }' instead.\\")
            }

            input UserWhere {
              AND: [UserWhere!]
              NOT: UserWhere
              OR: [UserWhere!]
              name: StringScalarFilters
              name_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter name: { contains: ... }\\")
              name_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter name: { endsWith: ... }\\")
              name_EQ: String @deprecated(reason: \\"Please use the relevant generic filter name: { eq: ... }\\")
              name_IN: [String!] @deprecated(reason: \\"Please use the relevant generic filter name: { in: ... }\\")
              name_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter name: { startsWith: ... }\\")
            }

            type UsersConnection {
              aggregate: UserAggregate!
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
