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

describe("Sort", () => {
    test("sort argument is not present when nothing to sort", async () => {
        const typeDefs = gql`
            type Node1 @node {
                property: String!
                relatedTo: [Node2!]! @relationship(type: "RELATED_TO", direction: OUT)
            }

            type Node2 @node {
                relatedTo: [Node1!]! @relationship(type: "RELATED_TO", direction: OUT)
            }
        `;
        const neoSchema = new Neo4jGraphQL({ typeDefs });
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
              bookmark: String @deprecated(reason: \\"This field has been deprecated because bookmarks are now handled by the driver.\\")
              nodesCreated: Int!
              relationshipsCreated: Int!
            }

            type CreateNode1sMutationResponse {
              info: CreateInfo!
              node1s: [Node1!]!
            }

            type CreateNode2sMutationResponse {
              info: CreateInfo!
              node2s: [Node2!]!
            }

            \\"\\"\\"
            Information about the number of nodes and relationships deleted during a delete mutation
            \\"\\"\\"
            type DeleteInfo {
              bookmark: String @deprecated(reason: \\"This field has been deprecated because bookmarks are now handled by the driver.\\")
              nodesDeleted: Int!
              relationshipsDeleted: Int!
            }

            type Mutation {
              createNode1s(input: [Node1CreateInput!]!): CreateNode1sMutationResponse!
              createNode2s(input: [Node2CreateInput!]!): CreateNode2sMutationResponse!
              deleteNode1s(delete: Node1DeleteInput, where: Node1Where): DeleteInfo!
              deleteNode2s(delete: Node2DeleteInput, where: Node2Where): DeleteInfo!
              updateNode1s(connect: Node1ConnectInput @deprecated(reason: \\"Top level connect input argument in update is deprecated. Use the nested connect field in the relationship within the update argument\\"), create: Node1RelationInput @deprecated(reason: \\"Top level create input argument in update is deprecated. Use the nested create field in the relationship within the update argument\\"), delete: Node1DeleteInput @deprecated(reason: \\"Top level delete input argument in update is deprecated. Use the nested delete field in the relationship within the update argument\\"), disconnect: Node1DisconnectInput @deprecated(reason: \\"Top level disconnect input argument in update is deprecated. Use the nested disconnect field in the relationship within the update argument\\"), update: Node1UpdateInput, where: Node1Where): UpdateNode1sMutationResponse!
              updateNode2s(connect: Node2ConnectInput @deprecated(reason: \\"Top level connect input argument in update is deprecated. Use the nested connect field in the relationship within the update argument\\"), create: Node2RelationInput @deprecated(reason: \\"Top level create input argument in update is deprecated. Use the nested create field in the relationship within the update argument\\"), delete: Node2DeleteInput @deprecated(reason: \\"Top level delete input argument in update is deprecated. Use the nested delete field in the relationship within the update argument\\"), disconnect: Node2DisconnectInput @deprecated(reason: \\"Top level disconnect input argument in update is deprecated. Use the nested disconnect field in the relationship within the update argument\\"), update: Node2UpdateInput, where: Node2Where): UpdateNode2sMutationResponse!
            }

            type Node1 {
              property: String!
              relatedTo(directed: Boolean = true, limit: Int, offset: Int, options: Node2Options @deprecated(reason: \\"Query options argument is deprecated, please use pagination arguments like limit, offset and sort instead.\\"), where: Node2Where): [Node2!]!
              relatedToAggregate(directed: Boolean = true, where: Node2Where): Node1Node2RelatedToAggregationSelection
              relatedToConnection(after: String, directed: Boolean = true, first: Int, where: Node1RelatedToConnectionWhere): Node1RelatedToConnection!
            }

            type Node1AggregateSelection {
              count: Int!
              property: StringAggregateSelection!
            }

            input Node1ConnectInput {
              relatedTo: [Node1RelatedToConnectFieldInput!]
            }

            input Node1ConnectWhere {
              node: Node1Where!
            }

            input Node1CreateInput {
              property: String!
              relatedTo: Node1RelatedToFieldInput
            }

            input Node1DeleteInput {
              relatedTo: [Node1RelatedToDeleteFieldInput!]
            }

            input Node1DisconnectInput {
              relatedTo: [Node1RelatedToDisconnectFieldInput!]
            }

            type Node1Edge {
              cursor: String!
              node: Node1!
            }

            type Node1Node2RelatedToAggregationSelection {
              count: Int!
            }

            input Node1Options {
              limit: Int
              offset: Int
              \\"\\"\\"
              Specify one or more Node1Sort objects to sort Node1s by. The sorts will be applied in the order in which they are arranged in the array.
              \\"\\"\\"
              sort: [Node1Sort!]
            }

            input Node1RelatedToAggregateInput {
              AND: [Node1RelatedToAggregateInput!]
              NOT: Node1RelatedToAggregateInput
              OR: [Node1RelatedToAggregateInput!]
              count: Int
              count_GT: Int
              count_GTE: Int
              count_LT: Int
              count_LTE: Int
            }

            input Node1RelatedToConnectFieldInput {
              connect: [Node2ConnectInput!]
              \\"\\"\\"
              Whether or not to overwrite any matching relationship with the new properties.
              \\"\\"\\"
              overwrite: Boolean! = true
              where: Node2ConnectWhere
            }

            type Node1RelatedToConnection {
              edges: [Node1RelatedToRelationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input Node1RelatedToConnectionWhere {
              AND: [Node1RelatedToConnectionWhere!]
              NOT: Node1RelatedToConnectionWhere
              OR: [Node1RelatedToConnectionWhere!]
              node: Node2Where
            }

            input Node1RelatedToCreateFieldInput {
              node: Node2CreateInput!
            }

            input Node1RelatedToDeleteFieldInput {
              delete: Node2DeleteInput
              where: Node1RelatedToConnectionWhere
            }

            input Node1RelatedToDisconnectFieldInput {
              disconnect: Node2DisconnectInput
              where: Node1RelatedToConnectionWhere
            }

            input Node1RelatedToFieldInput {
              connect: [Node1RelatedToConnectFieldInput!]
              create: [Node1RelatedToCreateFieldInput!]
            }

            type Node1RelatedToRelationship {
              cursor: String!
              node: Node2!
            }

            input Node1RelatedToUpdateConnectionInput {
              node: Node2UpdateInput
            }

            input Node1RelatedToUpdateFieldInput {
              connect: [Node1RelatedToConnectFieldInput!]
              create: [Node1RelatedToCreateFieldInput!]
              delete: [Node1RelatedToDeleteFieldInput!]
              disconnect: [Node1RelatedToDisconnectFieldInput!]
              update: Node1RelatedToUpdateConnectionInput
              where: Node1RelatedToConnectionWhere
            }

            input Node1RelationInput {
              relatedTo: [Node1RelatedToCreateFieldInput!]
            }

            \\"\\"\\"
            Fields to sort Node1s by. The order in which sorts are applied is not guaranteed when specifying many fields in one Node1Sort object.
            \\"\\"\\"
            input Node1Sort {
              property: SortDirection
            }

            input Node1UpdateInput {
              property: String
              relatedTo: [Node1RelatedToUpdateFieldInput!]
            }

            input Node1Where {
              AND: [Node1Where!]
              NOT: Node1Where
              OR: [Node1Where!]
              property: String @deprecated(reason: \\"Please use the explicit _EQ version\\")
              property_CONTAINS: String
              property_ENDS_WITH: String
              property_EQ: String
              property_IN: [String!]
              property_STARTS_WITH: String
              relatedToAggregate: Node1RelatedToAggregateInput
              \\"\\"\\"
              Return Node1s where all of the related Node1RelatedToConnections match this filter
              \\"\\"\\"
              relatedToConnection_ALL: Node1RelatedToConnectionWhere
              \\"\\"\\"
              Return Node1s where none of the related Node1RelatedToConnections match this filter
              \\"\\"\\"
              relatedToConnection_NONE: Node1RelatedToConnectionWhere
              \\"\\"\\"
              Return Node1s where one of the related Node1RelatedToConnections match this filter
              \\"\\"\\"
              relatedToConnection_SINGLE: Node1RelatedToConnectionWhere
              \\"\\"\\"
              Return Node1s where some of the related Node1RelatedToConnections match this filter
              \\"\\"\\"
              relatedToConnection_SOME: Node1RelatedToConnectionWhere
              \\"\\"\\"Return Node1s where all of the related Node2s match this filter\\"\\"\\"
              relatedTo_ALL: Node2Where
              \\"\\"\\"Return Node1s where none of the related Node2s match this filter\\"\\"\\"
              relatedTo_NONE: Node2Where
              \\"\\"\\"Return Node1s where one of the related Node2s match this filter\\"\\"\\"
              relatedTo_SINGLE: Node2Where
              \\"\\"\\"Return Node1s where some of the related Node2s match this filter\\"\\"\\"
              relatedTo_SOME: Node2Where
            }

            type Node1sConnection {
              edges: [Node1Edge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            type Node2 {
              relatedTo(directed: Boolean = true, limit: Int, offset: Int, options: Node1Options @deprecated(reason: \\"Query options argument is deprecated, please use pagination arguments like limit, offset and sort instead.\\"), sort: [Node1Sort!], where: Node1Where): [Node1!]!
              relatedToAggregate(directed: Boolean = true, where: Node1Where): Node2Node1RelatedToAggregationSelection
              relatedToConnection(after: String, directed: Boolean = true, first: Int, sort: [Node2RelatedToConnectionSort!], where: Node2RelatedToConnectionWhere): Node2RelatedToConnection!
            }

            type Node2AggregateSelection {
              count: Int!
            }

            input Node2ConnectInput {
              relatedTo: [Node2RelatedToConnectFieldInput!]
            }

            input Node2ConnectWhere {
              node: Node2Where!
            }

            input Node2CreateInput {
              relatedTo: Node2RelatedToFieldInput
            }

            input Node2DeleteInput {
              relatedTo: [Node2RelatedToDeleteFieldInput!]
            }

            input Node2DisconnectInput {
              relatedTo: [Node2RelatedToDisconnectFieldInput!]
            }

            type Node2Edge {
              cursor: String!
              node: Node2!
            }

            type Node2Node1RelatedToAggregationSelection {
              count: Int!
              node: Node2Node1RelatedToNodeAggregateSelection
            }

            type Node2Node1RelatedToNodeAggregateSelection {
              property: StringAggregateSelection!
            }

            input Node2Options {
              limit: Int
              offset: Int
            }

            input Node2RelatedToAggregateInput {
              AND: [Node2RelatedToAggregateInput!]
              NOT: Node2RelatedToAggregateInput
              OR: [Node2RelatedToAggregateInput!]
              count: Int
              count_GT: Int
              count_GTE: Int
              count_LT: Int
              count_LTE: Int
              node: Node2RelatedToNodeAggregationWhereInput
            }

            input Node2RelatedToConnectFieldInput {
              connect: [Node1ConnectInput!]
              \\"\\"\\"
              Whether or not to overwrite any matching relationship with the new properties.
              \\"\\"\\"
              overwrite: Boolean! = true
              where: Node1ConnectWhere
            }

            type Node2RelatedToConnection {
              edges: [Node2RelatedToRelationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input Node2RelatedToConnectionSort {
              node: Node1Sort
            }

            input Node2RelatedToConnectionWhere {
              AND: [Node2RelatedToConnectionWhere!]
              NOT: Node2RelatedToConnectionWhere
              OR: [Node2RelatedToConnectionWhere!]
              node: Node1Where
            }

            input Node2RelatedToCreateFieldInput {
              node: Node1CreateInput!
            }

            input Node2RelatedToDeleteFieldInput {
              delete: Node1DeleteInput
              where: Node2RelatedToConnectionWhere
            }

            input Node2RelatedToDisconnectFieldInput {
              disconnect: Node1DisconnectInput
              where: Node2RelatedToConnectionWhere
            }

            input Node2RelatedToFieldInput {
              connect: [Node2RelatedToConnectFieldInput!]
              create: [Node2RelatedToCreateFieldInput!]
            }

            input Node2RelatedToNodeAggregationWhereInput {
              AND: [Node2RelatedToNodeAggregationWhereInput!]
              NOT: Node2RelatedToNodeAggregationWhereInput
              OR: [Node2RelatedToNodeAggregationWhereInput!]
              property_AVERAGE_EQUAL: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              property_AVERAGE_GT: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              property_AVERAGE_GTE: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              property_AVERAGE_LENGTH_EQUAL: Float
              property_AVERAGE_LENGTH_GT: Float
              property_AVERAGE_LENGTH_GTE: Float
              property_AVERAGE_LENGTH_LT: Float
              property_AVERAGE_LENGTH_LTE: Float
              property_AVERAGE_LT: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              property_AVERAGE_LTE: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              property_EQUAL: String @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              property_GT: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              property_GTE: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              property_LONGEST_EQUAL: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              property_LONGEST_GT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              property_LONGEST_GTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              property_LONGEST_LENGTH_EQUAL: Int
              property_LONGEST_LENGTH_GT: Int
              property_LONGEST_LENGTH_GTE: Int
              property_LONGEST_LENGTH_LT: Int
              property_LONGEST_LENGTH_LTE: Int
              property_LONGEST_LT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              property_LONGEST_LTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              property_LT: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              property_LTE: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              property_SHORTEST_EQUAL: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              property_SHORTEST_GT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              property_SHORTEST_GTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              property_SHORTEST_LENGTH_EQUAL: Int
              property_SHORTEST_LENGTH_GT: Int
              property_SHORTEST_LENGTH_GTE: Int
              property_SHORTEST_LENGTH_LT: Int
              property_SHORTEST_LENGTH_LTE: Int
              property_SHORTEST_LT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              property_SHORTEST_LTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
            }

            type Node2RelatedToRelationship {
              cursor: String!
              node: Node1!
            }

            input Node2RelatedToUpdateConnectionInput {
              node: Node1UpdateInput
            }

            input Node2RelatedToUpdateFieldInput {
              connect: [Node2RelatedToConnectFieldInput!]
              create: [Node2RelatedToCreateFieldInput!]
              delete: [Node2RelatedToDeleteFieldInput!]
              disconnect: [Node2RelatedToDisconnectFieldInput!]
              update: Node2RelatedToUpdateConnectionInput
              where: Node2RelatedToConnectionWhere
            }

            input Node2RelationInput {
              relatedTo: [Node2RelatedToCreateFieldInput!]
            }

            input Node2UpdateInput {
              relatedTo: [Node2RelatedToUpdateFieldInput!]
            }

            input Node2Where {
              AND: [Node2Where!]
              NOT: Node2Where
              OR: [Node2Where!]
              relatedToAggregate: Node2RelatedToAggregateInput
              \\"\\"\\"
              Return Node2s where all of the related Node2RelatedToConnections match this filter
              \\"\\"\\"
              relatedToConnection_ALL: Node2RelatedToConnectionWhere
              \\"\\"\\"
              Return Node2s where none of the related Node2RelatedToConnections match this filter
              \\"\\"\\"
              relatedToConnection_NONE: Node2RelatedToConnectionWhere
              \\"\\"\\"
              Return Node2s where one of the related Node2RelatedToConnections match this filter
              \\"\\"\\"
              relatedToConnection_SINGLE: Node2RelatedToConnectionWhere
              \\"\\"\\"
              Return Node2s where some of the related Node2RelatedToConnections match this filter
              \\"\\"\\"
              relatedToConnection_SOME: Node2RelatedToConnectionWhere
              \\"\\"\\"Return Node2s where all of the related Node1s match this filter\\"\\"\\"
              relatedTo_ALL: Node1Where
              \\"\\"\\"Return Node2s where none of the related Node1s match this filter\\"\\"\\"
              relatedTo_NONE: Node1Where
              \\"\\"\\"Return Node2s where one of the related Node1s match this filter\\"\\"\\"
              relatedTo_SINGLE: Node1Where
              \\"\\"\\"Return Node2s where some of the related Node1s match this filter\\"\\"\\"
              relatedTo_SOME: Node1Where
            }

            type Node2sConnection {
              edges: [Node2Edge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            \\"\\"\\"Pagination information (Relay)\\"\\"\\"
            type PageInfo {
              endCursor: String
              hasNextPage: Boolean!
              hasPreviousPage: Boolean!
              startCursor: String
            }

            type Query {
              node1s(limit: Int, offset: Int, options: Node1Options @deprecated(reason: \\"Query options argument is deprecated, please use pagination arguments like limit, offset and sort instead.\\"), sort: [Node1Sort!], where: Node1Where): [Node1!]!
              node1sAggregate(where: Node1Where): Node1AggregateSelection!
              node1sConnection(after: String, first: Int, sort: [Node1Sort!], where: Node1Where): Node1sConnection!
              node2s(limit: Int, offset: Int, options: Node2Options @deprecated(reason: \\"Query options argument is deprecated, please use pagination arguments like limit, offset and sort instead.\\"), where: Node2Where): [Node2!]!
              node2sAggregate(where: Node2Where): Node2AggregateSelection!
              node2sConnection(after: String, first: Int, where: Node2Where): Node2sConnection!
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

            \\"\\"\\"
            Information about the number of nodes and relationships created and deleted during an update mutation
            \\"\\"\\"
            type UpdateInfo {
              bookmark: String @deprecated(reason: \\"This field has been deprecated because bookmarks are now handled by the driver.\\")
              nodesCreated: Int!
              nodesDeleted: Int!
              relationshipsCreated: Int!
              relationshipsDeleted: Int!
            }

            type UpdateNode1sMutationResponse {
              info: UpdateInfo!
              node1s: [Node1!]!
            }

            type UpdateNode2sMutationResponse {
              info: UpdateInfo!
              node2s: [Node2!]!
            }"
        `);
    });
});
