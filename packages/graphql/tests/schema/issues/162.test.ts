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
import { gql } from "apollo-server";
import { Neo4jGraphQL } from "../../../src";

describe("162", () => {
    test("2 instances of DeleteInput type created", () => {
        const typeDefs = gql`
            type Tiger {
                x: Int
            }

            type TigerJawLevel2 {
                id: ID
                part1: TigerJawLevel2Part1 @relationship(type: "REL1", direction: OUT)
            }

            type TigerJawLevel2Part1 {
                id: ID
                tiger: Tiger @relationship(type: "REL2", direction: OUT)
            }
        `;
        const neoSchema = new Neo4jGraphQL({ typeDefs });
        const printedSchema = printSchemaWithDirectives(lexicographicSortSchema(neoSchema.schema));

        expect(printedSchema).toMatchInlineSnapshot(`
            "schema {
              query: Query
              mutation: Mutation
              subscription: Subscription
            }

            type CreateInfo {
              bookmark: String
              nodesCreated: Int!
              relationshipsCreated: Int!
            }

            type CreateTigerJawLevel2Part1sMutationResponse {
              info: CreateInfo!
              tigerJawLevel2Part1s: [TigerJawLevel2Part1!]!
            }

            type CreateTigerJawLevel2sMutationResponse {
              info: CreateInfo!
              tigerJawLevel2s: [TigerJawLevel2!]!
            }

            type CreateTigersMutationResponse {
              info: CreateInfo!
              tigers: [Tiger!]!
            }

            type DeleteInfo {
              bookmark: String
              nodesDeleted: Int!
              relationshipsDeleted: Int!
            }

            type IDAggregateSelectionNullable {
              longest: ID
              shortest: ID
            }

            type IntAggregateSelectionNullable {
              average: Float
              max: Int
              min: Int
              sum: Int
            }

            type Mutation {
              createTigerJawLevel2Part1s(input: [TigerJawLevel2Part1CreateInput!]!): CreateTigerJawLevel2Part1sMutationResponse!
              createTigerJawLevel2s(input: [TigerJawLevel2CreateInput!]!): CreateTigerJawLevel2sMutationResponse!
              createTigers(input: [TigerCreateInput!]!): CreateTigersMutationResponse!
              deleteTigerJawLevel2Part1s(delete: TigerJawLevel2Part1DeleteInput, where: TigerJawLevel2Part1Where): DeleteInfo!
              deleteTigerJawLevel2s(delete: TigerJawLevel2DeleteInput, where: TigerJawLevel2Where): DeleteInfo!
              deleteTigers(where: TigerWhere): DeleteInfo!
              updateTigerJawLevel2Part1s(connect: TigerJawLevel2Part1ConnectInput, create: TigerJawLevel2Part1RelationInput, delete: TigerJawLevel2Part1DeleteInput, disconnect: TigerJawLevel2Part1DisconnectInput, update: TigerJawLevel2Part1UpdateInput, where: TigerJawLevel2Part1Where): UpdateTigerJawLevel2Part1sMutationResponse!
              updateTigerJawLevel2s(connect: TigerJawLevel2ConnectInput, create: TigerJawLevel2RelationInput, delete: TigerJawLevel2DeleteInput, disconnect: TigerJawLevel2DisconnectInput, update: TigerJawLevel2UpdateInput, where: TigerJawLevel2Where): UpdateTigerJawLevel2sMutationResponse!
              updateTigers(update: TigerUpdateInput, where: TigerWhere): UpdateTigersMutationResponse!
            }

            enum NodeUpdatedType {
              Connected
              Created
              Deleted
              Disconnected
              Updated
            }

            \\"\\"\\"Pagination information (Relay)\\"\\"\\"
            type PageInfo {
              endCursor: String
              hasNextPage: Boolean!
              hasPreviousPage: Boolean!
              startCursor: String
            }

            type Query {
              tigerJawLevel2Part1s(options: TigerJawLevel2Part1Options, where: TigerJawLevel2Part1Where): [TigerJawLevel2Part1!]!
              tigerJawLevel2Part1sAggregate(where: TigerJawLevel2Part1Where): TigerJawLevel2Part1AggregateSelection!
              tigerJawLevel2Part1sCount(where: TigerJawLevel2Part1Where): Int!
              tigerJawLevel2s(options: TigerJawLevel2Options, where: TigerJawLevel2Where): [TigerJawLevel2!]!
              tigerJawLevel2sAggregate(where: TigerJawLevel2Where): TigerJawLevel2AggregateSelection!
              tigerJawLevel2sCount(where: TigerJawLevel2Where): Int!
              tigers(options: TigerOptions, where: TigerWhere): [Tiger!]!
              tigersAggregate(where: TigerWhere): TigerAggregateSelection!
              tigersCount(where: TigerWhere): Int!
            }

            enum SortDirection {
              \\"\\"\\"Sort by field values in ascending order.\\"\\"\\"
              ASC
              \\"\\"\\"Sort by field values in descending order.\\"\\"\\"
              DESC
            }

            type Subscription {
              \\"\\"\\"Subscribe to updates from Tiger\\"\\"\\"
              subscribeToTiger(filter: SubscriptionFilter, where: TigerWhere): TigerSubscriptionResponse!
              \\"\\"\\"Subscribe to updates from TigerJawLevel2\\"\\"\\"
              subscribeToTigerJawLevel2(filter: SubscriptionFilter, where: TigerJawLevel2Where): TigerJawLevel2SubscriptionResponse!
              \\"\\"\\"Subscribe to updates from TigerJawLevel2Part1\\"\\"\\"
              subscribeToTigerJawLevel2Part1(filter: SubscriptionFilter, where: TigerJawLevel2Part1Where): TigerJawLevel2Part1SubscriptionResponse!
            }

            input SubscriptionFilter {
              handle: String
              handle_IN: [String!]
              handle_NOT: String
              handle_NOT_IN: [String!]
              handle_UNDEFINED: Boolean
              id: Int
              id_IN: [Int!]
              id_NOT: Int
              id_NOT_IN: [Int!]
              id_UNDEFINED: Boolean
              propsUpdated: [String!]
              relationshipID: Int
              relationshipID_IN: [Int!]
              relationshipID_NOT: Int
              relationshipID_NOT_IN: [Int!]
              relationshipID_UNDEFINED: Boolean
              relationshipName: String
              relationshipName_IN: [String!]
              relationshipName_NOT: String
              relationshipName_NOT_IN: [String!]
              relationshipName_UNDEFINED: Boolean
              toID: Int
              toID_IN: [Int!]
              toID_NOT: Int
              toID_NOT_IN: [Int!]
              toID_UNDEFINED: Boolean
              toName: String
              toName_IN: [String!]
              toName_NOT: String
              toName_NOT_IN: [String!]
              toName_UNDEFINED: Boolean
              type: NodeUpdatedType
              type_IN: [NodeUpdatedType!]
              type_NOT: NodeUpdatedType
              type_NOT_IN: [NodeUpdatedType!]
              type_UNDEFINED: Boolean
            }

            type Tiger {
              x: Int
            }

            type TigerAggregateSelection {
              count: Int!
              x: IntAggregateSelectionNullable!
            }

            input TigerConnectWhere {
              node: TigerWhere!
            }

            input TigerCreateInput {
              x: Int
            }

            type TigerJawLevel2 {
              id: ID
              part1(options: TigerJawLevel2Part1Options, where: TigerJawLevel2Part1Where): TigerJawLevel2Part1
              part1Aggregate(where: TigerJawLevel2Part1Where): TigerJawLevel2TigerJawLevel2Part1Part1AggregationSelection
              part1Connection(after: String, first: Int, sort: [TigerJawLevel2Part1ConnectionSort!], where: TigerJawLevel2Part1ConnectionWhere): TigerJawLevel2Part1Connection!
            }

            type TigerJawLevel2AggregateSelection {
              count: Int!
              id: IDAggregateSelectionNullable!
            }

            input TigerJawLevel2ConnectInput {
              part1: TigerJawLevel2Part1ConnectFieldInput
            }

            input TigerJawLevel2CreateInput {
              id: ID
              part1: TigerJawLevel2Part1FieldInput
            }

            input TigerJawLevel2DeleteInput {
              part1: TigerJawLevel2Part1DeleteFieldInput
            }

            input TigerJawLevel2DisconnectInput {
              part1: TigerJawLevel2Part1DisconnectFieldInput
            }

            input TigerJawLevel2Options {
              limit: Int
              offset: Int
              \\"\\"\\"Specify one or more TigerJawLevel2Sort objects to sort TigerJawLevel2s by. The sorts will be applied in the order in which they are arranged in the array.\\"\\"\\"
              sort: [TigerJawLevel2Sort]
            }

            type TigerJawLevel2Part1 {
              id: ID
              tiger(options: TigerOptions, where: TigerWhere): Tiger
              tigerAggregate(where: TigerWhere): TigerJawLevel2Part1TigerTigerAggregationSelection
              tigerConnection(after: String, first: Int, sort: [TigerJawLevel2Part1TigerConnectionSort!], where: TigerJawLevel2Part1TigerConnectionWhere): TigerJawLevel2Part1TigerConnection!
            }

            input TigerJawLevel2Part1AggregateInput {
              AND: [TigerJawLevel2Part1AggregateInput!]
              OR: [TigerJawLevel2Part1AggregateInput!]
              count: Int
              count_GT: Int
              count_GTE: Int
              count_LT: Int
              count_LTE: Int
              node: TigerJawLevel2Part1NodeAggregationWhereInput
            }

            type TigerJawLevel2Part1AggregateSelection {
              count: Int!
              id: IDAggregateSelectionNullable!
            }

            input TigerJawLevel2Part1ConnectFieldInput {
              connect: TigerJawLevel2Part1ConnectInput
              where: TigerJawLevel2Part1ConnectWhere
            }

            input TigerJawLevel2Part1ConnectInput {
              tiger: TigerJawLevel2Part1TigerConnectFieldInput
            }

            input TigerJawLevel2Part1ConnectWhere {
              node: TigerJawLevel2Part1Where!
            }

            type TigerJawLevel2Part1Connection {
              edges: [TigerJawLevel2Part1Relationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input TigerJawLevel2Part1ConnectionSort {
              node: TigerJawLevel2Part1Sort
            }

            input TigerJawLevel2Part1ConnectionWhere {
              AND: [TigerJawLevel2Part1ConnectionWhere!]
              OR: [TigerJawLevel2Part1ConnectionWhere!]
              node: TigerJawLevel2Part1Where
              node_NOT: TigerJawLevel2Part1Where
            }

            input TigerJawLevel2Part1CreateFieldInput {
              node: TigerJawLevel2Part1CreateInput!
            }

            input TigerJawLevel2Part1CreateInput {
              id: ID
              tiger: TigerJawLevel2Part1TigerFieldInput
            }

            input TigerJawLevel2Part1DeleteFieldInput {
              delete: TigerJawLevel2Part1DeleteInput
              where: TigerJawLevel2Part1ConnectionWhere
            }

            input TigerJawLevel2Part1DeleteInput {
              tiger: TigerJawLevel2Part1TigerDeleteFieldInput
            }

            input TigerJawLevel2Part1DisconnectFieldInput {
              disconnect: TigerJawLevel2Part1DisconnectInput
              where: TigerJawLevel2Part1ConnectionWhere
            }

            input TigerJawLevel2Part1DisconnectInput {
              tiger: TigerJawLevel2Part1TigerDisconnectFieldInput
            }

            input TigerJawLevel2Part1FieldInput {
              connect: TigerJawLevel2Part1ConnectFieldInput
              create: TigerJawLevel2Part1CreateFieldInput
            }

            input TigerJawLevel2Part1NodeAggregationWhereInput {
              AND: [TigerJawLevel2Part1NodeAggregationWhereInput!]
              OR: [TigerJawLevel2Part1NodeAggregationWhereInput!]
              id_EQUAL: ID
            }

            input TigerJawLevel2Part1Options {
              limit: Int
              offset: Int
              \\"\\"\\"Specify one or more TigerJawLevel2Part1Sort objects to sort TigerJawLevel2Part1s by. The sorts will be applied in the order in which they are arranged in the array.\\"\\"\\"
              sort: [TigerJawLevel2Part1Sort]
            }

            input TigerJawLevel2Part1RelationInput {
              tiger: TigerJawLevel2Part1TigerCreateFieldInput
            }

            type TigerJawLevel2Part1Relationship {
              cursor: String!
              node: TigerJawLevel2Part1!
            }

            \\"\\"\\"Fields to sort TigerJawLevel2Part1s by. The order in which sorts are applied is not guaranteed when specifying many fields in one TigerJawLevel2Part1Sort object.\\"\\"\\"
            input TigerJawLevel2Part1Sort {
              id: SortDirection
            }

            type TigerJawLevel2Part1SubscriptionResponse {
              id: Int!
              name: String!
              propsUpdated: [String!]
              relationshipID: String
              relationshipName: String
              tigerjawlevel2part1: TigerJawLevel2Part1
              toID: String
              toName: String
              type: String!
            }

            input TigerJawLevel2Part1TigerAggregateInput {
              AND: [TigerJawLevel2Part1TigerAggregateInput!]
              OR: [TigerJawLevel2Part1TigerAggregateInput!]
              count: Int
              count_GT: Int
              count_GTE: Int
              count_LT: Int
              count_LTE: Int
              node: TigerJawLevel2Part1TigerNodeAggregationWhereInput
            }

            input TigerJawLevel2Part1TigerConnectFieldInput {
              where: TigerConnectWhere
            }

            type TigerJawLevel2Part1TigerConnection {
              edges: [TigerJawLevel2Part1TigerRelationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input TigerJawLevel2Part1TigerConnectionSort {
              node: TigerSort
            }

            input TigerJawLevel2Part1TigerConnectionWhere {
              AND: [TigerJawLevel2Part1TigerConnectionWhere!]
              OR: [TigerJawLevel2Part1TigerConnectionWhere!]
              node: TigerWhere
              node_NOT: TigerWhere
            }

            input TigerJawLevel2Part1TigerCreateFieldInput {
              node: TigerCreateInput!
            }

            input TigerJawLevel2Part1TigerDeleteFieldInput {
              where: TigerJawLevel2Part1TigerConnectionWhere
            }

            input TigerJawLevel2Part1TigerDisconnectFieldInput {
              where: TigerJawLevel2Part1TigerConnectionWhere
            }

            input TigerJawLevel2Part1TigerFieldInput {
              connect: TigerJawLevel2Part1TigerConnectFieldInput
              create: TigerJawLevel2Part1TigerCreateFieldInput
            }

            input TigerJawLevel2Part1TigerNodeAggregationWhereInput {
              AND: [TigerJawLevel2Part1TigerNodeAggregationWhereInput!]
              OR: [TigerJawLevel2Part1TigerNodeAggregationWhereInput!]
              x_AVERAGE_EQUAL: Float
              x_AVERAGE_GT: Float
              x_AVERAGE_GTE: Float
              x_AVERAGE_LT: Float
              x_AVERAGE_LTE: Float
              x_EQUAL: Int
              x_GT: Int
              x_GTE: Int
              x_LT: Int
              x_LTE: Int
              x_MAX_EQUAL: Int
              x_MAX_GT: Int
              x_MAX_GTE: Int
              x_MAX_LT: Int
              x_MAX_LTE: Int
              x_MIN_EQUAL: Int
              x_MIN_GT: Int
              x_MIN_GTE: Int
              x_MIN_LT: Int
              x_MIN_LTE: Int
              x_SUM_EQUAL: Int
              x_SUM_GT: Int
              x_SUM_GTE: Int
              x_SUM_LT: Int
              x_SUM_LTE: Int
            }

            type TigerJawLevel2Part1TigerRelationship {
              cursor: String!
              node: Tiger!
            }

            type TigerJawLevel2Part1TigerTigerAggregationSelection {
              count: Int!
              node: TigerJawLevel2Part1TigerTigerNodeAggregateSelection
            }

            type TigerJawLevel2Part1TigerTigerNodeAggregateSelection {
              x: IntAggregateSelectionNullable!
            }

            input TigerJawLevel2Part1TigerUpdateConnectionInput {
              node: TigerUpdateInput
            }

            input TigerJawLevel2Part1TigerUpdateFieldInput {
              connect: TigerJawLevel2Part1TigerConnectFieldInput
              create: TigerJawLevel2Part1TigerCreateFieldInput
              delete: TigerJawLevel2Part1TigerDeleteFieldInput
              disconnect: TigerJawLevel2Part1TigerDisconnectFieldInput
              update: TigerJawLevel2Part1TigerUpdateConnectionInput
              where: TigerJawLevel2Part1TigerConnectionWhere
            }

            input TigerJawLevel2Part1UpdateConnectionInput {
              node: TigerJawLevel2Part1UpdateInput
            }

            input TigerJawLevel2Part1UpdateFieldInput {
              connect: TigerJawLevel2Part1ConnectFieldInput
              create: TigerJawLevel2Part1CreateFieldInput
              delete: TigerJawLevel2Part1DeleteFieldInput
              disconnect: TigerJawLevel2Part1DisconnectFieldInput
              update: TigerJawLevel2Part1UpdateConnectionInput
              where: TigerJawLevel2Part1ConnectionWhere
            }

            input TigerJawLevel2Part1UpdateInput {
              id: ID
              tiger: TigerJawLevel2Part1TigerUpdateFieldInput
            }

            input TigerJawLevel2Part1Where {
              AND: [TigerJawLevel2Part1Where!]
              OR: [TigerJawLevel2Part1Where!]
              id: ID
              id_CONTAINS: ID
              id_ENDS_WITH: ID
              id_IN: [ID]
              id_NOT: ID
              id_NOT_CONTAINS: ID
              id_NOT_ENDS_WITH: ID
              id_NOT_IN: [ID]
              id_NOT_STARTS_WITH: ID
              id_STARTS_WITH: ID
              tiger: TigerWhere
              tigerAggregate: TigerJawLevel2Part1TigerAggregateInput
              tigerConnection: TigerJawLevel2Part1TigerConnectionWhere
              tigerConnection_NOT: TigerJawLevel2Part1TigerConnectionWhere
              tiger_NOT: TigerWhere
            }

            input TigerJawLevel2RelationInput {
              part1: TigerJawLevel2Part1CreateFieldInput
            }

            \\"\\"\\"Fields to sort TigerJawLevel2s by. The order in which sorts are applied is not guaranteed when specifying many fields in one TigerJawLevel2Sort object.\\"\\"\\"
            input TigerJawLevel2Sort {
              id: SortDirection
            }

            type TigerJawLevel2SubscriptionResponse {
              id: Int!
              name: String!
              propsUpdated: [String!]
              relationshipID: String
              relationshipName: String
              tigerjawlevel2: TigerJawLevel2
              toID: String
              toName: String
              type: String!
            }

            type TigerJawLevel2TigerJawLevel2Part1Part1AggregationSelection {
              count: Int!
              node: TigerJawLevel2TigerJawLevel2Part1Part1NodeAggregateSelection
            }

            type TigerJawLevel2TigerJawLevel2Part1Part1NodeAggregateSelection {
              id: IDAggregateSelectionNullable!
            }

            input TigerJawLevel2UpdateInput {
              id: ID
              part1: TigerJawLevel2Part1UpdateFieldInput
            }

            input TigerJawLevel2Where {
              AND: [TigerJawLevel2Where!]
              OR: [TigerJawLevel2Where!]
              id: ID
              id_CONTAINS: ID
              id_ENDS_WITH: ID
              id_IN: [ID]
              id_NOT: ID
              id_NOT_CONTAINS: ID
              id_NOT_ENDS_WITH: ID
              id_NOT_IN: [ID]
              id_NOT_STARTS_WITH: ID
              id_STARTS_WITH: ID
              part1: TigerJawLevel2Part1Where
              part1Aggregate: TigerJawLevel2Part1AggregateInput
              part1Connection: TigerJawLevel2Part1ConnectionWhere
              part1Connection_NOT: TigerJawLevel2Part1ConnectionWhere
              part1_NOT: TigerJawLevel2Part1Where
            }

            input TigerOptions {
              limit: Int
              offset: Int
              \\"\\"\\"Specify one or more TigerSort objects to sort Tigers by. The sorts will be applied in the order in which they are arranged in the array.\\"\\"\\"
              sort: [TigerSort]
            }

            \\"\\"\\"Fields to sort Tigers by. The order in which sorts are applied is not guaranteed when specifying many fields in one TigerSort object.\\"\\"\\"
            input TigerSort {
              x: SortDirection
            }

            type TigerSubscriptionResponse {
              id: Int!
              name: String!
              propsUpdated: [String!]
              relationshipID: String
              relationshipName: String
              tiger: Tiger
              toID: String
              toName: String
              type: String!
            }

            input TigerUpdateInput {
              x: Int
            }

            input TigerWhere {
              AND: [TigerWhere!]
              OR: [TigerWhere!]
              x: Int
              x_GT: Int
              x_GTE: Int
              x_IN: [Int]
              x_LT: Int
              x_LTE: Int
              x_NOT: Int
              x_NOT_IN: [Int]
            }

            type UpdateInfo {
              bookmark: String
              nodesCreated: Int!
              nodesDeleted: Int!
              relationshipsCreated: Int!
              relationshipsDeleted: Int!
            }

            type UpdateTigerJawLevel2Part1sMutationResponse {
              info: UpdateInfo!
              tigerJawLevel2Part1s: [TigerJawLevel2Part1!]!
            }

            type UpdateTigerJawLevel2sMutationResponse {
              info: UpdateInfo!
              tigerJawLevel2s: [TigerJawLevel2!]!
            }

            type UpdateTigersMutationResponse {
              info: UpdateInfo!
              tigers: [Tiger!]!
            }
            "
        `);
    });
});
