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

describe("Pluralize consistency", () => {
    test("Schema with underscore types", async () => {
        const typeDefs = gql`
            type super_user @node {
                name: String!
                my_friend: [super_friend!]! @relationship(type: "FRIEND", direction: OUT)
            }

            type super_friend @node {
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

            type CreateSuperFriendsMutationResponse {
              info: CreateInfo!
              superFriends: [super_friend!]!
            }

            type CreateSuperUsersMutationResponse {
              info: CreateInfo!
              superUsers: [super_user!]!
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
              createSuperFriends(input: [super_friendCreateInput!]!): CreateSuperFriendsMutationResponse!
              createSuperUsers(input: [super_userCreateInput!]!): CreateSuperUsersMutationResponse!
              deleteSuperFriends(where: super_friendWhere): DeleteInfo!
              deleteSuperUsers(delete: super_userDeleteInput, where: super_userWhere): DeleteInfo!
              updateSuperFriends(update: super_friendUpdateInput, where: super_friendWhere): UpdateSuperFriendsMutationResponse!
              updateSuperUsers(update: super_userUpdateInput, where: super_userWhere): UpdateSuperUsersMutationResponse!
            }

            \\"\\"\\"Pagination information (Relay)\\"\\"\\"
            type PageInfo {
              endCursor: String
              hasNextPage: Boolean!
              hasPreviousPage: Boolean!
              startCursor: String
            }

            type Query {
              superFriends(limit: Int, offset: Int, sort: [super_friendSort!], where: super_friendWhere): [super_friend!]!
              superFriendsConnection(after: String, first: Int, sort: [super_friendSort!], where: super_friendWhere): SuperFriendsConnection!
              superUsers(limit: Int, offset: Int, sort: [super_userSort!], where: super_userWhere): [super_user!]!
              superUsersConnection(after: String, first: Int, sort: [super_userSort!], where: super_userWhere): SuperUsersConnection!
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

            type SuperFriendsConnection {
              aggregate: super_friendAggregate!
              edges: [super_friendEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            type SuperUsersConnection {
              aggregate: super_userAggregate!
              edges: [super_userEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
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

            type super_friendAggregate {
              count: Count!
              node: super_friendAggregateNode!
            }

            type super_friendAggregateNode {
              name: StringAggregateSelection!
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

            input super_friendRelationshipFilters {
              \\"\\"\\"Filter type where all of the related super_friends match this filter\\"\\"\\"
              all: super_friendWhere
              \\"\\"\\"Filter type where none of the related super_friends match this filter\\"\\"\\"
              none: super_friendWhere
              \\"\\"\\"Filter type where one of the related super_friends match this filter\\"\\"\\"
              single: super_friendWhere
              \\"\\"\\"Filter type where some of the related super_friends match this filter\\"\\"\\"
              some: super_friendWhere
            }

            \\"\\"\\"
            Fields to sort SuperFriends by. The order in which sorts are applied is not guaranteed when specifying many fields in one super_friendSort object.
            \\"\\"\\"
            input super_friendSort {
              name: SortDirection
            }

            input super_friendUpdateInput {
              name: StringScalarMutations
              name_SET: String @deprecated(reason: \\"Please use the generic mutation 'name: { set: ... } }' instead.\\")
            }

            input super_friendWhere {
              AND: [super_friendWhere!]
              NOT: super_friendWhere
              OR: [super_friendWhere!]
              name: StringScalarFilters
              name_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter name: { contains: ... }\\")
              name_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter name: { endsWith: ... }\\")
              name_EQ: String @deprecated(reason: \\"Please use the relevant generic filter name: { eq: ... }\\")
              name_IN: [String!] @deprecated(reason: \\"Please use the relevant generic filter name: { in: ... }\\")
              name_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter name: { startsWith: ... }\\")
            }

            type super_user {
              my_friend(limit: Int, offset: Int, sort: [super_friendSort!], where: super_friendWhere): [super_friend!]!
              my_friendConnection(after: String, first: Int, sort: [super_userMy_friendConnectionSort!], where: super_userMy_friendConnectionWhere): super_userMy_friendConnection!
              name: String!
            }

            type super_userAggregate {
              count: Count!
              node: super_userAggregateNode!
            }

            type super_userAggregateNode {
              name: StringAggregateSelection!
            }

            input super_userCreateInput {
              my_friend: super_userMy_friendFieldInput
              name: String!
            }

            input super_userDeleteInput {
              my_friend: [super_userMy_friendDeleteFieldInput!]
            }

            type super_userEdge {
              cursor: String!
              node: super_user!
            }

            input super_userMy_friendAggregateInput {
              AND: [super_userMy_friendAggregateInput!]
              NOT: super_userMy_friendAggregateInput
              OR: [super_userMy_friendAggregateInput!]
              count: IntScalarFilters
              count_EQ: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { eq: ... } } }' instead.\\")
              count_GT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gt: ... } } }' instead.\\")
              count_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gte: ... } } }' instead.\\")
              count_LT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lt: ... } } }' instead.\\")
              count_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lte: ... } } }' instead.\\")
              node: super_userMy_friendNodeAggregationWhereInput
            }

            input super_userMy_friendConnectFieldInput {
              where: super_friendConnectWhere
            }

            type super_userMy_friendConnection {
              aggregate: super_usersuper_friendMy_friendAggregateSelection!
              edges: [super_userMy_friendRelationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input super_userMy_friendConnectionAggregateInput {
              AND: [super_userMy_friendConnectionAggregateInput!]
              NOT: super_userMy_friendConnectionAggregateInput
              OR: [super_userMy_friendConnectionAggregateInput!]
              count: ConnectionAggregationCountFilterInput
              node: super_userMy_friendNodeAggregationWhereInput
            }

            input super_userMy_friendConnectionFilters {
              \\"\\"\\"
              Filter super_users by aggregating results on related super_userMy_friendConnections
              \\"\\"\\"
              aggregate: super_userMy_friendConnectionAggregateInput
              \\"\\"\\"
              Return super_users where all of the related super_userMy_friendConnections match this filter
              \\"\\"\\"
              all: super_userMy_friendConnectionWhere
              \\"\\"\\"
              Return super_users where none of the related super_userMy_friendConnections match this filter
              \\"\\"\\"
              none: super_userMy_friendConnectionWhere
              \\"\\"\\"
              Return super_users where one of the related super_userMy_friendConnections match this filter
              \\"\\"\\"
              single: super_userMy_friendConnectionWhere
              \\"\\"\\"
              Return super_users where some of the related super_userMy_friendConnections match this filter
              \\"\\"\\"
              some: super_userMy_friendConnectionWhere
            }

            input super_userMy_friendConnectionSort {
              node: super_friendSort
            }

            input super_userMy_friendConnectionWhere {
              AND: [super_userMy_friendConnectionWhere!]
              NOT: super_userMy_friendConnectionWhere
              OR: [super_userMy_friendConnectionWhere!]
              node: super_friendWhere
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

            type super_userMy_friendRelationship {
              cursor: String!
              node: super_friend!
            }

            input super_userMy_friendUpdateConnectionInput {
              node: super_friendUpdateInput
              where: super_userMy_friendConnectionWhere
            }

            input super_userMy_friendUpdateFieldInput {
              connect: [super_userMy_friendConnectFieldInput!]
              create: [super_userMy_friendCreateFieldInput!]
              delete: [super_userMy_friendDeleteFieldInput!]
              disconnect: [super_userMy_friendDisconnectFieldInput!]
              update: super_userMy_friendUpdateConnectionInput
            }

            \\"\\"\\"
            Fields to sort SuperUsers by. The order in which sorts are applied is not guaranteed when specifying many fields in one super_userSort object.
            \\"\\"\\"
            input super_userSort {
              name: SortDirection
            }

            input super_userUpdateInput {
              my_friend: [super_userMy_friendUpdateFieldInput!]
              name: StringScalarMutations
              name_SET: String @deprecated(reason: \\"Please use the generic mutation 'name: { set: ... } }' instead.\\")
            }

            input super_userWhere {
              AND: [super_userWhere!]
              NOT: super_userWhere
              OR: [super_userWhere!]
              my_friend: super_friendRelationshipFilters
              my_friendAggregate: super_userMy_friendAggregateInput @deprecated(reason: \\"Aggregate filters are moved inside the my_friendConnection filter, please use { my_friendConnection: { aggregate: {...} } } instead\\")
              my_friendConnection: super_userMy_friendConnectionFilters
              \\"\\"\\"
              Return super_users where all of the related super_userMy_friendConnections match this filter
              \\"\\"\\"
              my_friendConnection_ALL: super_userMy_friendConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'my_friendConnection: { all: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return super_users where none of the related super_userMy_friendConnections match this filter
              \\"\\"\\"
              my_friendConnection_NONE: super_userMy_friendConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'my_friendConnection: { none: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return super_users where one of the related super_userMy_friendConnections match this filter
              \\"\\"\\"
              my_friendConnection_SINGLE: super_userMy_friendConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'my_friendConnection: { single: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return super_users where some of the related super_userMy_friendConnections match this filter
              \\"\\"\\"
              my_friendConnection_SOME: super_userMy_friendConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'my_friendConnection: { some: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return super_users where all of the related super_friends match this filter
              \\"\\"\\"
              my_friend_ALL: super_friendWhere @deprecated(reason: \\"Please use the relevant generic filter 'my_friend: { all: ... }' instead.\\")
              \\"\\"\\"
              Return super_users where none of the related super_friends match this filter
              \\"\\"\\"
              my_friend_NONE: super_friendWhere @deprecated(reason: \\"Please use the relevant generic filter 'my_friend: { none: ... }' instead.\\")
              \\"\\"\\"
              Return super_users where one of the related super_friends match this filter
              \\"\\"\\"
              my_friend_SINGLE: super_friendWhere @deprecated(reason: \\"Please use the relevant generic filter 'my_friend: {  single: ... }' instead.\\")
              \\"\\"\\"
              Return super_users where some of the related super_friends match this filter
              \\"\\"\\"
              my_friend_SOME: super_friendWhere @deprecated(reason: \\"Please use the relevant generic filter 'my_friend: {  some: ... }' instead.\\")
              name: StringScalarFilters
              name_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter name: { contains: ... }\\")
              name_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter name: { endsWith: ... }\\")
              name_EQ: String @deprecated(reason: \\"Please use the relevant generic filter name: { eq: ... }\\")
              name_IN: [String!] @deprecated(reason: \\"Please use the relevant generic filter name: { in: ... }\\")
              name_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter name: { startsWith: ... }\\")
            }

            type super_usersuper_friendMy_friendAggregateSelection {
              count: CountConnection!
              node: super_usersuper_friendMy_friendNodeAggregateSelection
            }

            type super_usersuper_friendMy_friendNodeAggregateSelection {
              name: StringAggregateSelection!
            }"
        `);
    });
});
