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

describe("inheritance", () => {
    test("various graphql entities should correctly perform inheritance", async () => {
        const typeDefs = gql`
            directive @customDirectiveField on FIELD_DEFINITION
            directive @customDirectiveObj on OBJECT
            directive @customDirectiveInter on INTERFACE

            interface Person @customDirectiveInter {
                name: String @customDirectiveField
                friends: [Person!]! @declareRelationship @customDirectiveField
            }

            type Actor implements Person @customDirectiveObj {
                name: String
                friends: [Person!]! @relationship(type: "FRIENDS_WITH", direction: OUT, properties: "FriendsWith")
            }

            type FriendsWith @relationshipProperties {
                since: Int
            }
        `;
        const neoSchema = new Neo4jGraphQL({ typeDefs });
        const printedSchema = printSchemaWithDirectives(lexicographicSortSchema(await neoSchema.getSchema()));

        expect(printedSchema).toMatchInlineSnapshot(`
            "schema {
              query: Query
              mutation: Mutation
            }

            directive @customDirectiveField on FIELD_DEFINITION

            directive @customDirectiveInter on INTERFACE

            directive @customDirectiveObj on OBJECT

            type Actor implements Person @customDirectiveObj {
              friends(directed: Boolean = true, options: PersonOptions, where: PersonWhere): [Person!]!
              friendsAggregate(directed: Boolean = true, where: PersonWhere): ActorPersonFriendsAggregationSelection
              friendsConnection(after: String, directed: Boolean = true, first: Int, sort: [PersonFriendsConnectionSort!], where: PersonFriendsConnectionWhere): PersonFriendsConnection!
              name: String
            }

            type ActorAggregateSelection {
              count: Int!
              name: StringAggregateSelection!
            }

            input ActorConnectInput {
              friends: [ActorFriendsConnectFieldInput!]
            }

            input ActorCreateInput {
              friends: ActorFriendsFieldInput
              name: String
            }

            input ActorDeleteInput {
              friends: [ActorFriendsDeleteFieldInput!]
            }

            input ActorDisconnectInput {
              friends: [ActorFriendsDisconnectFieldInput!]
            }

            type ActorEdge {
              cursor: String!
              node: Actor!
            }

            input ActorFriendsConnectFieldInput {
              connect: PersonConnectInput
              edge: FriendsWithCreateInput
              where: PersonConnectWhere
            }

            input ActorFriendsCreateFieldInput {
              edge: FriendsWithCreateInput
              node: PersonCreateInput!
            }

            input ActorFriendsDeleteFieldInput {
              delete: PersonDeleteInput
              where: PersonFriendsConnectionWhere
            }

            input ActorFriendsDisconnectFieldInput {
              disconnect: PersonDisconnectInput
              where: PersonFriendsConnectionWhere
            }

            input ActorFriendsFieldInput {
              connect: [ActorFriendsConnectFieldInput!]
              create: [ActorFriendsCreateFieldInput!]
            }

            input ActorFriendsUpdateConnectionInput {
              edge: FriendsWithUpdateInput
              node: PersonUpdateInput
            }

            input ActorFriendsUpdateFieldInput {
              connect: [ActorFriendsConnectFieldInput!]
              create: [ActorFriendsCreateFieldInput!]
              delete: [ActorFriendsDeleteFieldInput!]
              disconnect: [ActorFriendsDisconnectFieldInput!]
              update: ActorFriendsUpdateConnectionInput
              where: PersonFriendsConnectionWhere
            }

            input ActorOptions {
              limit: Int
              offset: Int
              \\"\\"\\"
              Specify one or more ActorSort objects to sort Actors by. The sorts will be applied in the order in which they are arranged in the array.
              \\"\\"\\"
              sort: [ActorSort!]
            }

            type ActorPersonFriendsAggregationSelection {
              count: Int!
              edge: ActorPersonFriendsEdgeAggregateSelection
              node: ActorPersonFriendsNodeAggregateSelection
            }

            type ActorPersonFriendsEdgeAggregateSelection {
              since: IntAggregateSelection!
            }

            type ActorPersonFriendsNodeAggregateSelection {
              name: StringAggregateSelection!
            }

            input ActorRelationInput {
              friends: [ActorFriendsCreateFieldInput!]
            }

            \\"\\"\\"
            Fields to sort Actors by. The order in which sorts are applied is not guaranteed when specifying many fields in one ActorSort object.
            \\"\\"\\"
            input ActorSort {
              name: SortDirection
            }

            input ActorUpdateInput {
              friends: [ActorFriendsUpdateFieldInput!]
              name: String
            }

            input ActorWhere {
              AND: [ActorWhere!]
              NOT: ActorWhere
              OR: [ActorWhere!]
              friends: PersonWhere @deprecated(reason: \\"Use \`friends_SOME\` instead.\\")
              friendsConnection: PersonFriendsConnectionWhere @deprecated(reason: \\"Use \`friendsConnection_SOME\` instead.\\")
              \\"\\"\\"
              Return Actors where all of the related PersonFriendsConnections match this filter
              \\"\\"\\"
              friendsConnection_ALL: PersonFriendsConnectionWhere
              \\"\\"\\"
              Return Actors where none of the related PersonFriendsConnections match this filter
              \\"\\"\\"
              friendsConnection_NONE: PersonFriendsConnectionWhere
              friendsConnection_NOT: PersonFriendsConnectionWhere @deprecated(reason: \\"Use \`friendsConnection_NONE\` instead.\\")
              \\"\\"\\"
              Return Actors where one of the related PersonFriendsConnections match this filter
              \\"\\"\\"
              friendsConnection_SINGLE: PersonFriendsConnectionWhere
              \\"\\"\\"
              Return Actors where some of the related PersonFriendsConnections match this filter
              \\"\\"\\"
              friendsConnection_SOME: PersonFriendsConnectionWhere
              \\"\\"\\"Return Actors where all of the related People match this filter\\"\\"\\"
              friends_ALL: PersonWhere
              \\"\\"\\"Return Actors where none of the related People match this filter\\"\\"\\"
              friends_NONE: PersonWhere
              friends_NOT: PersonWhere @deprecated(reason: \\"Use \`friends_NONE\` instead.\\")
              \\"\\"\\"Return Actors where one of the related People match this filter\\"\\"\\"
              friends_SINGLE: PersonWhere
              \\"\\"\\"Return Actors where some of the related People match this filter\\"\\"\\"
              friends_SOME: PersonWhere
              name: String
              name_CONTAINS: String
              name_ENDS_WITH: String
              name_IN: [String]
              name_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              name_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              name_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              name_NOT_IN: [String] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              name_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              name_STARTS_WITH: String
            }

            type ActorsConnection {
              edges: [ActorEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            type CreateActorsMutationResponse {
              actors: [Actor!]!
              info: CreateInfo!
            }

            \\"\\"\\"
            Information about the number of nodes and relationships created during a create mutation
            \\"\\"\\"
            type CreateInfo {
              bookmark: String @deprecated(reason: \\"This field has been deprecated because bookmarks are now handled by the driver.\\")
              nodesCreated: Int!
              relationshipsCreated: Int!
            }

            \\"\\"\\"
            Information about the number of nodes and relationships deleted during a delete mutation
            \\"\\"\\"
            type DeleteInfo {
              bookmark: String @deprecated(reason: \\"This field has been deprecated because bookmarks are now handled by the driver.\\")
              nodesDeleted: Int!
              relationshipsDeleted: Int!
            }

            \\"\\"\\"
            The edge properties for the following fields:
            * Actor.friends
            \\"\\"\\"
            type FriendsWith {
              since: Int
            }

            input FriendsWithCreateInput {
              since: Int
            }

            input FriendsWithSort {
              since: SortDirection
            }

            input FriendsWithUpdateInput {
              since: Int
              since_DECREMENT: Int
              since_INCREMENT: Int
            }

            input FriendsWithWhere {
              AND: [FriendsWithWhere!]
              NOT: FriendsWithWhere
              OR: [FriendsWithWhere!]
              since: Int
              since_GT: Int
              since_GTE: Int
              since_IN: [Int]
              since_LT: Int
              since_LTE: Int
              since_NOT: Int @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              since_NOT_IN: [Int] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
            }

            type IntAggregateSelection {
              average: Float
              max: Int
              min: Int
              sum: Int
            }

            type Mutation {
              createActors(input: [ActorCreateInput!]!): CreateActorsMutationResponse!
              deleteActors(delete: ActorDeleteInput, where: ActorWhere): DeleteInfo!
              updateActors(connect: ActorConnectInput, create: ActorRelationInput, delete: ActorDeleteInput, disconnect: ActorDisconnectInput, update: ActorUpdateInput, where: ActorWhere): UpdateActorsMutationResponse!
            }

            \\"\\"\\"Pagination information (Relay)\\"\\"\\"
            type PageInfo {
              endCursor: String
              hasNextPage: Boolean!
              hasPreviousPage: Boolean!
              startCursor: String
            }

            interface Person @customDirectiveInter {
              friends(options: PersonOptions, where: PersonWhere): [Person!]! @customDirectiveField
              friendsConnection(after: String, first: Int, sort: [PersonFriendsConnectionSort!], where: PersonFriendsConnectionWhere): PersonFriendsConnection!
              name: String @customDirectiveField
            }

            type PersonAggregateSelection {
              count: Int!
              name: StringAggregateSelection!
            }

            input PersonConnectInput {
              friends: [PersonFriendsConnectFieldInput!]
            }

            input PersonConnectWhere {
              node: PersonWhere!
            }

            input PersonCreateInput {
              Actor: ActorCreateInput
            }

            input PersonDeleteInput {
              friends: [PersonFriendsDeleteFieldInput!]
            }

            input PersonDisconnectInput {
              friends: [PersonFriendsDisconnectFieldInput!]
            }

            input PersonFriendsConnectFieldInput {
              connect: PersonConnectInput
              edge: PersonFriendsEdgeCreateInput
              where: PersonConnectWhere
            }

            type PersonFriendsConnection {
              edges: [PersonFriendsRelationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input PersonFriendsConnectionSort {
              edge: PersonFriendsEdgeSort
              node: PersonSort
            }

            input PersonFriendsConnectionWhere {
              AND: [PersonFriendsConnectionWhere!]
              NOT: PersonFriendsConnectionWhere
              OR: [PersonFriendsConnectionWhere!]
              edge: PersonFriendsEdgeWhere
              edge_NOT: PersonFriendsEdgeWhere @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              node: PersonWhere
              node_NOT: PersonWhere @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
            }

            input PersonFriendsCreateFieldInput {
              edge: PersonFriendsEdgeCreateInput
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

            input PersonFriendsEdgeCreateInput {
              \\"\\"\\"
              Relationship properties when source node is of type:
              * Actor
              \\"\\"\\"
              FriendsWith: FriendsWithCreateInput
            }

            input PersonFriendsEdgeSort {
              \\"\\"\\"
              Relationship properties when source node is of type:
              * Actor
              \\"\\"\\"
              FriendsWith: FriendsWithSort
            }

            input PersonFriendsEdgeUpdateInput {
              \\"\\"\\"
              Relationship properties when source node is of type:
              * Actor
              \\"\\"\\"
              FriendsWith: FriendsWithUpdateInput
            }

            input PersonFriendsEdgeWhere {
              \\"\\"\\"
              Relationship properties when source node is of type:
              * Actor
              \\"\\"\\"
              FriendsWith: FriendsWithWhere
            }

            type PersonFriendsRelationship {
              cursor: String!
              node: Person!
              properties: PersonFriendsRelationshipProperties!
            }

            union PersonFriendsRelationshipProperties = FriendsWith

            input PersonFriendsUpdateConnectionInput {
              edge: PersonFriendsEdgeUpdateInput
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

            enum PersonImplementation {
              Actor
            }

            input PersonOptions {
              limit: Int
              offset: Int
              \\"\\"\\"
              Specify one or more PersonSort objects to sort People by. The sorts will be applied in the order in which they are arranged in the array.
              \\"\\"\\"
              sort: [PersonSort]
            }

            \\"\\"\\"
            Fields to sort People by. The order in which sorts are applied is not guaranteed when specifying many fields in one PersonSort object.
            \\"\\"\\"
            input PersonSort {
              name: SortDirection
            }

            input PersonUpdateInput {
              friends: [PersonFriendsUpdateFieldInput!]
              name: String
            }

            input PersonWhere {
              AND: [PersonWhere!]
              NOT: PersonWhere
              OR: [PersonWhere!]
              friends: PersonWhere @deprecated(reason: \\"Use \`friends_SOME\` instead.\\")
              friendsConnection: PersonFriendsConnectionWhere @deprecated(reason: \\"Use \`friendsConnection_SOME\` instead.\\")
              \\"\\"\\"
              Return People where all of the related PersonFriendsConnections match this filter
              \\"\\"\\"
              friendsConnection_ALL: PersonFriendsConnectionWhere
              \\"\\"\\"
              Return People where none of the related PersonFriendsConnections match this filter
              \\"\\"\\"
              friendsConnection_NONE: PersonFriendsConnectionWhere
              friendsConnection_NOT: PersonFriendsConnectionWhere @deprecated(reason: \\"Use \`friendsConnection_NONE\` instead.\\")
              \\"\\"\\"
              Return People where one of the related PersonFriendsConnections match this filter
              \\"\\"\\"
              friendsConnection_SINGLE: PersonFriendsConnectionWhere
              \\"\\"\\"
              Return People where some of the related PersonFriendsConnections match this filter
              \\"\\"\\"
              friendsConnection_SOME: PersonFriendsConnectionWhere
              \\"\\"\\"Return People where all of the related People match this filter\\"\\"\\"
              friends_ALL: PersonWhere
              \\"\\"\\"Return People where none of the related People match this filter\\"\\"\\"
              friends_NONE: PersonWhere
              friends_NOT: PersonWhere @deprecated(reason: \\"Use \`friends_NONE\` instead.\\")
              \\"\\"\\"Return People where one of the related People match this filter\\"\\"\\"
              friends_SINGLE: PersonWhere
              \\"\\"\\"Return People where some of the related People match this filter\\"\\"\\"
              friends_SOME: PersonWhere
              name: String
              name_CONTAINS: String
              name_ENDS_WITH: String
              name_IN: [String]
              name_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              name_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              name_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              name_NOT_IN: [String] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              name_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              name_STARTS_WITH: String
              typename_IN: [PersonImplementation!]
            }

            type Query {
              actors(options: ActorOptions, where: ActorWhere): [Actor!]!
              actorsAggregate(where: ActorWhere): ActorAggregateSelection!
              actorsConnection(after: String, first: Int, sort: [ActorSort], where: ActorWhere): ActorsConnection!
              people(options: PersonOptions, where: PersonWhere): [Person!]!
              peopleAggregate(where: PersonWhere): PersonAggregateSelection!
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

            type UpdateActorsMutationResponse {
              actors: [Actor!]!
              info: UpdateInfo!
            }

            \\"\\"\\"
            Information about the number of nodes and relationships created and deleted during an update mutation
            \\"\\"\\"
            type UpdateInfo {
              bookmark: String @deprecated(reason: \\"This field has been deprecated because bookmarks are now handled by the driver.\\")
              nodesCreated: Int!
              nodesDeleted: Int!
              relationshipsCreated: Int!
              relationshipsDeleted: Int!
            }"
        `);
    });
});
