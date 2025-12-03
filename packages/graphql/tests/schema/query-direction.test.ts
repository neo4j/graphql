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
    test("DIRECTED", async () => {
        const typeDefs = gql`
            type User @node {
                name: String!
                friends: [User!]! @relationship(type: "FRIENDS_WITH", direction: OUT, queryDirection: DIRECTED)
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
              createUsers(input: [UserCreateInput!]!): CreateUsersMutationResponse!
              deleteUsers(delete: UserDeleteInput, where: UserWhere): DeleteInfo!
              updateUsers(update: UserUpdateInput, where: UserWhere): UpdateUsersMutationResponse!
            }

            \\"\\"\\"Pagination information (Relay)\\"\\"\\"
            type PageInfo {
              endCursor: String
              hasNextPage: Boolean!
              hasPreviousPage: Boolean!
              startCursor: String
            }

            type Query {
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

            type UpdateUsersMutationResponse {
              info: UpdateInfo!
              users: [User!]!
            }

            type User {
              friends(limit: Int, offset: Int, sort: [UserSort!], where: UserWhere): [User!]!
              friendsConnection(after: String, first: Int, sort: [UserFriendsConnectionSort!], where: UserFriendsConnectionWhere): UserFriendsConnection!
              name: String!
            }

            type UserAggregate {
              count: Count!
              node: UserAggregateNode!
            }

            type UserAggregateNode {
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
              count: IntScalarFilters
              count_EQ: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { eq: ... } } }' instead.\\")
              count_GT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gt: ... } } }' instead.\\")
              count_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gte: ... } } }' instead.\\")
              count_LT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lt: ... } } }' instead.\\")
              count_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lte: ... } } }' instead.\\")
              node: UserFriendsNodeAggregationWhereInput
            }

            input UserFriendsConnectFieldInput {
              connect: [UserConnectInput!]
              where: UserConnectWhere
            }

            type UserFriendsConnection {
              aggregate: UserUserFriendsAggregateSelection!
              edges: [UserFriendsRelationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input UserFriendsConnectionAggregateInput {
              AND: [UserFriendsConnectionAggregateInput!]
              NOT: UserFriendsConnectionAggregateInput
              OR: [UserFriendsConnectionAggregateInput!]
              count: ConnectionAggregationCountFilterInput
              node: UserFriendsNodeAggregationWhereInput
            }

            input UserFriendsConnectionFilters {
              \\"\\"\\"Filter Users by aggregating results on related UserFriendsConnections\\"\\"\\"
              aggregate: UserFriendsConnectionAggregateInput
              \\"\\"\\"
              Return Users where all of the related UserFriendsConnections match this filter
              \\"\\"\\"
              all: UserFriendsConnectionWhere
              \\"\\"\\"
              Return Users where none of the related UserFriendsConnections match this filter
              \\"\\"\\"
              none: UserFriendsConnectionWhere
              \\"\\"\\"
              Return Users where one of the related UserFriendsConnections match this filter
              \\"\\"\\"
              single: UserFriendsConnectionWhere
              \\"\\"\\"
              Return Users where some of the related UserFriendsConnections match this filter
              \\"\\"\\"
              some: UserFriendsConnectionWhere
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

            type UserFriendsRelationship {
              cursor: String!
              node: User!
            }

            input UserFriendsUpdateConnectionInput {
              node: UserUpdateInput
              where: UserFriendsConnectionWhere
            }

            input UserFriendsUpdateFieldInput {
              connect: [UserFriendsConnectFieldInput!]
              create: [UserFriendsCreateFieldInput!]
              delete: [UserFriendsDeleteFieldInput!]
              disconnect: [UserFriendsDisconnectFieldInput!]
              update: UserFriendsUpdateConnectionInput
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
              friends: [UserFriendsUpdateFieldInput!]
              name: StringScalarMutations
              name_SET: String @deprecated(reason: \\"Please use the generic mutation 'name: { set: ... } }' instead.\\")
            }

            type UserUserFriendsAggregateSelection {
              count: CountConnection!
              node: UserUserFriendsNodeAggregateSelection
            }

            type UserUserFriendsNodeAggregateSelection {
              name: StringAggregateSelection!
            }

            input UserWhere {
              AND: [UserWhere!]
              NOT: UserWhere
              OR: [UserWhere!]
              friends: UserRelationshipFilters
              friendsAggregate: UserFriendsAggregateInput @deprecated(reason: \\"Aggregate filters are moved inside the friendsConnection filter, please use { friendsConnection: { aggregate: {...} } } instead\\")
              friendsConnection: UserFriendsConnectionFilters
              \\"\\"\\"
              Return Users where all of the related UserFriendsConnections match this filter
              \\"\\"\\"
              friendsConnection_ALL: UserFriendsConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'friendsConnection: { all: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Users where none of the related UserFriendsConnections match this filter
              \\"\\"\\"
              friendsConnection_NONE: UserFriendsConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'friendsConnection: { none: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Users where one of the related UserFriendsConnections match this filter
              \\"\\"\\"
              friendsConnection_SINGLE: UserFriendsConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'friendsConnection: { single: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Users where some of the related UserFriendsConnections match this filter
              \\"\\"\\"
              friendsConnection_SOME: UserFriendsConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'friendsConnection: { some: { node: ... } } }' instead.\\")
              \\"\\"\\"Return Users where all of the related Users match this filter\\"\\"\\"
              friends_ALL: UserWhere @deprecated(reason: \\"Please use the relevant generic filter 'friends: { all: ... }' instead.\\")
              \\"\\"\\"Return Users where none of the related Users match this filter\\"\\"\\"
              friends_NONE: UserWhere @deprecated(reason: \\"Please use the relevant generic filter 'friends: { none: ... }' instead.\\")
              \\"\\"\\"Return Users where one of the related Users match this filter\\"\\"\\"
              friends_SINGLE: UserWhere @deprecated(reason: \\"Please use the relevant generic filter 'friends: {  single: ... }' instead.\\")
              \\"\\"\\"Return Users where some of the related Users match this filter\\"\\"\\"
              friends_SOME: UserWhere @deprecated(reason: \\"Please use the relevant generic filter 'friends: {  some: ... }' instead.\\")
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
            }"
        `);
    });

    test("UNDIRECTED", async () => {
        const typeDefs = gql`
            type User @node {
                name: String!
                friends: [User!]! @relationship(type: "FRIENDS_WITH", direction: OUT, queryDirection: UNDIRECTED)
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
              createUsers(input: [UserCreateInput!]!): CreateUsersMutationResponse!
              deleteUsers(delete: UserDeleteInput, where: UserWhere): DeleteInfo!
              updateUsers(update: UserUpdateInput, where: UserWhere): UpdateUsersMutationResponse!
            }

            \\"\\"\\"Pagination information (Relay)\\"\\"\\"
            type PageInfo {
              endCursor: String
              hasNextPage: Boolean!
              hasPreviousPage: Boolean!
              startCursor: String
            }

            type Query {
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

            type UpdateUsersMutationResponse {
              info: UpdateInfo!
              users: [User!]!
            }

            type User {
              friends(limit: Int, offset: Int, sort: [UserSort!], where: UserWhere): [User!]!
              friendsConnection(after: String, first: Int, sort: [UserFriendsConnectionSort!], where: UserFriendsConnectionWhere): UserFriendsConnection!
              name: String!
            }

            type UserAggregate {
              count: Count!
              node: UserAggregateNode!
            }

            type UserAggregateNode {
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
              count: IntScalarFilters
              count_EQ: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { eq: ... } } }' instead.\\")
              count_GT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gt: ... } } }' instead.\\")
              count_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gte: ... } } }' instead.\\")
              count_LT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lt: ... } } }' instead.\\")
              count_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lte: ... } } }' instead.\\")
              node: UserFriendsNodeAggregationWhereInput
            }

            input UserFriendsConnectFieldInput {
              connect: [UserConnectInput!]
              where: UserConnectWhere
            }

            type UserFriendsConnection {
              aggregate: UserUserFriendsAggregateSelection!
              edges: [UserFriendsRelationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input UserFriendsConnectionAggregateInput {
              AND: [UserFriendsConnectionAggregateInput!]
              NOT: UserFriendsConnectionAggregateInput
              OR: [UserFriendsConnectionAggregateInput!]
              count: ConnectionAggregationCountFilterInput
              node: UserFriendsNodeAggregationWhereInput
            }

            input UserFriendsConnectionFilters {
              \\"\\"\\"Filter Users by aggregating results on related UserFriendsConnections\\"\\"\\"
              aggregate: UserFriendsConnectionAggregateInput
              \\"\\"\\"
              Return Users where all of the related UserFriendsConnections match this filter
              \\"\\"\\"
              all: UserFriendsConnectionWhere
              \\"\\"\\"
              Return Users where none of the related UserFriendsConnections match this filter
              \\"\\"\\"
              none: UserFriendsConnectionWhere
              \\"\\"\\"
              Return Users where one of the related UserFriendsConnections match this filter
              \\"\\"\\"
              single: UserFriendsConnectionWhere
              \\"\\"\\"
              Return Users where some of the related UserFriendsConnections match this filter
              \\"\\"\\"
              some: UserFriendsConnectionWhere
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

            type UserFriendsRelationship {
              cursor: String!
              node: User!
            }

            input UserFriendsUpdateConnectionInput {
              node: UserUpdateInput
              where: UserFriendsConnectionWhere
            }

            input UserFriendsUpdateFieldInput {
              connect: [UserFriendsConnectFieldInput!]
              create: [UserFriendsCreateFieldInput!]
              delete: [UserFriendsDeleteFieldInput!]
              disconnect: [UserFriendsDisconnectFieldInput!]
              update: UserFriendsUpdateConnectionInput
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
              friends: [UserFriendsUpdateFieldInput!]
              name: StringScalarMutations
              name_SET: String @deprecated(reason: \\"Please use the generic mutation 'name: { set: ... } }' instead.\\")
            }

            type UserUserFriendsAggregateSelection {
              count: CountConnection!
              node: UserUserFriendsNodeAggregateSelection
            }

            type UserUserFriendsNodeAggregateSelection {
              name: StringAggregateSelection!
            }

            input UserWhere {
              AND: [UserWhere!]
              NOT: UserWhere
              OR: [UserWhere!]
              friends: UserRelationshipFilters
              friendsAggregate: UserFriendsAggregateInput @deprecated(reason: \\"Aggregate filters are moved inside the friendsConnection filter, please use { friendsConnection: { aggregate: {...} } } instead\\")
              friendsConnection: UserFriendsConnectionFilters
              \\"\\"\\"
              Return Users where all of the related UserFriendsConnections match this filter
              \\"\\"\\"
              friendsConnection_ALL: UserFriendsConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'friendsConnection: { all: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Users where none of the related UserFriendsConnections match this filter
              \\"\\"\\"
              friendsConnection_NONE: UserFriendsConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'friendsConnection: { none: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Users where one of the related UserFriendsConnections match this filter
              \\"\\"\\"
              friendsConnection_SINGLE: UserFriendsConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'friendsConnection: { single: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Users where some of the related UserFriendsConnections match this filter
              \\"\\"\\"
              friendsConnection_SOME: UserFriendsConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'friendsConnection: { some: { node: ... } } }' instead.\\")
              \\"\\"\\"Return Users where all of the related Users match this filter\\"\\"\\"
              friends_ALL: UserWhere @deprecated(reason: \\"Please use the relevant generic filter 'friends: { all: ... }' instead.\\")
              \\"\\"\\"Return Users where none of the related Users match this filter\\"\\"\\"
              friends_NONE: UserWhere @deprecated(reason: \\"Please use the relevant generic filter 'friends: { none: ... }' instead.\\")
              \\"\\"\\"Return Users where one of the related Users match this filter\\"\\"\\"
              friends_SINGLE: UserWhere @deprecated(reason: \\"Please use the relevant generic filter 'friends: {  single: ... }' instead.\\")
              \\"\\"\\"Return Users where some of the related Users match this filter\\"\\"\\"
              friends_SOME: UserWhere @deprecated(reason: \\"Please use the relevant generic filter 'friends: {  some: ... }' instead.\\")
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
            }"
        `);
    });
});
