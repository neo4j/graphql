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
import { Neo4jGraphQL } from "../../../src";

describe("Aggregations filters outside connection filters", () => {
    test("should remove deprecated aggregate filters", async () => {
        const typeDefs = /* GraphQL */ `
            type User @node {
                someID: Int
                someString: String
            }

            type Post @node {
                title: String
                likes: [User!]! @relationship(type: "LIKES", direction: IN, properties: "Likes")
            }

            type Likes @relationshipProperties {
                someID: ID
                someString: String
            }
        `;
        const neoSchema = new Neo4jGraphQL({
            typeDefs,
            features: { excludeDeprecatedFields: { aggregationFiltersOutsideConnection: true } },
        });
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

            type IntAggregateSelection {
              average: Float
              max: Int
              min: Int
              sum: Int
            }

            \\"\\"\\"Filters for an aggregation of an int field\\"\\"\\"
            input IntScalarAggregationFilters {
              average: FloatScalarFilters
              max: IntScalarFilters
              min: IntScalarFilters
              sum: IntScalarFilters
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

            \\"\\"\\"Int mutations\\"\\"\\"
            input IntScalarMutations {
              add: Int
              set: Int
              subtract: Int
            }

            \\"\\"\\"
            The edge properties for the following fields:
            * Post.likes
            \\"\\"\\"
            type Likes {
              someID: ID
              someString: String
            }

            input LikesAggregationWhereInput {
              AND: [LikesAggregationWhereInput!]
              NOT: LikesAggregationWhereInput
              OR: [LikesAggregationWhereInput!]
              someString: StringScalarAggregationFilters
              someString_AVERAGE_LENGTH_EQUAL: Float @deprecated(reason: \\"Please use the relevant generic filter 'someString: { averageLength: { eq: ... } } }' instead.\\")
              someString_AVERAGE_LENGTH_GT: Float @deprecated(reason: \\"Please use the relevant generic filter 'someString: { averageLength: { gt: ... } } }' instead.\\")
              someString_AVERAGE_LENGTH_GTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'someString: { averageLength: { gte: ... } } }' instead.\\")
              someString_AVERAGE_LENGTH_LT: Float @deprecated(reason: \\"Please use the relevant generic filter 'someString: { averageLength: { lt: ... } } }' instead.\\")
              someString_AVERAGE_LENGTH_LTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'someString: { averageLength: { lte: ... } } }' instead.\\")
              someString_LONGEST_LENGTH_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'someString: { longestLength: { eq: ... } } }' instead.\\")
              someString_LONGEST_LENGTH_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'someString: { longestLength: { gt: ... } } }' instead.\\")
              someString_LONGEST_LENGTH_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'someString: { longestLength: { gte: ... } } }' instead.\\")
              someString_LONGEST_LENGTH_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'someString: { longestLength: { lt: ... } } }' instead.\\")
              someString_LONGEST_LENGTH_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'someString: { longestLength: { lte: ... } } }' instead.\\")
              someString_SHORTEST_LENGTH_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'someString: { shortestLength: { eq: ... } } }' instead.\\")
              someString_SHORTEST_LENGTH_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'someString: { shortestLength: { gt: ... } } }' instead.\\")
              someString_SHORTEST_LENGTH_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'someString: { shortestLength: { gte: ... } } }' instead.\\")
              someString_SHORTEST_LENGTH_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'someString: { shortestLength: { lt: ... } } }' instead.\\")
              someString_SHORTEST_LENGTH_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'someString: { shortestLength: { lte: ... } } }' instead.\\")
            }

            input LikesCreateInput {
              someID: ID
              someString: String
            }

            input LikesSort {
              someID: SortDirection
              someString: SortDirection
            }

            input LikesUpdateInput {
              someID: IDScalarMutations
              someID_SET: ID @deprecated(reason: \\"Please use the generic mutation 'someID: { set: ... } }' instead.\\")
              someString: StringScalarMutations
              someString_SET: String @deprecated(reason: \\"Please use the generic mutation 'someString: { set: ... } }' instead.\\")
            }

            input LikesWhere {
              AND: [LikesWhere!]
              NOT: LikesWhere
              OR: [LikesWhere!]
              someID: IDScalarFilters
              someID_CONTAINS: ID @deprecated(reason: \\"Please use the relevant generic filter someID: { contains: ... }\\")
              someID_ENDS_WITH: ID @deprecated(reason: \\"Please use the relevant generic filter someID: { endsWith: ... }\\")
              someID_EQ: ID @deprecated(reason: \\"Please use the relevant generic filter someID: { eq: ... }\\")
              someID_IN: [ID] @deprecated(reason: \\"Please use the relevant generic filter someID: { in: ... }\\")
              someID_STARTS_WITH: ID @deprecated(reason: \\"Please use the relevant generic filter someID: { startsWith: ... }\\")
              someString: StringScalarFilters
              someString_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter someString: { contains: ... }\\")
              someString_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter someString: { endsWith: ... }\\")
              someString_EQ: String @deprecated(reason: \\"Please use the relevant generic filter someString: { eq: ... }\\")
              someString_IN: [String] @deprecated(reason: \\"Please use the relevant generic filter someString: { in: ... }\\")
              someString_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter someString: { startsWith: ... }\\")
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
            type PageInfo {
              endCursor: String
              hasNextPage: Boolean!
              hasPreviousPage: Boolean!
              startCursor: String
            }

            type Post {
              likes(limit: Int, offset: Int, sort: [UserSort!], where: UserWhere): [User!]!
              likesConnection(after: String, first: Int, sort: [PostLikesConnectionSort!], where: PostLikesConnectionWhere): PostLikesConnection!
              title: String
            }

            type PostAggregate {
              count: Count!
              node: PostAggregateNode!
            }

            type PostAggregateNode {
              title: StringAggregateSelection!
            }

            input PostCreateInput {
              likes: PostLikesFieldInput
              title: String
            }

            input PostDeleteInput {
              likes: [PostLikesDeleteFieldInput!]
            }

            type PostEdge {
              cursor: String!
              node: Post!
            }

            input PostLikesConnectFieldInput {
              edge: LikesCreateInput
              where: UserConnectWhere
            }

            type PostLikesConnection {
              aggregate: PostUserLikesAggregateSelection!
              edges: [PostLikesRelationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input PostLikesConnectionAggregateInput {
              AND: [PostLikesConnectionAggregateInput!]
              NOT: PostLikesConnectionAggregateInput
              OR: [PostLikesConnectionAggregateInput!]
              count: ConnectionAggregationCountFilterInput
              edge: LikesAggregationWhereInput
              node: PostLikesNodeAggregationWhereInput
            }

            input PostLikesConnectionFilters {
              \\"\\"\\"Filter Posts by aggregating results on related PostLikesConnections\\"\\"\\"
              aggregate: PostLikesConnectionAggregateInput
              \\"\\"\\"
              Return Posts where all of the related PostLikesConnections match this filter
              \\"\\"\\"
              all: PostLikesConnectionWhere
              \\"\\"\\"
              Return Posts where none of the related PostLikesConnections match this filter
              \\"\\"\\"
              none: PostLikesConnectionWhere
              \\"\\"\\"
              Return Posts where one of the related PostLikesConnections match this filter
              \\"\\"\\"
              single: PostLikesConnectionWhere
              \\"\\"\\"
              Return Posts where some of the related PostLikesConnections match this filter
              \\"\\"\\"
              some: PostLikesConnectionWhere
            }

            input PostLikesConnectionSort {
              edge: LikesSort
              node: UserSort
            }

            input PostLikesConnectionWhere {
              AND: [PostLikesConnectionWhere!]
              NOT: PostLikesConnectionWhere
              OR: [PostLikesConnectionWhere!]
              edge: LikesWhere
              node: UserWhere
            }

            input PostLikesCreateFieldInput {
              edge: LikesCreateInput
              node: UserCreateInput!
            }

            input PostLikesDeleteFieldInput {
              where: PostLikesConnectionWhere
            }

            input PostLikesDisconnectFieldInput {
              where: PostLikesConnectionWhere
            }

            input PostLikesFieldInput {
              connect: [PostLikesConnectFieldInput!]
              create: [PostLikesCreateFieldInput!]
            }

            input PostLikesNodeAggregationWhereInput {
              AND: [PostLikesNodeAggregationWhereInput!]
              NOT: PostLikesNodeAggregationWhereInput
              OR: [PostLikesNodeAggregationWhereInput!]
              someID: IntScalarAggregationFilters
              someID_AVERAGE_EQUAL: Float @deprecated(reason: \\"Please use the relevant generic filter 'someID: { average: { eq: ... } } }' instead.\\")
              someID_AVERAGE_GT: Float @deprecated(reason: \\"Please use the relevant generic filter 'someID: { average: { gt: ... } } }' instead.\\")
              someID_AVERAGE_GTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'someID: { average: { gte: ... } } }' instead.\\")
              someID_AVERAGE_LT: Float @deprecated(reason: \\"Please use the relevant generic filter 'someID: { average: { lt: ... } } }' instead.\\")
              someID_AVERAGE_LTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'someID: { average: { lte: ... } } }' instead.\\")
              someID_MAX_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'someID: { max: { eq: ... } } }' instead.\\")
              someID_MAX_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'someID: { max: { gt: ... } } }' instead.\\")
              someID_MAX_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'someID: { max: { gte: ... } } }' instead.\\")
              someID_MAX_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'someID: { max: { lt: ... } } }' instead.\\")
              someID_MAX_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'someID: { max: { lte: ... } } }' instead.\\")
              someID_MIN_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'someID: { min: { eq: ... } } }' instead.\\")
              someID_MIN_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'someID: { min: { gt: ... } } }' instead.\\")
              someID_MIN_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'someID: { min: { gte: ... } } }' instead.\\")
              someID_MIN_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'someID: { min: { lt: ... } } }' instead.\\")
              someID_MIN_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'someID: { min: { lte: ... } } }' instead.\\")
              someID_SUM_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'someID: { sum: { eq: ... } } }' instead.\\")
              someID_SUM_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'someID: { sum: { gt: ... } } }' instead.\\")
              someID_SUM_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'someID: { sum: { gte: ... } } }' instead.\\")
              someID_SUM_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'someID: { sum: { lt: ... } } }' instead.\\")
              someID_SUM_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'someID: { sum: { lte: ... } } }' instead.\\")
              someString: StringScalarAggregationFilters
              someString_AVERAGE_LENGTH_EQUAL: Float @deprecated(reason: \\"Please use the relevant generic filter 'someString: { averageLength: { eq: ... } } }' instead.\\")
              someString_AVERAGE_LENGTH_GT: Float @deprecated(reason: \\"Please use the relevant generic filter 'someString: { averageLength: { gt: ... } } }' instead.\\")
              someString_AVERAGE_LENGTH_GTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'someString: { averageLength: { gte: ... } } }' instead.\\")
              someString_AVERAGE_LENGTH_LT: Float @deprecated(reason: \\"Please use the relevant generic filter 'someString: { averageLength: { lt: ... } } }' instead.\\")
              someString_AVERAGE_LENGTH_LTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'someString: { averageLength: { lte: ... } } }' instead.\\")
              someString_LONGEST_LENGTH_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'someString: { longestLength: { eq: ... } } }' instead.\\")
              someString_LONGEST_LENGTH_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'someString: { longestLength: { gt: ... } } }' instead.\\")
              someString_LONGEST_LENGTH_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'someString: { longestLength: { gte: ... } } }' instead.\\")
              someString_LONGEST_LENGTH_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'someString: { longestLength: { lt: ... } } }' instead.\\")
              someString_LONGEST_LENGTH_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'someString: { longestLength: { lte: ... } } }' instead.\\")
              someString_SHORTEST_LENGTH_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'someString: { shortestLength: { eq: ... } } }' instead.\\")
              someString_SHORTEST_LENGTH_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'someString: { shortestLength: { gt: ... } } }' instead.\\")
              someString_SHORTEST_LENGTH_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'someString: { shortestLength: { gte: ... } } }' instead.\\")
              someString_SHORTEST_LENGTH_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'someString: { shortestLength: { lt: ... } } }' instead.\\")
              someString_SHORTEST_LENGTH_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'someString: { shortestLength: { lte: ... } } }' instead.\\")
            }

            type PostLikesRelationship {
              cursor: String!
              node: User!
              properties: Likes!
            }

            input PostLikesUpdateConnectionInput {
              edge: LikesUpdateInput
              node: UserUpdateInput
              where: PostLikesConnectionWhere
            }

            input PostLikesUpdateFieldInput {
              connect: [PostLikesConnectFieldInput!]
              create: [PostLikesCreateFieldInput!]
              delete: [PostLikesDeleteFieldInput!]
              disconnect: [PostLikesDisconnectFieldInput!]
              update: PostLikesUpdateConnectionInput
            }

            \\"\\"\\"
            Fields to sort Posts by. The order in which sorts are applied is not guaranteed when specifying many fields in one PostSort object.
            \\"\\"\\"
            input PostSort {
              title: SortDirection
            }

            input PostUpdateInput {
              likes: [PostLikesUpdateFieldInput!]
              title: StringScalarMutations
              title_SET: String @deprecated(reason: \\"Please use the generic mutation 'title: { set: ... } }' instead.\\")
            }

            type PostUserLikesAggregateSelection {
              count: CountConnection!
              edge: PostUserLikesEdgeAggregateSelection
              node: PostUserLikesNodeAggregateSelection
            }

            type PostUserLikesEdgeAggregateSelection {
              someString: StringAggregateSelection!
            }

            type PostUserLikesNodeAggregateSelection {
              someID: IntAggregateSelection!
              someString: StringAggregateSelection!
            }

            input PostWhere {
              AND: [PostWhere!]
              NOT: PostWhere
              OR: [PostWhere!]
              likes: UserRelationshipFilters
              likesConnection: PostLikesConnectionFilters
              \\"\\"\\"
              Return Posts where all of the related PostLikesConnections match this filter
              \\"\\"\\"
              likesConnection_ALL: PostLikesConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'likesConnection: { all: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Posts where none of the related PostLikesConnections match this filter
              \\"\\"\\"
              likesConnection_NONE: PostLikesConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'likesConnection: { none: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Posts where one of the related PostLikesConnections match this filter
              \\"\\"\\"
              likesConnection_SINGLE: PostLikesConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'likesConnection: { single: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Posts where some of the related PostLikesConnections match this filter
              \\"\\"\\"
              likesConnection_SOME: PostLikesConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'likesConnection: { some: { node: ... } } }' instead.\\")
              \\"\\"\\"Return Posts where all of the related Users match this filter\\"\\"\\"
              likes_ALL: UserWhere @deprecated(reason: \\"Please use the relevant generic filter 'likes: { all: ... }' instead.\\")
              \\"\\"\\"Return Posts where none of the related Users match this filter\\"\\"\\"
              likes_NONE: UserWhere @deprecated(reason: \\"Please use the relevant generic filter 'likes: { none: ... }' instead.\\")
              \\"\\"\\"Return Posts where one of the related Users match this filter\\"\\"\\"
              likes_SINGLE: UserWhere @deprecated(reason: \\"Please use the relevant generic filter 'likes: {  single: ... }' instead.\\")
              \\"\\"\\"Return Posts where some of the related Users match this filter\\"\\"\\"
              likes_SOME: UserWhere @deprecated(reason: \\"Please use the relevant generic filter 'likes: {  some: ... }' instead.\\")
              title: StringScalarFilters
              title_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter title: { contains: ... }\\")
              title_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter title: { endsWith: ... }\\")
              title_EQ: String @deprecated(reason: \\"Please use the relevant generic filter title: { eq: ... }\\")
              title_IN: [String] @deprecated(reason: \\"Please use the relevant generic filter title: { in: ... }\\")
              title_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter title: { startsWith: ... }\\")
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
              someID: Int
              someString: String
            }

            type UserAggregate {
              count: Count!
              node: UserAggregateNode!
            }

            type UserAggregateNode {
              someID: IntAggregateSelection!
              someString: StringAggregateSelection!
            }

            input UserConnectWhere {
              node: UserWhere!
            }

            input UserCreateInput {
              someID: Int
              someString: String
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
              someID: SortDirection
              someString: SortDirection
            }

            input UserUpdateInput {
              someID: IntScalarMutations
              someID_DECREMENT: Int @deprecated(reason: \\"Please use the relevant generic mutation 'someID: { decrement: ... } }' instead.\\")
              someID_INCREMENT: Int @deprecated(reason: \\"Please use the relevant generic mutation 'someID: { increment: ... } }' instead.\\")
              someID_SET: Int @deprecated(reason: \\"Please use the generic mutation 'someID: { set: ... } }' instead.\\")
              someString: StringScalarMutations
              someString_SET: String @deprecated(reason: \\"Please use the generic mutation 'someString: { set: ... } }' instead.\\")
            }

            input UserWhere {
              AND: [UserWhere!]
              NOT: UserWhere
              OR: [UserWhere!]
              someID: IntScalarFilters
              someID_EQ: Int @deprecated(reason: \\"Please use the relevant generic filter someID: { eq: ... }\\")
              someID_GT: Int @deprecated(reason: \\"Please use the relevant generic filter someID: { gt: ... }\\")
              someID_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter someID: { gte: ... }\\")
              someID_IN: [Int] @deprecated(reason: \\"Please use the relevant generic filter someID: { in: ... }\\")
              someID_LT: Int @deprecated(reason: \\"Please use the relevant generic filter someID: { lt: ... }\\")
              someID_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter someID: { lte: ... }\\")
              someString: StringScalarFilters
              someString_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter someString: { contains: ... }\\")
              someString_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter someString: { endsWith: ... }\\")
              someString_EQ: String @deprecated(reason: \\"Please use the relevant generic filter someString: { eq: ... }\\")
              someString_IN: [String] @deprecated(reason: \\"Please use the relevant generic filter someString: { in: ... }\\")
              someString_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter someString: { startsWith: ... }\\")
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
