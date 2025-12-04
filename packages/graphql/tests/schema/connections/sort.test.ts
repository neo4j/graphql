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
              createNode1s(input: [Node1CreateInput!]!): CreateNode1sMutationResponse!
              createNode2s(input: [Node2CreateInput!]!): CreateNode2sMutationResponse!
              deleteNode1s(delete: Node1DeleteInput, where: Node1Where): DeleteInfo!
              deleteNode2s(delete: Node2DeleteInput, where: Node2Where): DeleteInfo!
              updateNode1s(update: Node1UpdateInput, where: Node1Where): UpdateNode1sMutationResponse!
              updateNode2s(update: Node2UpdateInput, where: Node2Where): UpdateNode2sMutationResponse!
            }

            type Node1 {
              property: String!
              relatedTo(limit: Int, offset: Int, where: Node2Where): [Node2!]!
              relatedToConnection(after: String, first: Int, where: Node1RelatedToConnectionWhere): Node1RelatedToConnection!
            }

            type Node1Aggregate {
              count: Count!
              node: Node1AggregateNode!
            }

            type Node1AggregateNode {
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

            type Node1Node2RelatedToAggregateSelection {
              count: CountConnection!
            }

            input Node1RelatedToAggregateInput {
              AND: [Node1RelatedToAggregateInput!]
              NOT: Node1RelatedToAggregateInput
              OR: [Node1RelatedToAggregateInput!]
              count: IntScalarFilters
              count_EQ: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { eq: ... } } }' instead.\\")
              count_GT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gt: ... } } }' instead.\\")
              count_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gte: ... } } }' instead.\\")
              count_LT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lt: ... } } }' instead.\\")
              count_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lte: ... } } }' instead.\\")
            }

            input Node1RelatedToConnectFieldInput {
              connect: [Node2ConnectInput!]
              where: Node2ConnectWhere
            }

            type Node1RelatedToConnection {
              aggregate: Node1Node2RelatedToAggregateSelection!
              edges: [Node1RelatedToRelationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input Node1RelatedToConnectionAggregateInput {
              AND: [Node1RelatedToConnectionAggregateInput!]
              NOT: Node1RelatedToConnectionAggregateInput
              OR: [Node1RelatedToConnectionAggregateInput!]
              count: ConnectionAggregationCountFilterInput
            }

            input Node1RelatedToConnectionFilters {
              \\"\\"\\"
              Filter Node1s by aggregating results on related Node1RelatedToConnections
              \\"\\"\\"
              aggregate: Node1RelatedToConnectionAggregateInput
              \\"\\"\\"
              Return Node1s where all of the related Node1RelatedToConnections match this filter
              \\"\\"\\"
              all: Node1RelatedToConnectionWhere
              \\"\\"\\"
              Return Node1s where none of the related Node1RelatedToConnections match this filter
              \\"\\"\\"
              none: Node1RelatedToConnectionWhere
              \\"\\"\\"
              Return Node1s where one of the related Node1RelatedToConnections match this filter
              \\"\\"\\"
              single: Node1RelatedToConnectionWhere
              \\"\\"\\"
              Return Node1s where some of the related Node1RelatedToConnections match this filter
              \\"\\"\\"
              some: Node1RelatedToConnectionWhere
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
              where: Node1RelatedToConnectionWhere
            }

            input Node1RelatedToUpdateFieldInput {
              connect: [Node1RelatedToConnectFieldInput!]
              create: [Node1RelatedToCreateFieldInput!]
              delete: [Node1RelatedToDeleteFieldInput!]
              disconnect: [Node1RelatedToDisconnectFieldInput!]
              update: Node1RelatedToUpdateConnectionInput
            }

            input Node1RelationshipFilters {
              \\"\\"\\"Filter type where all of the related Node1s match this filter\\"\\"\\"
              all: Node1Where
              \\"\\"\\"Filter type where none of the related Node1s match this filter\\"\\"\\"
              none: Node1Where
              \\"\\"\\"Filter type where one of the related Node1s match this filter\\"\\"\\"
              single: Node1Where
              \\"\\"\\"Filter type where some of the related Node1s match this filter\\"\\"\\"
              some: Node1Where
            }

            \\"\\"\\"
            Fields to sort Node1s by. The order in which sorts are applied is not guaranteed when specifying many fields in one Node1Sort object.
            \\"\\"\\"
            input Node1Sort {
              property: SortDirection
            }

            input Node1UpdateInput {
              property: StringScalarMutations
              property_SET: String @deprecated(reason: \\"Please use the generic mutation 'property: { set: ... } }' instead.\\")
              relatedTo: [Node1RelatedToUpdateFieldInput!]
            }

            input Node1Where {
              AND: [Node1Where!]
              NOT: Node1Where
              OR: [Node1Where!]
              property: StringScalarFilters
              property_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter property: { contains: ... }\\")
              property_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter property: { endsWith: ... }\\")
              property_EQ: String @deprecated(reason: \\"Please use the relevant generic filter property: { eq: ... }\\")
              property_IN: [String!] @deprecated(reason: \\"Please use the relevant generic filter property: { in: ... }\\")
              property_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter property: { startsWith: ... }\\")
              relatedTo: Node2RelationshipFilters
              relatedToAggregate: Node1RelatedToAggregateInput @deprecated(reason: \\"Aggregate filters are moved inside the relatedToConnection filter, please use { relatedToConnection: { aggregate: {...} } } instead\\")
              relatedToConnection: Node1RelatedToConnectionFilters
              \\"\\"\\"
              Return Node1s where all of the related Node1RelatedToConnections match this filter
              \\"\\"\\"
              relatedToConnection_ALL: Node1RelatedToConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'relatedToConnection: { all: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Node1s where none of the related Node1RelatedToConnections match this filter
              \\"\\"\\"
              relatedToConnection_NONE: Node1RelatedToConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'relatedToConnection: { none: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Node1s where one of the related Node1RelatedToConnections match this filter
              \\"\\"\\"
              relatedToConnection_SINGLE: Node1RelatedToConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'relatedToConnection: { single: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Node1s where some of the related Node1RelatedToConnections match this filter
              \\"\\"\\"
              relatedToConnection_SOME: Node1RelatedToConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'relatedToConnection: { some: { node: ... } } }' instead.\\")
              \\"\\"\\"Return Node1s where all of the related Node2s match this filter\\"\\"\\"
              relatedTo_ALL: Node2Where @deprecated(reason: \\"Please use the relevant generic filter 'relatedTo: { all: ... }' instead.\\")
              \\"\\"\\"Return Node1s where none of the related Node2s match this filter\\"\\"\\"
              relatedTo_NONE: Node2Where @deprecated(reason: \\"Please use the relevant generic filter 'relatedTo: { none: ... }' instead.\\")
              \\"\\"\\"Return Node1s where one of the related Node2s match this filter\\"\\"\\"
              relatedTo_SINGLE: Node2Where @deprecated(reason: \\"Please use the relevant generic filter 'relatedTo: {  single: ... }' instead.\\")
              \\"\\"\\"Return Node1s where some of the related Node2s match this filter\\"\\"\\"
              relatedTo_SOME: Node2Where @deprecated(reason: \\"Please use the relevant generic filter 'relatedTo: {  some: ... }' instead.\\")
            }

            type Node1sConnection {
              aggregate: Node1Aggregate!
              edges: [Node1Edge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            type Node2 {
              relatedTo(limit: Int, offset: Int, sort: [Node1Sort!], where: Node1Where): [Node1!]!
              relatedToConnection(after: String, first: Int, sort: [Node2RelatedToConnectionSort!], where: Node2RelatedToConnectionWhere): Node2RelatedToConnection!
            }

            type Node2Aggregate {
              count: Count!
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

            type Node2Node1RelatedToAggregateSelection {
              count: CountConnection!
              node: Node2Node1RelatedToNodeAggregateSelection
            }

            type Node2Node1RelatedToNodeAggregateSelection {
              property: StringAggregateSelection!
            }

            input Node2RelatedToAggregateInput {
              AND: [Node2RelatedToAggregateInput!]
              NOT: Node2RelatedToAggregateInput
              OR: [Node2RelatedToAggregateInput!]
              count: IntScalarFilters
              count_EQ: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { eq: ... } } }' instead.\\")
              count_GT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gt: ... } } }' instead.\\")
              count_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gte: ... } } }' instead.\\")
              count_LT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lt: ... } } }' instead.\\")
              count_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lte: ... } } }' instead.\\")
              node: Node2RelatedToNodeAggregationWhereInput
            }

            input Node2RelatedToConnectFieldInput {
              connect: [Node1ConnectInput!]
              where: Node1ConnectWhere
            }

            type Node2RelatedToConnection {
              aggregate: Node2Node1RelatedToAggregateSelection!
              edges: [Node2RelatedToRelationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input Node2RelatedToConnectionAggregateInput {
              AND: [Node2RelatedToConnectionAggregateInput!]
              NOT: Node2RelatedToConnectionAggregateInput
              OR: [Node2RelatedToConnectionAggregateInput!]
              count: ConnectionAggregationCountFilterInput
              node: Node2RelatedToNodeAggregationWhereInput
            }

            input Node2RelatedToConnectionFilters {
              \\"\\"\\"
              Filter Node2s by aggregating results on related Node2RelatedToConnections
              \\"\\"\\"
              aggregate: Node2RelatedToConnectionAggregateInput
              \\"\\"\\"
              Return Node2s where all of the related Node2RelatedToConnections match this filter
              \\"\\"\\"
              all: Node2RelatedToConnectionWhere
              \\"\\"\\"
              Return Node2s where none of the related Node2RelatedToConnections match this filter
              \\"\\"\\"
              none: Node2RelatedToConnectionWhere
              \\"\\"\\"
              Return Node2s where one of the related Node2RelatedToConnections match this filter
              \\"\\"\\"
              single: Node2RelatedToConnectionWhere
              \\"\\"\\"
              Return Node2s where some of the related Node2RelatedToConnections match this filter
              \\"\\"\\"
              some: Node2RelatedToConnectionWhere
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
              property: StringScalarAggregationFilters
              property_AVERAGE_LENGTH_EQUAL: Float @deprecated(reason: \\"Please use the relevant generic filter 'property: { averageLength: { eq: ... } } }' instead.\\")
              property_AVERAGE_LENGTH_GT: Float @deprecated(reason: \\"Please use the relevant generic filter 'property: { averageLength: { gt: ... } } }' instead.\\")
              property_AVERAGE_LENGTH_GTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'property: { averageLength: { gte: ... } } }' instead.\\")
              property_AVERAGE_LENGTH_LT: Float @deprecated(reason: \\"Please use the relevant generic filter 'property: { averageLength: { lt: ... } } }' instead.\\")
              property_AVERAGE_LENGTH_LTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'property: { averageLength: { lte: ... } } }' instead.\\")
              property_LONGEST_LENGTH_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'property: { longestLength: { eq: ... } } }' instead.\\")
              property_LONGEST_LENGTH_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'property: { longestLength: { gt: ... } } }' instead.\\")
              property_LONGEST_LENGTH_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'property: { longestLength: { gte: ... } } }' instead.\\")
              property_LONGEST_LENGTH_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'property: { longestLength: { lt: ... } } }' instead.\\")
              property_LONGEST_LENGTH_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'property: { longestLength: { lte: ... } } }' instead.\\")
              property_SHORTEST_LENGTH_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'property: { shortestLength: { eq: ... } } }' instead.\\")
              property_SHORTEST_LENGTH_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'property: { shortestLength: { gt: ... } } }' instead.\\")
              property_SHORTEST_LENGTH_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'property: { shortestLength: { gte: ... } } }' instead.\\")
              property_SHORTEST_LENGTH_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'property: { shortestLength: { lt: ... } } }' instead.\\")
              property_SHORTEST_LENGTH_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'property: { shortestLength: { lte: ... } } }' instead.\\")
            }

            type Node2RelatedToRelationship {
              cursor: String!
              node: Node1!
            }

            input Node2RelatedToUpdateConnectionInput {
              node: Node1UpdateInput
              where: Node2RelatedToConnectionWhere
            }

            input Node2RelatedToUpdateFieldInput {
              connect: [Node2RelatedToConnectFieldInput!]
              create: [Node2RelatedToCreateFieldInput!]
              delete: [Node2RelatedToDeleteFieldInput!]
              disconnect: [Node2RelatedToDisconnectFieldInput!]
              update: Node2RelatedToUpdateConnectionInput
            }

            input Node2RelationshipFilters {
              \\"\\"\\"Filter type where all of the related Node2s match this filter\\"\\"\\"
              all: Node2Where
              \\"\\"\\"Filter type where none of the related Node2s match this filter\\"\\"\\"
              none: Node2Where
              \\"\\"\\"Filter type where one of the related Node2s match this filter\\"\\"\\"
              single: Node2Where
              \\"\\"\\"Filter type where some of the related Node2s match this filter\\"\\"\\"
              some: Node2Where
            }

            input Node2UpdateInput {
              relatedTo: [Node2RelatedToUpdateFieldInput!]
            }

            input Node2Where {
              AND: [Node2Where!]
              NOT: Node2Where
              OR: [Node2Where!]
              relatedTo: Node1RelationshipFilters
              relatedToAggregate: Node2RelatedToAggregateInput @deprecated(reason: \\"Aggregate filters are moved inside the relatedToConnection filter, please use { relatedToConnection: { aggregate: {...} } } instead\\")
              relatedToConnection: Node2RelatedToConnectionFilters
              \\"\\"\\"
              Return Node2s where all of the related Node2RelatedToConnections match this filter
              \\"\\"\\"
              relatedToConnection_ALL: Node2RelatedToConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'relatedToConnection: { all: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Node2s where none of the related Node2RelatedToConnections match this filter
              \\"\\"\\"
              relatedToConnection_NONE: Node2RelatedToConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'relatedToConnection: { none: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Node2s where one of the related Node2RelatedToConnections match this filter
              \\"\\"\\"
              relatedToConnection_SINGLE: Node2RelatedToConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'relatedToConnection: { single: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Node2s where some of the related Node2RelatedToConnections match this filter
              \\"\\"\\"
              relatedToConnection_SOME: Node2RelatedToConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'relatedToConnection: { some: { node: ... } } }' instead.\\")
              \\"\\"\\"Return Node2s where all of the related Node1s match this filter\\"\\"\\"
              relatedTo_ALL: Node1Where @deprecated(reason: \\"Please use the relevant generic filter 'relatedTo: { all: ... }' instead.\\")
              \\"\\"\\"Return Node2s where none of the related Node1s match this filter\\"\\"\\"
              relatedTo_NONE: Node1Where @deprecated(reason: \\"Please use the relevant generic filter 'relatedTo: { none: ... }' instead.\\")
              \\"\\"\\"Return Node2s where one of the related Node1s match this filter\\"\\"\\"
              relatedTo_SINGLE: Node1Where @deprecated(reason: \\"Please use the relevant generic filter 'relatedTo: {  single: ... }' instead.\\")
              \\"\\"\\"Return Node2s where some of the related Node1s match this filter\\"\\"\\"
              relatedTo_SOME: Node1Where @deprecated(reason: \\"Please use the relevant generic filter 'relatedTo: {  some: ... }' instead.\\")
            }

            type Node2sConnection {
              aggregate: Node2Aggregate!
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
              node1s(limit: Int, offset: Int, sort: [Node1Sort!], where: Node1Where): [Node1!]!
              node1sConnection(after: String, first: Int, sort: [Node1Sort!], where: Node1Where): Node1sConnection!
              node2s(limit: Int, offset: Int, where: Node2Where): [Node2!]!
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
