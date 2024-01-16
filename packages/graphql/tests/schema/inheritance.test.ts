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

describe("inheritance", () => {
    test("various graphql entities should correctly perform inheritance", async () => {
        const typeDefs = gql`
            directive @customDirectiveField on FIELD_DEFINITION
            directive @customDirectiveObj on OBJECT
            directive @customDirectiveInter on INTERFACE

            interface Person @customDirectiveInter {
                name: String @customDirectiveField
                friends: [Person!]!
                    @relationship(type: "FRIENDS_WITH", direction: OUT, properties: "FriendsWith")
                    @customDirectiveField
            }

            type Actor implements Person @customDirectiveObj {
                name: String
                friends: [Person!]! @relationship(type: "FRIENDS_WITH", direction: OUT, properties: "FriendsWith")
            }

            interface FriendsWith @relationshipProperties {
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
              friends(directed: Boolean = true, options: PersonOptions, where: PersonWhere): [Person!]! @customDirectiveField
              friendsConnection(after: String, directed: Boolean = true, first: Int, sort: [PersonFriendsConnectionSort!], where: PersonFriendsConnectionWhere): PersonFriendsConnection!
              name: String @customDirectiveField
            }

            type ActorAggregateSelection {
              count: Int!
              name: StringAggregateSelectionNullable!
            }

            input ActorConnectInput {
              friends: [ActorFriendsConnectFieldInput!]
            }

            input ActorCreateInput {
              friends: PersonFriendsFieldInput
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

            interface FriendsWith {
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
              friends(directed: Boolean = true, options: PersonOptions, where: PersonWhere): [Person!]! @customDirectiveField
              friendsConnection(after: String, directed: Boolean = true, first: Int, sort: [PersonFriendsConnectionSort!], where: PersonFriendsConnectionWhere): PersonFriendsConnection!
              name: String @customDirectiveField
            }

            input PersonConnectInput {
              _on: PersonImplementationsConnectInput
              friends: [PersonFriendsConnectFieldInput!]
            }

            input PersonConnectWhere {
              node: PersonWhere!
            }

            input PersonCreateInput {
              Actor: ActorCreateInput
            }

            input PersonDeleteInput {
              _on: PersonImplementationsDeleteInput
              friends: [PersonFriendsDeleteFieldInput!]
            }

            input PersonDisconnectInput {
              _on: PersonImplementationsDisconnectInput
              friends: [PersonFriendsDisconnectFieldInput!]
            }

            input PersonFriendsConnectFieldInput {
              connect: PersonConnectInput
              edge: FriendsWithCreateInput
              where: PersonConnectWhere
            }

            type PersonFriendsConnection {
              edges: [PersonFriendsRelationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input PersonFriendsConnectionSort {
              edge: FriendsWithSort
              node: PersonSort
            }

            input PersonFriendsConnectionWhere {
              AND: [PersonFriendsConnectionWhere!]
              NOT: PersonFriendsConnectionWhere
              OR: [PersonFriendsConnectionWhere!]
              edge: FriendsWithWhere
              edge_NOT: FriendsWithWhere @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              node: PersonWhere
              node_NOT: PersonWhere @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
            }

            input PersonFriendsCreateFieldInput {
              edge: FriendsWithCreateInput
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

            type PersonFriendsRelationship implements FriendsWith {
              cursor: String!
              node: Person!
              since: Int
            }

            input PersonFriendsUpdateConnectionInput {
              edge: FriendsWithUpdateInput
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

            input PersonImplementationsConnectInput {
              Actor: [ActorConnectInput!]
            }

            input PersonImplementationsDeleteInput {
              Actor: [ActorDeleteInput!]
            }

            input PersonImplementationsDisconnectInput {
              Actor: [ActorDisconnectInput!]
            }

            input PersonImplementationsUpdateInput {
              Actor: ActorUpdateInput
            }

            input PersonImplementationsWhere {
              Actor: ActorWhere
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
              _on: PersonImplementationsUpdateInput
              friends: [PersonFriendsUpdateFieldInput!]
              name: String
            }

            input PersonWhere {
              _on: PersonImplementationsWhere
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

            type Query {
              actors(options: ActorOptions, where: ActorWhere): [Actor!]!
              actorsAggregate(where: ActorWhere): ActorAggregateSelection!
              actorsConnection(after: String, first: Int, sort: [ActorSort], where: ActorWhere): ActorsConnection!
            }

            \\"\\"\\"An enum for sorting in either ascending or descending order.\\"\\"\\"
            enum SortDirection {
              \\"\\"\\"Sort by field values in ascending order.\\"\\"\\"
              ASC
              \\"\\"\\"Sort by field values in descending order.\\"\\"\\"
              DESC
            }

            type StringAggregateSelectionNullable {
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
