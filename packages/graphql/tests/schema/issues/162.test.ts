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

describe("162", () => {
    test("2 instances of DeleteInput type created", async () => {
        const typeDefs = gql`
            type Tiger @node {
                x: Int
            }

            type TigerJawLevel2 @node {
                id: ID
                part1: [TigerJawLevel2Part1!]! @relationship(type: "REL1", direction: OUT)
            }

            type TigerJawLevel2Part1 @node {
                id: ID
                tiger: [Tiger!]! @relationship(type: "REL2", direction: OUT)
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

            type Mutation {
              createTigerJawLevel2Part1s(input: [TigerJawLevel2Part1CreateInput!]!): CreateTigerJawLevel2Part1sMutationResponse!
              createTigerJawLevel2s(input: [TigerJawLevel2CreateInput!]!): CreateTigerJawLevel2sMutationResponse!
              createTigers(input: [TigerCreateInput!]!): CreateTigersMutationResponse!
              deleteTigerJawLevel2Part1s(delete: TigerJawLevel2Part1DeleteInput, where: TigerJawLevel2Part1Where): DeleteInfo!
              deleteTigerJawLevel2s(delete: TigerJawLevel2DeleteInput, where: TigerJawLevel2Where): DeleteInfo!
              deleteTigers(where: TigerWhere): DeleteInfo!
              updateTigerJawLevel2Part1s(update: TigerJawLevel2Part1UpdateInput, where: TigerJawLevel2Part1Where): UpdateTigerJawLevel2Part1sMutationResponse!
              updateTigerJawLevel2s(update: TigerJawLevel2UpdateInput, where: TigerJawLevel2Where): UpdateTigerJawLevel2sMutationResponse!
              updateTigers(update: TigerUpdateInput, where: TigerWhere): UpdateTigersMutationResponse!
            }

            \\"\\"\\"Pagination information (Relay)\\"\\"\\"
            type PageInfo {
              endCursor: String
              hasNextPage: Boolean!
              hasPreviousPage: Boolean!
              startCursor: String
            }

            type Query {
              tigerJawLevel2Part1s(limit: Int, offset: Int, sort: [TigerJawLevel2Part1Sort!], where: TigerJawLevel2Part1Where): [TigerJawLevel2Part1!]!
              tigerJawLevel2Part1sConnection(after: String, first: Int, sort: [TigerJawLevel2Part1Sort!], where: TigerJawLevel2Part1Where): TigerJawLevel2Part1sConnection!
              tigerJawLevel2s(limit: Int, offset: Int, sort: [TigerJawLevel2Sort!], where: TigerJawLevel2Where): [TigerJawLevel2!]!
              tigerJawLevel2sConnection(after: String, first: Int, sort: [TigerJawLevel2Sort!], where: TigerJawLevel2Where): TigerJawLevel2sConnection!
              tigers(limit: Int, offset: Int, sort: [TigerSort!], where: TigerWhere): [Tiger!]!
              tigersConnection(after: String, first: Int, sort: [TigerSort!], where: TigerWhere): TigersConnection!
            }

            \\"\\"\\"An enum for sorting in either ascending or descending order.\\"\\"\\"
            enum SortDirection {
              \\"\\"\\"Sort by field values in ascending order.\\"\\"\\"
              ASC
              \\"\\"\\"Sort by field values in descending order.\\"\\"\\"
              DESC
            }

            type Tiger {
              x: Int
            }

            type TigerAggregate {
              count: Count!
              node: TigerAggregateNode!
            }

            type TigerAggregateNode {
              x: IntAggregateSelection!
            }

            input TigerConnectWhere {
              node: TigerWhere!
            }

            input TigerCreateInput {
              x: Int
            }

            type TigerEdge {
              cursor: String!
              node: Tiger!
            }

            type TigerJawLevel2 {
              id: ID
              part1(limit: Int, offset: Int, sort: [TigerJawLevel2Part1Sort!], where: TigerJawLevel2Part1Where): [TigerJawLevel2Part1!]!
              part1Connection(after: String, first: Int, sort: [TigerJawLevel2Part1ConnectionSort!], where: TigerJawLevel2Part1ConnectionWhere): TigerJawLevel2Part1Connection!
            }

            type TigerJawLevel2Aggregate {
              count: Count!
            }

            input TigerJawLevel2CreateInput {
              id: ID
              part1: TigerJawLevel2Part1FieldInput
            }

            input TigerJawLevel2DeleteInput {
              part1: [TigerJawLevel2Part1DeleteFieldInput!]
            }

            type TigerJawLevel2Edge {
              cursor: String!
              node: TigerJawLevel2!
            }

            type TigerJawLevel2Part1 {
              id: ID
              tiger(limit: Int, offset: Int, sort: [TigerSort!], where: TigerWhere): [Tiger!]!
              tigerConnection(after: String, first: Int, sort: [TigerJawLevel2Part1TigerConnectionSort!], where: TigerJawLevel2Part1TigerConnectionWhere): TigerJawLevel2Part1TigerConnection!
            }

            type TigerJawLevel2Part1Aggregate {
              count: Count!
            }

            input TigerJawLevel2Part1AggregateInput {
              AND: [TigerJawLevel2Part1AggregateInput!]
              NOT: TigerJawLevel2Part1AggregateInput
              OR: [TigerJawLevel2Part1AggregateInput!]
              count: IntScalarFilters
              count_EQ: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { eq: ... } } }' instead.\\")
              count_GT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gt: ... } } }' instead.\\")
              count_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gte: ... } } }' instead.\\")
              count_LT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lt: ... } } }' instead.\\")
              count_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lte: ... } } }' instead.\\")
            }

            input TigerJawLevel2Part1ConnectFieldInput {
              connect: [TigerJawLevel2Part1ConnectInput!]
              where: TigerJawLevel2Part1ConnectWhere
            }

            input TigerJawLevel2Part1ConnectInput {
              tiger: [TigerJawLevel2Part1TigerConnectFieldInput!]
            }

            input TigerJawLevel2Part1ConnectWhere {
              node: TigerJawLevel2Part1Where!
            }

            type TigerJawLevel2Part1Connection {
              aggregate: TigerJawLevel2TigerJawLevel2Part1Part1AggregateSelection!
              edges: [TigerJawLevel2Part1Relationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input TigerJawLevel2Part1ConnectionAggregateInput {
              AND: [TigerJawLevel2Part1ConnectionAggregateInput!]
              NOT: TigerJawLevel2Part1ConnectionAggregateInput
              OR: [TigerJawLevel2Part1ConnectionAggregateInput!]
              count: ConnectionAggregationCountFilterInput
            }

            input TigerJawLevel2Part1ConnectionFilters {
              \\"\\"\\"
              Filter TigerJawLevel2s by aggregating results on related TigerJawLevel2Part1Connections
              \\"\\"\\"
              aggregate: TigerJawLevel2Part1ConnectionAggregateInput
              \\"\\"\\"
              Return TigerJawLevel2s where all of the related TigerJawLevel2Part1Connections match this filter
              \\"\\"\\"
              all: TigerJawLevel2Part1ConnectionWhere
              \\"\\"\\"
              Return TigerJawLevel2s where none of the related TigerJawLevel2Part1Connections match this filter
              \\"\\"\\"
              none: TigerJawLevel2Part1ConnectionWhere
              \\"\\"\\"
              Return TigerJawLevel2s where one of the related TigerJawLevel2Part1Connections match this filter
              \\"\\"\\"
              single: TigerJawLevel2Part1ConnectionWhere
              \\"\\"\\"
              Return TigerJawLevel2s where some of the related TigerJawLevel2Part1Connections match this filter
              \\"\\"\\"
              some: TigerJawLevel2Part1ConnectionWhere
            }

            input TigerJawLevel2Part1ConnectionSort {
              node: TigerJawLevel2Part1Sort
            }

            input TigerJawLevel2Part1ConnectionWhere {
              AND: [TigerJawLevel2Part1ConnectionWhere!]
              NOT: TigerJawLevel2Part1ConnectionWhere
              OR: [TigerJawLevel2Part1ConnectionWhere!]
              node: TigerJawLevel2Part1Where
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
              tiger: [TigerJawLevel2Part1TigerDeleteFieldInput!]
            }

            input TigerJawLevel2Part1DisconnectFieldInput {
              disconnect: TigerJawLevel2Part1DisconnectInput
              where: TigerJawLevel2Part1ConnectionWhere
            }

            input TigerJawLevel2Part1DisconnectInput {
              tiger: [TigerJawLevel2Part1TigerDisconnectFieldInput!]
            }

            type TigerJawLevel2Part1Edge {
              cursor: String!
              node: TigerJawLevel2Part1!
            }

            input TigerJawLevel2Part1FieldInput {
              connect: [TigerJawLevel2Part1ConnectFieldInput!]
              create: [TigerJawLevel2Part1CreateFieldInput!]
            }

            type TigerJawLevel2Part1Relationship {
              cursor: String!
              node: TigerJawLevel2Part1!
            }

            input TigerJawLevel2Part1RelationshipFilters {
              \\"\\"\\"
              Filter type where all of the related TigerJawLevel2Part1s match this filter
              \\"\\"\\"
              all: TigerJawLevel2Part1Where
              \\"\\"\\"
              Filter type where none of the related TigerJawLevel2Part1s match this filter
              \\"\\"\\"
              none: TigerJawLevel2Part1Where
              \\"\\"\\"
              Filter type where one of the related TigerJawLevel2Part1s match this filter
              \\"\\"\\"
              single: TigerJawLevel2Part1Where
              \\"\\"\\"
              Filter type where some of the related TigerJawLevel2Part1s match this filter
              \\"\\"\\"
              some: TigerJawLevel2Part1Where
            }

            \\"\\"\\"
            Fields to sort TigerJawLevel2Part1s by. The order in which sorts are applied is not guaranteed when specifying many fields in one TigerJawLevel2Part1Sort object.
            \\"\\"\\"
            input TigerJawLevel2Part1Sort {
              id: SortDirection
            }

            input TigerJawLevel2Part1TigerAggregateInput {
              AND: [TigerJawLevel2Part1TigerAggregateInput!]
              NOT: TigerJawLevel2Part1TigerAggregateInput
              OR: [TigerJawLevel2Part1TigerAggregateInput!]
              count: IntScalarFilters
              count_EQ: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { eq: ... } } }' instead.\\")
              count_GT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gt: ... } } }' instead.\\")
              count_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gte: ... } } }' instead.\\")
              count_LT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lt: ... } } }' instead.\\")
              count_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lte: ... } } }' instead.\\")
              node: TigerJawLevel2Part1TigerNodeAggregationWhereInput
            }

            input TigerJawLevel2Part1TigerConnectFieldInput {
              where: TigerConnectWhere
            }

            type TigerJawLevel2Part1TigerConnection {
              aggregate: TigerJawLevel2Part1TigerTigerAggregateSelection!
              edges: [TigerJawLevel2Part1TigerRelationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input TigerJawLevel2Part1TigerConnectionAggregateInput {
              AND: [TigerJawLevel2Part1TigerConnectionAggregateInput!]
              NOT: TigerJawLevel2Part1TigerConnectionAggregateInput
              OR: [TigerJawLevel2Part1TigerConnectionAggregateInput!]
              count: ConnectionAggregationCountFilterInput
              node: TigerJawLevel2Part1TigerNodeAggregationWhereInput
            }

            input TigerJawLevel2Part1TigerConnectionFilters {
              \\"\\"\\"
              Filter TigerJawLevel2Part1s by aggregating results on related TigerJawLevel2Part1TigerConnections
              \\"\\"\\"
              aggregate: TigerJawLevel2Part1TigerConnectionAggregateInput
              \\"\\"\\"
              Return TigerJawLevel2Part1s where all of the related TigerJawLevel2Part1TigerConnections match this filter
              \\"\\"\\"
              all: TigerJawLevel2Part1TigerConnectionWhere
              \\"\\"\\"
              Return TigerJawLevel2Part1s where none of the related TigerJawLevel2Part1TigerConnections match this filter
              \\"\\"\\"
              none: TigerJawLevel2Part1TigerConnectionWhere
              \\"\\"\\"
              Return TigerJawLevel2Part1s where one of the related TigerJawLevel2Part1TigerConnections match this filter
              \\"\\"\\"
              single: TigerJawLevel2Part1TigerConnectionWhere
              \\"\\"\\"
              Return TigerJawLevel2Part1s where some of the related TigerJawLevel2Part1TigerConnections match this filter
              \\"\\"\\"
              some: TigerJawLevel2Part1TigerConnectionWhere
            }

            input TigerJawLevel2Part1TigerConnectionSort {
              node: TigerSort
            }

            input TigerJawLevel2Part1TigerConnectionWhere {
              AND: [TigerJawLevel2Part1TigerConnectionWhere!]
              NOT: TigerJawLevel2Part1TigerConnectionWhere
              OR: [TigerJawLevel2Part1TigerConnectionWhere!]
              node: TigerWhere
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
              connect: [TigerJawLevel2Part1TigerConnectFieldInput!]
              create: [TigerJawLevel2Part1TigerCreateFieldInput!]
            }

            input TigerJawLevel2Part1TigerNodeAggregationWhereInput {
              AND: [TigerJawLevel2Part1TigerNodeAggregationWhereInput!]
              NOT: TigerJawLevel2Part1TigerNodeAggregationWhereInput
              OR: [TigerJawLevel2Part1TigerNodeAggregationWhereInput!]
              x: IntScalarAggregationFilters
              x_AVERAGE_EQUAL: Float @deprecated(reason: \\"Please use the relevant generic filter 'x: { average: { eq: ... } } }' instead.\\")
              x_AVERAGE_GT: Float @deprecated(reason: \\"Please use the relevant generic filter 'x: { average: { gt: ... } } }' instead.\\")
              x_AVERAGE_GTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'x: { average: { gte: ... } } }' instead.\\")
              x_AVERAGE_LT: Float @deprecated(reason: \\"Please use the relevant generic filter 'x: { average: { lt: ... } } }' instead.\\")
              x_AVERAGE_LTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'x: { average: { lte: ... } } }' instead.\\")
              x_MAX_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'x: { max: { eq: ... } } }' instead.\\")
              x_MAX_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'x: { max: { gt: ... } } }' instead.\\")
              x_MAX_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'x: { max: { gte: ... } } }' instead.\\")
              x_MAX_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'x: { max: { lt: ... } } }' instead.\\")
              x_MAX_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'x: { max: { lte: ... } } }' instead.\\")
              x_MIN_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'x: { min: { eq: ... } } }' instead.\\")
              x_MIN_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'x: { min: { gt: ... } } }' instead.\\")
              x_MIN_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'x: { min: { gte: ... } } }' instead.\\")
              x_MIN_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'x: { min: { lt: ... } } }' instead.\\")
              x_MIN_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'x: { min: { lte: ... } } }' instead.\\")
              x_SUM_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'x: { sum: { eq: ... } } }' instead.\\")
              x_SUM_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'x: { sum: { gt: ... } } }' instead.\\")
              x_SUM_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'x: { sum: { gte: ... } } }' instead.\\")
              x_SUM_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'x: { sum: { lt: ... } } }' instead.\\")
              x_SUM_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'x: { sum: { lte: ... } } }' instead.\\")
            }

            type TigerJawLevel2Part1TigerRelationship {
              cursor: String!
              node: Tiger!
            }

            type TigerJawLevel2Part1TigerTigerAggregateSelection {
              count: CountConnection!
              node: TigerJawLevel2Part1TigerTigerNodeAggregateSelection
            }

            type TigerJawLevel2Part1TigerTigerNodeAggregateSelection {
              x: IntAggregateSelection!
            }

            input TigerJawLevel2Part1TigerUpdateConnectionInput {
              node: TigerUpdateInput
              where: TigerJawLevel2Part1TigerConnectionWhere
            }

            input TigerJawLevel2Part1TigerUpdateFieldInput {
              connect: [TigerJawLevel2Part1TigerConnectFieldInput!]
              create: [TigerJawLevel2Part1TigerCreateFieldInput!]
              delete: [TigerJawLevel2Part1TigerDeleteFieldInput!]
              disconnect: [TigerJawLevel2Part1TigerDisconnectFieldInput!]
              update: TigerJawLevel2Part1TigerUpdateConnectionInput
            }

            input TigerJawLevel2Part1UpdateConnectionInput {
              node: TigerJawLevel2Part1UpdateInput
              where: TigerJawLevel2Part1ConnectionWhere
            }

            input TigerJawLevel2Part1UpdateFieldInput {
              connect: [TigerJawLevel2Part1ConnectFieldInput!]
              create: [TigerJawLevel2Part1CreateFieldInput!]
              delete: [TigerJawLevel2Part1DeleteFieldInput!]
              disconnect: [TigerJawLevel2Part1DisconnectFieldInput!]
              update: TigerJawLevel2Part1UpdateConnectionInput
            }

            input TigerJawLevel2Part1UpdateInput {
              id: IDScalarMutations
              id_SET: ID @deprecated(reason: \\"Please use the generic mutation 'id: { set: ... } }' instead.\\")
              tiger: [TigerJawLevel2Part1TigerUpdateFieldInput!]
            }

            input TigerJawLevel2Part1Where {
              AND: [TigerJawLevel2Part1Where!]
              NOT: TigerJawLevel2Part1Where
              OR: [TigerJawLevel2Part1Where!]
              id: IDScalarFilters
              id_CONTAINS: ID @deprecated(reason: \\"Please use the relevant generic filter id: { contains: ... }\\")
              id_ENDS_WITH: ID @deprecated(reason: \\"Please use the relevant generic filter id: { endsWith: ... }\\")
              id_EQ: ID @deprecated(reason: \\"Please use the relevant generic filter id: { eq: ... }\\")
              id_IN: [ID] @deprecated(reason: \\"Please use the relevant generic filter id: { in: ... }\\")
              id_STARTS_WITH: ID @deprecated(reason: \\"Please use the relevant generic filter id: { startsWith: ... }\\")
              tiger: TigerRelationshipFilters
              tigerAggregate: TigerJawLevel2Part1TigerAggregateInput @deprecated(reason: \\"Aggregate filters are moved inside the tigerConnection filter, please use { tigerConnection: { aggregate: {...} } } instead\\")
              tigerConnection: TigerJawLevel2Part1TigerConnectionFilters
              \\"\\"\\"
              Return TigerJawLevel2Part1s where all of the related TigerJawLevel2Part1TigerConnections match this filter
              \\"\\"\\"
              tigerConnection_ALL: TigerJawLevel2Part1TigerConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'tigerConnection: { all: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return TigerJawLevel2Part1s where none of the related TigerJawLevel2Part1TigerConnections match this filter
              \\"\\"\\"
              tigerConnection_NONE: TigerJawLevel2Part1TigerConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'tigerConnection: { none: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return TigerJawLevel2Part1s where one of the related TigerJawLevel2Part1TigerConnections match this filter
              \\"\\"\\"
              tigerConnection_SINGLE: TigerJawLevel2Part1TigerConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'tigerConnection: { single: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return TigerJawLevel2Part1s where some of the related TigerJawLevel2Part1TigerConnections match this filter
              \\"\\"\\"
              tigerConnection_SOME: TigerJawLevel2Part1TigerConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'tigerConnection: { some: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return TigerJawLevel2Part1s where all of the related Tigers match this filter
              \\"\\"\\"
              tiger_ALL: TigerWhere @deprecated(reason: \\"Please use the relevant generic filter 'tiger: { all: ... }' instead.\\")
              \\"\\"\\"
              Return TigerJawLevel2Part1s where none of the related Tigers match this filter
              \\"\\"\\"
              tiger_NONE: TigerWhere @deprecated(reason: \\"Please use the relevant generic filter 'tiger: { none: ... }' instead.\\")
              \\"\\"\\"
              Return TigerJawLevel2Part1s where one of the related Tigers match this filter
              \\"\\"\\"
              tiger_SINGLE: TigerWhere @deprecated(reason: \\"Please use the relevant generic filter 'tiger: {  single: ... }' instead.\\")
              \\"\\"\\"
              Return TigerJawLevel2Part1s where some of the related Tigers match this filter
              \\"\\"\\"
              tiger_SOME: TigerWhere @deprecated(reason: \\"Please use the relevant generic filter 'tiger: {  some: ... }' instead.\\")
            }

            type TigerJawLevel2Part1sConnection {
              aggregate: TigerJawLevel2Part1Aggregate!
              edges: [TigerJawLevel2Part1Edge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            \\"\\"\\"
            Fields to sort TigerJawLevel2s by. The order in which sorts are applied is not guaranteed when specifying many fields in one TigerJawLevel2Sort object.
            \\"\\"\\"
            input TigerJawLevel2Sort {
              id: SortDirection
            }

            type TigerJawLevel2TigerJawLevel2Part1Part1AggregateSelection {
              count: CountConnection!
            }

            input TigerJawLevel2UpdateInput {
              id: IDScalarMutations
              id_SET: ID @deprecated(reason: \\"Please use the generic mutation 'id: { set: ... } }' instead.\\")
              part1: [TigerJawLevel2Part1UpdateFieldInput!]
            }

            input TigerJawLevel2Where {
              AND: [TigerJawLevel2Where!]
              NOT: TigerJawLevel2Where
              OR: [TigerJawLevel2Where!]
              id: IDScalarFilters
              id_CONTAINS: ID @deprecated(reason: \\"Please use the relevant generic filter id: { contains: ... }\\")
              id_ENDS_WITH: ID @deprecated(reason: \\"Please use the relevant generic filter id: { endsWith: ... }\\")
              id_EQ: ID @deprecated(reason: \\"Please use the relevant generic filter id: { eq: ... }\\")
              id_IN: [ID] @deprecated(reason: \\"Please use the relevant generic filter id: { in: ... }\\")
              id_STARTS_WITH: ID @deprecated(reason: \\"Please use the relevant generic filter id: { startsWith: ... }\\")
              part1: TigerJawLevel2Part1RelationshipFilters
              part1Aggregate: TigerJawLevel2Part1AggregateInput @deprecated(reason: \\"Aggregate filters are moved inside the part1Connection filter, please use { part1Connection: { aggregate: {...} } } instead\\")
              part1Connection: TigerJawLevel2Part1ConnectionFilters
              \\"\\"\\"
              Return TigerJawLevel2s where all of the related TigerJawLevel2Part1Connections match this filter
              \\"\\"\\"
              part1Connection_ALL: TigerJawLevel2Part1ConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'part1Connection: { all: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return TigerJawLevel2s where none of the related TigerJawLevel2Part1Connections match this filter
              \\"\\"\\"
              part1Connection_NONE: TigerJawLevel2Part1ConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'part1Connection: { none: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return TigerJawLevel2s where one of the related TigerJawLevel2Part1Connections match this filter
              \\"\\"\\"
              part1Connection_SINGLE: TigerJawLevel2Part1ConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'part1Connection: { single: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return TigerJawLevel2s where some of the related TigerJawLevel2Part1Connections match this filter
              \\"\\"\\"
              part1Connection_SOME: TigerJawLevel2Part1ConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'part1Connection: { some: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return TigerJawLevel2s where all of the related TigerJawLevel2Part1s match this filter
              \\"\\"\\"
              part1_ALL: TigerJawLevel2Part1Where @deprecated(reason: \\"Please use the relevant generic filter 'part1: { all: ... }' instead.\\")
              \\"\\"\\"
              Return TigerJawLevel2s where none of the related TigerJawLevel2Part1s match this filter
              \\"\\"\\"
              part1_NONE: TigerJawLevel2Part1Where @deprecated(reason: \\"Please use the relevant generic filter 'part1: { none: ... }' instead.\\")
              \\"\\"\\"
              Return TigerJawLevel2s where one of the related TigerJawLevel2Part1s match this filter
              \\"\\"\\"
              part1_SINGLE: TigerJawLevel2Part1Where @deprecated(reason: \\"Please use the relevant generic filter 'part1: {  single: ... }' instead.\\")
              \\"\\"\\"
              Return TigerJawLevel2s where some of the related TigerJawLevel2Part1s match this filter
              \\"\\"\\"
              part1_SOME: TigerJawLevel2Part1Where @deprecated(reason: \\"Please use the relevant generic filter 'part1: {  some: ... }' instead.\\")
            }

            type TigerJawLevel2sConnection {
              aggregate: TigerJawLevel2Aggregate!
              edges: [TigerJawLevel2Edge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input TigerRelationshipFilters {
              \\"\\"\\"Filter type where all of the related Tigers match this filter\\"\\"\\"
              all: TigerWhere
              \\"\\"\\"Filter type where none of the related Tigers match this filter\\"\\"\\"
              none: TigerWhere
              \\"\\"\\"Filter type where one of the related Tigers match this filter\\"\\"\\"
              single: TigerWhere
              \\"\\"\\"Filter type where some of the related Tigers match this filter\\"\\"\\"
              some: TigerWhere
            }

            \\"\\"\\"
            Fields to sort Tigers by. The order in which sorts are applied is not guaranteed when specifying many fields in one TigerSort object.
            \\"\\"\\"
            input TigerSort {
              x: SortDirection
            }

            input TigerUpdateInput {
              x: IntScalarMutations
              x_DECREMENT: Int @deprecated(reason: \\"Please use the relevant generic mutation 'x: { decrement: ... } }' instead.\\")
              x_INCREMENT: Int @deprecated(reason: \\"Please use the relevant generic mutation 'x: { increment: ... } }' instead.\\")
              x_SET: Int @deprecated(reason: \\"Please use the generic mutation 'x: { set: ... } }' instead.\\")
            }

            input TigerWhere {
              AND: [TigerWhere!]
              NOT: TigerWhere
              OR: [TigerWhere!]
              x: IntScalarFilters
              x_EQ: Int @deprecated(reason: \\"Please use the relevant generic filter x: { eq: ... }\\")
              x_GT: Int @deprecated(reason: \\"Please use the relevant generic filter x: { gt: ... }\\")
              x_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter x: { gte: ... }\\")
              x_IN: [Int] @deprecated(reason: \\"Please use the relevant generic filter x: { in: ... }\\")
              x_LT: Int @deprecated(reason: \\"Please use the relevant generic filter x: { lt: ... }\\")
              x_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter x: { lte: ... }\\")
            }

            type TigersConnection {
              aggregate: TigerAggregate!
              edges: [TigerEdge!]!
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
            }"
        `);
    });
});
