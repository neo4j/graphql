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
import { Neo4jGraphQL } from "../../../src";

describe("ttps://github.com/neo4j/graphql/issues/3817", () => {
    test("3817", async () => {
        const typeDefs = gql`
            type Person @node {
                id: ID! @id
                friends: [Person!]!
                    @relationship(type: "FRIEND_OF", direction: OUT, queryDirection: UNDIRECTED, properties: "FriendOf")
            }

            type FriendOf @relationshipProperties {
                #  id: ID! @id
                #  active: Boolean!
                id: String @populatedBy(callback: "getUserIDFromContext", operations: [CREATE])
            }
        `;
        const neoSchema = new Neo4jGraphQL({
            typeDefs,
            features: {
                populatedBy: {
                    callbacks: {
                        getUserIDFromContext: (_parent, _args, context) => {
                            const userId = context.jwt?.id;
                            if (typeof userId === "string") {
                                return userId;
                            }
                            return undefined;
                        },
                    },
                },
            },
        });
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

            type CreatePeopleMutationResponse {
              info: CreateInfo!
              people: [Person!]!
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

            \\"\\"\\"
            The edge properties for the following fields:
            * Person.friends
            \\"\\"\\"
            type FriendOf {
              id: String
            }

            input FriendOfAggregationWhereInput {
              AND: [FriendOfAggregationWhereInput!]
              NOT: FriendOfAggregationWhereInput
              OR: [FriendOfAggregationWhereInput!]
              id: StringScalarAggregationFilters
              id_AVERAGE_LENGTH_EQUAL: Float @deprecated(reason: \\"Please use the relevant generic filter 'id: { averageLength: { eq: ... } } }' instead.\\")
              id_AVERAGE_LENGTH_GT: Float @deprecated(reason: \\"Please use the relevant generic filter 'id: { averageLength: { gt: ... } } }' instead.\\")
              id_AVERAGE_LENGTH_GTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'id: { averageLength: { gte: ... } } }' instead.\\")
              id_AVERAGE_LENGTH_LT: Float @deprecated(reason: \\"Please use the relevant generic filter 'id: { averageLength: { lt: ... } } }' instead.\\")
              id_AVERAGE_LENGTH_LTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'id: { averageLength: { lte: ... } } }' instead.\\")
              id_LONGEST_LENGTH_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'id: { longestLength: { eq: ... } } }' instead.\\")
              id_LONGEST_LENGTH_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'id: { longestLength: { gt: ... } } }' instead.\\")
              id_LONGEST_LENGTH_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'id: { longestLength: { gte: ... } } }' instead.\\")
              id_LONGEST_LENGTH_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'id: { longestLength: { lt: ... } } }' instead.\\")
              id_LONGEST_LENGTH_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'id: { longestLength: { lte: ... } } }' instead.\\")
              id_SHORTEST_LENGTH_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'id: { shortestLength: { eq: ... } } }' instead.\\")
              id_SHORTEST_LENGTH_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'id: { shortestLength: { gt: ... } } }' instead.\\")
              id_SHORTEST_LENGTH_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'id: { shortestLength: { gte: ... } } }' instead.\\")
              id_SHORTEST_LENGTH_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'id: { shortestLength: { lt: ... } } }' instead.\\")
              id_SHORTEST_LENGTH_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'id: { shortestLength: { lte: ... } } }' instead.\\")
            }

            input FriendOfSort {
              id: SortDirection
            }

            input FriendOfUpdateInput {
              id: StringScalarMutations
              id_SET: String @deprecated(reason: \\"Please use the generic mutation 'id: { set: ... } }' instead.\\")
            }

            input FriendOfWhere {
              AND: [FriendOfWhere!]
              NOT: FriendOfWhere
              OR: [FriendOfWhere!]
              id: StringScalarFilters
              id_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter id: { contains: ... }\\")
              id_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter id: { endsWith: ... }\\")
              id_EQ: String @deprecated(reason: \\"Please use the relevant generic filter id: { eq: ... }\\")
              id_IN: [String] @deprecated(reason: \\"Please use the relevant generic filter id: { in: ... }\\")
              id_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter id: { startsWith: ... }\\")
            }

            type IDAggregateSelection {
              longest: ID
              shortest: ID
            }

            \\"\\"\\"Filters for an aggregation of an ID input field\\"\\"\\"
            input IDScalarAggregationFilters {
              max: IDScalarFilters
              min: IDScalarFilters
            }

            \\"\\"\\"ID filters\\"\\"\\"
            input IDScalarFilters {
              contains: ID
              endsWith: ID
              eq: ID
              gt: ID
              gte: ID
              in: [ID!]
              lt: ID
              lte: ID
              matches: ID
              startsWith: ID
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
              createPeople(input: [PersonCreateInput!]!): CreatePeopleMutationResponse!
              deletePeople(delete: PersonDeleteInput, where: PersonWhere): DeleteInfo!
              updatePeople(update: PersonUpdateInput, where: PersonWhere): UpdatePeopleMutationResponse!
            }

            \\"\\"\\"Pagination information (Relay)\\"\\"\\"
            type PageInfo {
              endCursor: String
              hasNextPage: Boolean!
              hasPreviousPage: Boolean!
              startCursor: String
            }

            type PeopleConnection {
              edges: [PersonEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            type Person {
              friends(limit: Int, offset: Int, sort: [PersonSort!], where: PersonWhere): [Person!]!
              friendsAggregate(where: PersonWhere): PersonPersonFriendsAggregationSelection
              friendsConnection(after: String, first: Int, sort: [PersonFriendsConnectionSort!], where: PersonFriendsConnectionWhere): PersonFriendsConnection!
              id: ID!
            }

            type PersonAggregateSelection {
              count: Int!
              id: IDAggregateSelection!
            }

            input PersonConnectInput {
              friends: [PersonFriendsConnectFieldInput!]
            }

            input PersonConnectWhere {
              node: PersonWhere!
            }

            input PersonCreateInput {
              friends: PersonFriendsFieldInput
            }

            input PersonDeleteInput {
              friends: [PersonFriendsDeleteFieldInput!]
            }

            input PersonDisconnectInput {
              friends: [PersonFriendsDisconnectFieldInput!]
            }

            type PersonEdge {
              cursor: String!
              node: Person!
            }

            input PersonFriendsAggregateInput {
              AND: [PersonFriendsAggregateInput!]
              NOT: PersonFriendsAggregateInput
              OR: [PersonFriendsAggregateInput!]
              count: IntScalarFilters
              count_EQ: Int
              count_GT: Int
              count_GTE: Int
              count_LT: Int
              count_LTE: Int
              edge: FriendOfAggregationWhereInput
              node: PersonFriendsNodeAggregationWhereInput
            }

            input PersonFriendsConnectFieldInput {
              connect: [PersonConnectInput!]
              where: PersonConnectWhere
            }

            type PersonFriendsConnection {
              edges: [PersonFriendsRelationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input PersonFriendsConnectionFilters {
              \\"\\"\\"
              Return People where all of the related PersonFriendsConnections match this filter
              \\"\\"\\"
              all: PersonFriendsConnectionWhere
              \\"\\"\\"
              Return People where none of the related PersonFriendsConnections match this filter
              \\"\\"\\"
              none: PersonFriendsConnectionWhere
              \\"\\"\\"
              Return People where one of the related PersonFriendsConnections match this filter
              \\"\\"\\"
              single: PersonFriendsConnectionWhere
              \\"\\"\\"
              Return People where some of the related PersonFriendsConnections match this filter
              \\"\\"\\"
              some: PersonFriendsConnectionWhere
            }

            input PersonFriendsConnectionSort {
              edge: FriendOfSort
              node: PersonSort
            }

            input PersonFriendsConnectionWhere {
              AND: [PersonFriendsConnectionWhere!]
              NOT: PersonFriendsConnectionWhere
              OR: [PersonFriendsConnectionWhere!]
              edge: FriendOfWhere
              node: PersonWhere
            }

            input PersonFriendsCreateFieldInput {
              node: PersonCreateInput!
            }

            input PersonFriendsDeleteFieldInput {
              delete: PersonDeleteInput
              where: PersonFriendsConnectionWhere
            }

            input PersonFriendsDisconnectFieldInput {
              disconnect: PersonDisconnectInput
              where: PersonFriendsConnectionWhere
            }

            input PersonFriendsFieldInput {
              connect: [PersonFriendsConnectFieldInput!]
              create: [PersonFriendsCreateFieldInput!]
            }

            input PersonFriendsNodeAggregationWhereInput {
              AND: [PersonFriendsNodeAggregationWhereInput!]
              NOT: PersonFriendsNodeAggregationWhereInput
              OR: [PersonFriendsNodeAggregationWhereInput!]
              id: IDScalarAggregationFilters
              id_MAX_EQUAL: ID @deprecated(reason: \\"Please use the relevant generic filter 'id: { max: { eq: ... } } }' instead.\\")
              id_MAX_GT: ID @deprecated(reason: \\"Please use the relevant generic filter 'id: { max: { gt: ... } } }' instead.\\")
              id_MAX_GTE: ID @deprecated(reason: \\"Please use the relevant generic filter 'id: { max: { gte: ... } } }' instead.\\")
              id_MAX_LT: ID @deprecated(reason: \\"Please use the relevant generic filter 'id: { max: { lt: ... } } }' instead.\\")
              id_MAX_LTE: ID @deprecated(reason: \\"Please use the relevant generic filter 'id: { max: { lte: ... } } }' instead.\\")
              id_MIN_EQUAL: ID @deprecated(reason: \\"Please use the relevant generic filter 'id: { min: { eq: ... } } }' instead.\\")
              id_MIN_GT: ID @deprecated(reason: \\"Please use the relevant generic filter 'id: { min: { gt: ... } } }' instead.\\")
              id_MIN_GTE: ID @deprecated(reason: \\"Please use the relevant generic filter 'id: { min: { gte: ... } } }' instead.\\")
              id_MIN_LT: ID @deprecated(reason: \\"Please use the relevant generic filter 'id: { min: { lt: ... } } }' instead.\\")
              id_MIN_LTE: ID @deprecated(reason: \\"Please use the relevant generic filter 'id: { min: { lte: ... } } }' instead.\\")
            }

            type PersonFriendsRelationship {
              cursor: String!
              node: Person!
              properties: FriendOf!
            }

            input PersonFriendsRelationshipFilters {
              \\"\\"\\"Return People where all of the related People match this filter\\"\\"\\"
              all: PersonWhere
              \\"\\"\\"Return People where none of the related People match this filter\\"\\"\\"
              none: PersonWhere
              \\"\\"\\"Return People where one of the related People match this filter\\"\\"\\"
              single: PersonWhere
              \\"\\"\\"Return People where some of the related People match this filter\\"\\"\\"
              some: PersonWhere
            }

            input PersonFriendsUpdateConnectionInput {
              edge: FriendOfUpdateInput
              node: PersonUpdateInput
            }

            input PersonFriendsUpdateFieldInput {
              connect: [PersonFriendsConnectFieldInput!]
              create: [PersonFriendsCreateFieldInput!]
              delete: [PersonFriendsDeleteFieldInput!]
              disconnect: [PersonFriendsDisconnectFieldInput!]
              update: PersonFriendsUpdateConnectionInput
              where: PersonFriendsConnectionWhere
            }

            type PersonPersonFriendsAggregationSelection {
              count: Int!
              edge: PersonPersonFriendsEdgeAggregateSelection
              node: PersonPersonFriendsNodeAggregateSelection
            }

            type PersonPersonFriendsEdgeAggregateSelection {
              id: StringAggregateSelection!
            }

            type PersonPersonFriendsNodeAggregateSelection {
              id: IDAggregateSelection!
            }

            \\"\\"\\"
            Fields to sort People by. The order in which sorts are applied is not guaranteed when specifying many fields in one PersonSort object.
            \\"\\"\\"
            input PersonSort {
              id: SortDirection
            }

            input PersonUpdateInput {
              friends: [PersonFriendsUpdateFieldInput!]
            }

            input PersonWhere {
              AND: [PersonWhere!]
              NOT: PersonWhere
              OR: [PersonWhere!]
              friends: PersonFriendsRelationshipFilters
              friendsAggregate: PersonFriendsAggregateInput
              friendsConnection: PersonFriendsConnectionFilters
              \\"\\"\\"
              Return People where all of the related PersonFriendsConnections match this filter
              \\"\\"\\"
              friendsConnection_ALL: PersonFriendsConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'friendsConnection: { all: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return People where none of the related PersonFriendsConnections match this filter
              \\"\\"\\"
              friendsConnection_NONE: PersonFriendsConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'friendsConnection: { none: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return People where one of the related PersonFriendsConnections match this filter
              \\"\\"\\"
              friendsConnection_SINGLE: PersonFriendsConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'friendsConnection: { single: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return People where some of the related PersonFriendsConnections match this filter
              \\"\\"\\"
              friendsConnection_SOME: PersonFriendsConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'friendsConnection: { some: { node: ... } } }' instead.\\")
              \\"\\"\\"Return People where all of the related People match this filter\\"\\"\\"
              friends_ALL: PersonWhere @deprecated(reason: \\"Please use the relevant generic filter 'friends: { all: ... }' instead.\\")
              \\"\\"\\"Return People where none of the related People match this filter\\"\\"\\"
              friends_NONE: PersonWhere @deprecated(reason: \\"Please use the relevant generic filter 'friends: { none: ... }' instead.\\")
              \\"\\"\\"Return People where one of the related People match this filter\\"\\"\\"
              friends_SINGLE: PersonWhere @deprecated(reason: \\"Please use the relevant generic filter 'friends: {  single: ... }' instead.\\")
              \\"\\"\\"Return People where some of the related People match this filter\\"\\"\\"
              friends_SOME: PersonWhere @deprecated(reason: \\"Please use the relevant generic filter 'friends: {  some: ... }' instead.\\")
              id: IDScalarFilters
              id_CONTAINS: ID @deprecated(reason: \\"Please use the relevant generic filter id: { contains: ... }\\")
              id_ENDS_WITH: ID @deprecated(reason: \\"Please use the relevant generic filter id: { endsWith: ... }\\")
              id_EQ: ID @deprecated(reason: \\"Please use the relevant generic filter id: { eq: ... }\\")
              id_IN: [ID!] @deprecated(reason: \\"Please use the relevant generic filter id: { in: ... }\\")
              id_STARTS_WITH: ID @deprecated(reason: \\"Please use the relevant generic filter id: { startsWith: ... }\\")
            }

            type Query {
              people(limit: Int, offset: Int, sort: [PersonSort!], where: PersonWhere): [Person!]!
              peopleAggregate(where: PersonWhere): PersonAggregateSelection!
              peopleConnection(after: String, first: Int, sort: [PersonSort!], where: PersonWhere): PeopleConnection!
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
              gt: String
              gte: String
              in: [String!]
              lt: String
              lte: String
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

            type UpdatePeopleMutationResponse {
              info: UpdateInfo!
              people: [Person!]!
            }"
        `);
    });
});
